/**
 * Cloud Storage Service for CVstomize
 *
 * Handles PDF uploads to Google Cloud Storage with:
 * - Secure bucket access
 * - Signed URL generation (temporary access)
 * - File lifecycle management
 * - Cost-effective storage class
 *
 * Uses @google-cloud/storage SDK
 */

const { Storage } = require('@google-cloud/storage');
const path = require('path');

class CloudStorageService {
  constructor() {
    // Initialize Google Cloud Storage
    // Uses Application Default Credentials (ADC) in production
    // or GOOGLE_APPLICATION_CREDENTIALS environment variable
    this.storage = new Storage({
      projectId: process.env.GCP_PROJECT_ID || 'cvstomize'
    });

    // Bucket configuration
    this.bucketName = process.env.GCS_RESUMES_BUCKET || 'cvstomize-resumes-prod';
    this.bucket = this.storage.bucket(this.bucketName);

    // Signed URL expiration (7 days default)
    this.signedUrlExpiryDays = parseInt(process.env.SIGNED_URL_EXPIRY_DAYS || '7', 10);

    console.log(`✅ Cloud Storage initialized: ${this.bucketName}`);
  }

  /**
   * Upload PDF to Cloud Storage
   * @param {Buffer} pdfBuffer - PDF file buffer
   * @param {string} userId - User ID (for path organization)
   * @param {string} resumeId - Resume ID
   * @param {string} filename - Original filename
   * @returns {Promise<{gsPath, publicUrl, bucket}>}
   */
  async uploadPDF(pdfBuffer, userId, resumeId, filename) {
    try {
      // Generate storage path: resumes/{userId}/{resumeId}.pdf
      const sanitizedFilename = this._sanitizeFilename(filename);
      const storagePath = `resumes/${userId}/${resumeId}.pdf`;

      // Create file reference
      const file = this.bucket.file(storagePath);

      // Upload with metadata
      await file.save(pdfBuffer, {
        metadata: {
          contentType: 'application/pdf',
          cacheControl: 'public, max-age=86400', // 24 hours
          metadata: {
            userId,
            resumeId,
            originalFilename: sanitizedFilename,
            uploadedAt: new Date().toISOString()
          }
        },
        // Resume uploads can be publicly readable (via signed URLs)
        // or private (requires authentication)
        public: false, // Keep private, use signed URLs
        validation: 'md5' // Verify upload integrity
      });

      console.log(`✅ PDF uploaded: gs://${this.bucketName}/${storagePath}`);

      return {
        gsPath: storagePath,
        bucket: this.bucketName,
        size: pdfBuffer.length,
        uploadedAt: new Date()
      };

    } catch (error) {
      console.error('PDF upload failed:', error);
      throw new Error(`Failed to upload PDF to Cloud Storage: ${error.message}`);
    }
  }

  /**
   * Generate signed URL for temporary access
   * @param {string} gsPath - Cloud Storage path
   * @param {number} expiryHours - URL expiry in hours (default 168 = 7 days)
   * @returns {Promise<string>} Signed URL
   */
  async generateSignedUrl(gsPath, expiryHours = null) {
    try {
      const file = this.bucket.file(gsPath);

      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        throw new Error(`File not found: ${gsPath}`);
      }

      // Calculate expiry
      const expiry = expiryHours
        ? Date.now() + (expiryHours * 60 * 60 * 1000)
        : Date.now() + (this.signedUrlExpiryDays * 24 * 60 * 60 * 1000);

      // Generate signed URL
      const [signedUrl] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: expiry
      });

      console.log(`✅ Signed URL generated for: ${gsPath} (expires in ${expiryHours || this.signedUrlExpiryDays * 24}h)`);

      return signedUrl;

    } catch (error) {
      console.error('Signed URL generation failed:', error);
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
  }

  /**
   * Delete PDF from Cloud Storage
   * @param {string} gsPath - Cloud Storage path
   * @returns {Promise<void>}
   */
  async deletePDF(gsPath) {
    try {
      const file = this.bucket.file(gsPath);

      // Check if file exists before deleting
      const [exists] = await file.exists();
      if (!exists) {
        console.warn(`File not found (already deleted?): ${gsPath}`);
        return;
      }

      await file.delete();
      console.log(`✅ PDF deleted: gs://${this.bucketName}/${gsPath}`);

    } catch (error) {
      console.error('PDF deletion failed:', error);
      throw new Error(`Failed to delete PDF: ${error.message}`);
    }
  }

  /**
   * Check if PDF exists in Cloud Storage
   * @param {string} gsPath - Cloud Storage path
   * @returns {Promise<boolean>}
   */
  async pdfExists(gsPath) {
    try {
      const file = this.bucket.file(gsPath);
      const [exists] = await file.exists();
      return exists;
    } catch (error) {
      console.error('Error checking PDF existence:', error);
      return false;
    }
  }

  /**
   * Get PDF metadata
   * @param {string} gsPath - Cloud Storage path
   * @returns {Promise<Object>}
   */
  async getPDFMetadata(gsPath) {
    try {
      const file = this.bucket.file(gsPath);
      const [metadata] = await file.getMetadata();

      return {
        name: metadata.name,
        size: parseInt(metadata.size, 10),
        contentType: metadata.contentType,
        created: metadata.timeCreated,
        updated: metadata.updated,
        md5Hash: metadata.md5Hash,
        customMetadata: metadata.metadata || {}
      };

    } catch (error) {
      console.error('Failed to get PDF metadata:', error);
      throw new Error(`Failed to retrieve PDF metadata: ${error.message}`);
    }
  }

  /**
   * Download PDF from Cloud Storage (for caching or local processing)
   * @param {string} gsPath - Cloud Storage path
   * @returns {Promise<Buffer>}
   */
  async downloadPDF(gsPath) {
    try {
      const file = this.bucket.file(gsPath);
      const [buffer] = await file.download();

      console.log(`✅ PDF downloaded: ${gsPath} (${(buffer.length / 1024).toFixed(2)}KB)`);
      return buffer;

    } catch (error) {
      console.error('PDF download failed:', error);
      throw new Error(`Failed to download PDF: ${error.message}`);
    }
  }

  /**
   * List all PDFs for a user
   * @param {string} userId - User ID
   * @param {number} maxResults - Maximum number of results (default 100)
   * @returns {Promise<Array>}
   */
  async listUserPDFs(userId, maxResults = 100) {
    try {
      const prefix = `resumes/${userId}/`;
      const [files] = await this.bucket.getFiles({
        prefix,
        maxResults
      });

      return files.map(file => ({
        name: file.name,
        size: parseInt(file.metadata.size, 10),
        created: file.metadata.timeCreated,
        updated: file.metadata.updated
      }));

    } catch (error) {
      console.error('Failed to list user PDFs:', error);
      throw new Error(`Failed to list PDFs: ${error.message}`);
    }
  }

  /**
   * Check if bucket is accessible (health check)
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    try {
      const [exists] = await this.bucket.exists();
      if (!exists) {
        console.error(`Bucket does not exist: ${this.bucketName}`);
        return false;
      }

      // Try to list files (with limit 1) to verify permissions
      await this.bucket.getFiles({ maxResults: 1 });

      console.log(`✅ Cloud Storage health check passed: ${this.bucketName}`);
      return true;

    } catch (error) {
      console.error('Cloud Storage health check failed:', error);
      return false;
    }
  }

  // ========== PRIVATE HELPER METHODS ==========

  /**
   * Sanitize filename for Cloud Storage
   * Removes special characters and spaces
   */
  _sanitizeFilename(filename) {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars with underscore
      .replace(/_{2,}/g, '_') // Collapse multiple underscores
      .substring(0, 255); // GCS filename limit
  }
}

// Export singleton
const cloudStorageService = new CloudStorageService();
module.exports = cloudStorageService;
