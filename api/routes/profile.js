const express = require("express");
const router = express.Router();
const multer = require("multer");
const { PrismaClient } = require("@prisma/client");
const { verifyFirebaseToken } = require("../middleware/authMiddleware");
const {
  parseResume,
  extractTextFromFile,
} = require("../services/resumeParser");

const prisma = new PrismaClient();

// Configure multer for file uploads (in-memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error("Invalid file type. Please upload a PDF, DOCX, or TXT file.")
      );
    }
  },
});

/**
 * POST /api/profile/parse-resume
 * Upload and parse a resume file to extract profile data
 * Optionally saves the resume to the user's account
 * Requires valid Firebase token
 */
router.post(
  "/parse-resume",
  verifyFirebaseToken,
  upload.single("resume"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: "No File Uploaded",
          message: "Please upload a resume file (PDF, DOCX, or TXT)",
        });
      }

      const { saveToAccount, label } = req.body;
      console.log(
        "📄 Parsing resume file:",
        req.file.originalname,
        req.file.mimetype,
        "saveToAccount:",
        saveToAccount
      );

      // Extract text from file
      const resumeText = await extractTextFromFile(
        req.file.buffer,
        req.file.mimetype
      );

      if (!resumeText || resumeText.trim().length < 50) {
        return res.status(400).json({
          error: "Invalid Resume",
          message:
            "Could not extract text from the uploaded file. Please try a different format.",
        });
      }

      // Parse resume using AI
      const result = await parseResume(resumeText);

      // If saveToAccount is true, save the uploaded resume
      let savedResume = null;
      if (saveToAccount === "true" || saveToAccount === true) {
        const { firebaseUid } = req.user;
        const user = await prisma.user.findUnique({
          where: { firebaseUid },
          select: { id: true },
        });

        if (user) {
          // Check existing resume count - limit to 5 uploaded resumes
          const existingCount = await prisma.uploadedResume.count({
            where: { userId: user.id },
          });

          const MAX_UPLOADED_RESUMES = 5;
          if (existingCount >= MAX_UPLOADED_RESUMES) {
            return res.status(400).json({
              error: "Upload Limit Reached",
              message: `You can only store up to ${MAX_UPLOADED_RESUMES} uploaded resumes. Please delete an existing resume before uploading a new one.`,
              currentCount: existingCount,
              maxAllowed: MAX_UPLOADED_RESUMES,
            });
          }

          savedResume = await prisma.uploadedResume.create({
            data: {
              userId: user.id,
              filename: req.file.originalname,
              mimeType: req.file.mimetype,
              fileSize: req.file.size,
              rawText: resumeText,
              parsedData: result.data,
              isPrimary: existingCount === 0, // First upload is primary
              label: label || null,
            },
          });
          console.log("💾 Saved uploaded resume to account:", savedResume.id);
        }
      }

      res.status(200).json({
        message: "Resume parsed successfully",
        extractedData: result.data,
        tokensUsed: result.tokensUsed,
        savedResume: savedResume
          ? {
              id: savedResume.id,
              filename: savedResume.filename,
              isPrimary: savedResume.isPrimary,
            }
          : null,
      });
    } catch (error) {
      console.error("Resume parsing error:", error);
      next(error);
    }
  }
);

/**
 * POST /api/profile/parse-resume-text
 * Parse pasted resume text to extract profile data
 * Requires valid Firebase token
 */
router.post(
  "/parse-resume-text",
  verifyFirebaseToken,
  async (req, res, next) => {
    try {
      const { resumeText } = req.body;

      if (!resumeText || resumeText.trim().length < 50) {
        return res.status(400).json({
          error: "Invalid Input",
          message: "Please provide resume text with at least 50 characters",
        });
      }

      console.log("📄 Parsing pasted resume text, length:", resumeText.length);

      // Parse resume using AI
      const result = await parseResume(resumeText);

      res.status(200).json({
        message: "Resume parsed successfully",
        extractedData: result.data,
        tokensUsed: result.tokensUsed,
      });
    } catch (error) {
      console.error("Resume parsing error:", error);
      next(error);
    }
  }
);

/**
 * POST /api/profile
 * Create or update user profile
 * Requires valid Firebase token
 */
router.post("/", verifyFirebaseToken, async (req, res, next) => {
  try {
    const { firebaseUid } = req.user;
    const { completeOnboarding, ...profileData } = req.body;

    console.log("📝 POST /api/profile - Starting profile update");
    console.log("👤 Firebase UID:", firebaseUid);
    console.log("✅ Complete onboarding flag:", completeOnboarding);
    console.log("📋 Profile data keys:", Object.keys(profileData));

    // Find user
    const user = await prisma.user.findUnique({
      where: { firebaseUid },
      select: { id: true, email: true, onboardingCompleted: true },
    });

    if (!user) {
      console.error("❌ User not found for Firebase UID:", firebaseUid);
      return res.status(404).json({
        error: "User Not Found",
        message: "User account not found",
      });
    }

    console.log(
      "✅ User found:",
      user.id,
      "Email:",
      user.email,
      "Onboarding completed:",
      user.onboardingCompleted
    );

    // Upsert profile
    console.log("💾 Attempting to upsert profile...");
    const profile = await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: profileData,
      create: {
        userId: user.id,
        ...profileData,
      },
    });

    console.log("✅ Profile upserted successfully:", profile.id);

    // If completeOnboarding flag is set, mark onboarding as completed
    if (completeOnboarding) {
      console.log("🎯 Marking onboarding as completed...");
      await prisma.user.update({
        where: { id: user.id },
        data: { onboardingCompleted: true },
      });
      console.log("✅ Onboarding marked as completed");
    }

    console.log("🎉 Profile update successful!");
    res.status(200).json({
      message: "Profile updated successfully",
      profile,
      onboardingCompleted: completeOnboarding || false,
    });
  } catch (error) {
    console.error("❌ ERROR in POST /api/profile:");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Error stack:", error.stack);

    if (error.meta) {
      console.error("Prisma error meta:", JSON.stringify(error.meta, null, 2));
    }

    if (error.code === "P2002") {
      console.error("❌ Unique constraint violation");
    } else if (error.code === "P2003") {
      console.error("❌ Foreign key constraint failed");
    } else if (error.code === "P2025") {
      console.error("❌ Record not found");
    }

    console.error("Request body received:", JSON.stringify(req.body, null, 2));

    next(error);
  }
});

/**
 * GET /api/profile
 * Get user profile
 * Requires valid Firebase token
 */
router.get("/", verifyFirebaseToken, async (req, res, next) => {
  try {
    const { firebaseUid } = req.user;

    const user = await prisma.user.findUnique({
      where: { firebaseUid },
      include: { profile: true },
    });

    if (!user) {
      return res.status(404).json({
        error: "User Not Found",
        message: "User account not found",
      });
    }

    res.status(200).json({
      profile: user.profile,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/profile/uploaded-resumes
 * Get all uploaded resumes for the user
 * Requires valid Firebase token
 */
router.get("/uploaded-resumes", verifyFirebaseToken, async (req, res, next) => {
  try {
    const { firebaseUid } = req.user;

    const user = await prisma.user.findUnique({
      where: { firebaseUid },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({
        error: "User Not Found",
        message: "User account not found",
      });
    }

    const uploadedResumes = await prisma.uploadedResume.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        filename: true,
        mimeType: true,
        fileSize: true,
        isPrimary: true,
        label: true,
        parsedData: true,
        rawText: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      uploadedResumes,
      count: uploadedResumes.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/profile/uploaded-resumes/:id
 * Get a specific uploaded resume with full content
 * Requires valid Firebase token
 */
router.get(
  "/uploaded-resumes/:id",
  verifyFirebaseToken,
  async (req, res, next) => {
    try {
      const { firebaseUid } = req.user;
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { firebaseUid },
        select: { id: true },
      });

      if (!user) {
        return res.status(404).json({
          error: "User Not Found",
          message: "User account not found",
        });
      }

      const uploadedResume = await prisma.uploadedResume.findFirst({
        where: {
          id,
          userId: user.id,
        },
      });

      if (!uploadedResume) {
        return res.status(404).json({
          error: "Resume Not Found",
          message: "Uploaded resume not found",
        });
      }

      res.status(200).json({
        uploadedResume,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/profile/uploaded-resumes/:id
 * Delete an uploaded resume
 * Requires valid Firebase token
 */
router.delete(
  "/uploaded-resumes/:id",
  verifyFirebaseToken,
  async (req, res, next) => {
    try {
      const { firebaseUid } = req.user;
      const { id } = req.params;

      console.log("🗑️ DELETE uploaded resume request:", {
        firebaseUid,
        resumeId: id,
      });

      const user = await prisma.user.findUnique({
        where: { firebaseUid },
        select: { id: true },
      });

      if (!user) {
        console.log("❌ User not found for delete:", firebaseUid);
        return res.status(404).json({
          error: "User Not Found",
          message: "User account not found",
        });
      }

      console.log("✅ User found:", user.id);

      // Verify ownership
      const uploadedResume = await prisma.uploadedResume.findFirst({
        where: {
          id,
          userId: user.id,
        },
      });

      if (!uploadedResume) {
        console.log("❌ Resume not found or not owned:", {
          resumeId: id,
          userId: user.id,
        });
        return res.status(404).json({
          error: "Resume Not Found",
          message: "Uploaded resume not found",
        });
      }

      console.log("✅ Resume found, deleting:", uploadedResume.filename);

      await prisma.uploadedResume.delete({
        where: { id },
      });

      console.log("✅ Resume deleted successfully:", id);

      res.status(200).json({
        message: "Resume deleted successfully",
      });
    } catch (error) {
      console.error("❌ Error deleting resume:", error);
      next(error);
    }
  }
);

/**
 * PATCH /api/profile/uploaded-resumes/:id/primary
 * Set an uploaded resume as the primary resume
 * Requires valid Firebase token
 */
router.patch(
  "/uploaded-resumes/:id/primary",
  verifyFirebaseToken,
  async (req, res, next) => {
    try {
      const { firebaseUid } = req.user;
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { firebaseUid },
        select: { id: true },
      });

      if (!user) {
        return res.status(404).json({
          error: "User Not Found",
          message: "User account not found",
        });
      }

      // Verify ownership
      const uploadedResume = await prisma.uploadedResume.findFirst({
        where: {
          id,
          userId: user.id,
        },
      });

      if (!uploadedResume) {
        return res.status(404).json({
          error: "Resume Not Found",
          message: "Uploaded resume not found",
        });
      }

      // Unset all other resumes as primary
      await prisma.uploadedResume.updateMany({
        where: { userId: user.id },
        data: { isPrimary: false },
      });

      // Set this resume as primary
      const updatedResume = await prisma.uploadedResume.update({
        where: { id },
        data: { isPrimary: true },
      });

      res.status(200).json({
        message: "Primary resume updated",
        uploadedResume: {
          id: updatedResume.id,
          filename: updatedResume.filename,
          isPrimary: updatedResume.isPrimary,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/profile/uploaded-resumes/:id
 * Update an uploaded resume's content
 * Optionally sync changes to user profile
 * Requires valid Firebase token
 */
router.put(
  "/uploaded-resumes/:id",
  verifyFirebaseToken,
  async (req, res, next) => {
    try {
      const { firebaseUid } = req.user;
      const { id } = req.params;
      const { rawText, label, syncToProfile } = req.body;

      const user = await prisma.user.findUnique({
        where: { firebaseUid },
        select: { id: true },
      });

      if (!user) {
        return res.status(404).json({
          error: "User Not Found",
          message: "User account not found",
        });
      }

      // Verify ownership
      const existingResume = await prisma.uploadedResume.findFirst({
        where: {
          id,
          userId: user.id,
        },
      });

      if (!existingResume) {
        return res.status(404).json({
          error: "Resume Not Found",
          message: "Uploaded resume not found",
        });
      }

      // Build update data
      const updateData = {};
      if (rawText !== undefined) {
        updateData.rawText = rawText;
      }
      if (label !== undefined) {
        updateData.label = label;
      }

      // Update the resume
      const updatedResume = await prisma.uploadedResume.update({
        where: { id },
        data: updateData,
      });

      // If syncToProfile is requested, try to re-parse and update profile
      let profileUpdated = false;
      if (syncToProfile && rawText) {
        try {
          // Use Gemini to re-parse the resume
          const geminiService = require("../services/geminiServiceVertex");
          const model = geminiService.getFlashModel();

          const parsePrompt = `Parse this resume text and extract structured data. Return ONLY valid JSON with these fields:
{
  "fullName": "string",
  "email": "string", 
  "phone": "string",
  "location": "string",
  "headline": "string (professional title/headline)",
  "summary": "string",
  "skills": ["array", "of", "skills"],
  "workExperience": [
    {
      "company": "string",
      "title": "string",
      "startDate": "string",
      "endDate": "string or 'Present'",
      "description": "string"
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string",
      "graduationDate": "string"
    }
  ]
}

Resume text:
${rawText}`;

          const result = await model.generateContent(parsePrompt);
          const responseText = result.response.text();

          // Extract JSON from response
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsedData = JSON.parse(jsonMatch[0]);

            // Update parsedData on the resume
            await prisma.uploadedResume.update({
              where: { id },
              data: { parsedData },
            });

            // Update user profile with extracted data
            const profileUpdate = {};
            if (parsedData.fullName)
              profileUpdate.fullName = parsedData.fullName;
            if (parsedData.headline)
              profileUpdate.headline = parsedData.headline;
            if (parsedData.summary)
              profileUpdate.professionalSummary = parsedData.summary;
            if (parsedData.location)
              profileUpdate.location = parsedData.location;
            if (parsedData.phone) profileUpdate.phone = parsedData.phone;
            if (parsedData.skills?.length)
              profileUpdate.skills = parsedData.skills;
            if (parsedData.workExperience?.length)
              profileUpdate.workExperience = parsedData.workExperience;
            if (parsedData.education?.length)
              profileUpdate.education = parsedData.education;

            if (Object.keys(profileUpdate).length > 0) {
              await prisma.userProfile.upsert({
                where: { userId: user.id },
                create: {
                  userId: user.id,
                  ...profileUpdate,
                },
                update: profileUpdate,
              });
              profileUpdated = true;
            }
          }
        } catch (parseError) {
          console.warn(
            "Failed to parse and sync resume to profile:",
            parseError.message
          );
          // Continue - the resume update still succeeded
        }
      }

      res.status(200).json({
        message: "Resume updated successfully",
        profileUpdated,
        uploadedResume: {
          id: updatedResume.id,
          filename: updatedResume.filename,
          rawText: updatedResume.rawText,
          label: updatedResume.label,
          updatedAt: updatedResume.updatedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
