# Resume Tracking Implementation Plan

**Date**: 2025-11-04
**Priority**: HIGH - Critical for user management and subscription enforcement
**Status**: Planning

---

## 🎯 Problem Statement

**Current State**:
- Users generate resumes via `/api/generate-cv` endpoint
- Generated resumes are **NOT tracked** in database
- No link between resume PDFs and users
- Cannot enforce resume limits (free tier: 1 resume)
- Cannot show "My Resumes" page
- No analytics on resume generation

**Database Schema Available**:
The `resumes` table exists but is **not being used**:

```sql
CREATE TABLE resumes (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),

  -- Resume Details
  title VARCHAR(255),
  target_company VARCHAR(255),
  job_description TEXT,

  -- Generated Content
  resume_markdown TEXT,
  resume_html TEXT,

  -- File Storage
  pdf_url TEXT,
  pdf_bucket VARCHAR(255),
  pdf_path VARCHAR(500),

  -- Generation Metadata
  model_used VARCHAR(50),
  tokens_used INTEGER,
  generation_time_ms INTEGER,
  cost_usd DECIMAL(10, 6),

  -- Status
  status VARCHAR(50) DEFAULT 'draft',
  version INTEGER DEFAULT 1,

  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  downloaded_at TIMESTAMP,
  shared_at TIMESTAMP
);
```

---

## 🔍 Current Resume Generation Flow (Untracked)

```
Frontend (ProcessModal.js)
  ↓
Click "Generate My CV"
  ↓
Send FormData to /api/generate-cv
  - files[] (resume uploads)
  - resumeText (pasted resume)
  - personalStories
  - jobDescription
  - selectedSections
  ↓
Backend (api/generate-cv.js) - Vercel Serverless Function
  ↓
1. Extract text from files (mammoth.js)
2. Build Gemini prompt
3. Generate resume markdown
4. Convert markdown → HTML → PDF (Puppeteer)
  ↓
Return PDF blob to browser
  ↓
Frontend opens PDF in new window
  ↓
❌ NO DATABASE TRACKING
❌ NO USER ASSOCIATION
❌ NO RESUME LIMIT ENFORCEMENT
```

**Problem**: Completely stateless - resume is lost after browser closes

---

## ✅ Proposed Solution: Full Resume Tracking

### **Phase 1: Migrate generate-cv to Cloud Run Backend** (2 hours)

**Current**: `generate-cv.js` is a Vercel serverless function (stateless)
**Target**: Move to Express.js backend at `/api/resume/generate`

**Why Migrate?**
1. ✅ Access to PostgreSQL database (Vercel function has no DB connection)
2. ✅ Authentication middleware (verify Firebase token)
3. ✅ Consistent with other backend routes
4. ✅ Easier to track resumes and enforce limits
5. ✅ Can upload PDFs to Cloud Storage

**Implementation**:

```javascript
// api/routes/resume.js (NEW FILE)
const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { verifyFirebaseToken } = require('../middleware/auth');
const geminiServiceVertex = require('../services/geminiServiceVertex');
const { generatePDF } = require('../services/pdfGenerator');
const { uploadToCloudStorage } = require('../services/storage');

// POST /api/resume/generate - Generate tailored resume
router.post('/generate', verifyFirebaseToken, async (req, res, next) => {
  try {
    const { user } = req;

    // ✅ STEP 1: Check resume limit
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { resumesGenerated: true, resumesLimit: true, subscriptionTier: true }
    });

    if (userProfile.resumesGenerated >= userProfile.resumesLimit) {
      return res.status(403).json({
        error: 'Resume limit reached',
        message: `You've generated ${userProfile.resumesGenerated}/${userProfile.resumesLimit} resumes. Upgrade to Pro for unlimited resumes.`,
        upgradeUrl: '/pricing'
      });
    }

    // ✅ STEP 2: Extract input data
    const {
      resumeText,
      personalStories,
      jobDescription,
      selectedSections,
      targetCompany
    } = req.body;

    // Validate required fields
    if (!jobDescription || !selectedSections || selectedSections.length === 0) {
      return res.status(400).json({ error: 'Job description and sections required' });
    }

    const startTime = Date.now();

    // ✅ STEP 3: Load user profile and personality (if exists)
    const profile = await prisma.userProfile.findUnique({ where: { userId: user.id } });
    const personality = await prisma.personalityTrait.findUnique({ where: { userId: user.id } });

    // ✅ STEP 4: Build enhanced Gemini prompt with personality
    const prompt = buildResumePrompt({
      resumeText: resumeText || profile?.experience || '',
      personalStories: personalStories || '',
      jobDescription,
      selectedSections,
      personality: personality || null,
      profile: profile || null
    });

    // ✅ STEP 5: Generate resume markdown with Gemini 1.5 Pro
    const model = geminiServiceVertex.getProModel();
    const result = await model.generateContent(prompt);
    const response = result.response;
    const resumeMarkdown = response.candidates[0].content.parts[0].text;
    const tokensUsed = response.usageMetadata?.totalTokenCount || 0;

    // ✅ STEP 6: Convert markdown → HTML → PDF
    const resumeHtml = markdownToHtml(resumeMarkdown);
    const pdfBuffer = await generatePDF(resumeHtml);

    // ✅ STEP 7: Upload PDF to Cloud Storage
    const fileName = `resumes/${user.id}/${Date.now()}-resume.pdf`;
    const { publicUrl, gsPath } = await uploadToCloudStorage(pdfBuffer, fileName);

    const generationTime = Date.now() - startTime;

    // ✅ STEP 8: Save resume metadata to database
    const resume = await prisma.resume.create({
      data: {
        userId: user.id,
        title: targetCompany ? `Resume for ${targetCompany}` : 'Tailored Resume',
        targetCompany: targetCompany || null,
        jobDescription,
        resumeMarkdown,
        resumeHtml,
        pdfUrl: publicUrl,
        pdfBucket: 'cvstomize-resumes',
        pdfPath: gsPath,
        modelUsed: 'gemini-1.5-pro',
        tokensUsed,
        generationTimeMs: generationTime,
        costUsd: calculateCost(tokensUsed, 'gemini-1.5-pro'),
        status: 'generated'
      }
    });

    // ✅ STEP 9: Increment user resume counter
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resumesGenerated: { increment: 1 },
        updatedAt: new Date()
      }
    });

    // ✅ STEP 10: Return resume data + PDF URL
    return res.status(201).json({
      success: true,
      resume: {
        id: resume.id,
        title: resume.title,
        pdfUrl: publicUrl,
        downloadUrl: `/api/resume/${resume.id}/download`,
        previewUrl: `/resume/${resume.id}`,
        createdAt: resume.createdAt
      },
      usage: {
        resumesGenerated: userProfile.resumesGenerated + 1,
        resumesLimit: userProfile.resumesLimit,
        remainingResumes: userProfile.resumesLimit - (userProfile.resumesGenerated + 1)
      },
      metadata: {
        tokensUsed,
        generationTimeMs: generationTime,
        modelUsed: 'gemini-1.5-pro'
      }
    });

  } catch (error) {
    console.error('Resume generation error:', error);
    next(error);
  }
});

// Helper: Build personality-enhanced Gemini prompt
function buildResumePrompt({ resumeText, personalStories, jobDescription, selectedSections, personality, profile }) {
  let personalityGuidance = '';

  if (personality) {
    personalityGuidance = `
PERSONALITY-BASED FRAMING INSTRUCTIONS:

Based on the candidate's personality assessment:
- Openness: ${personality.openness}/100
  ${personality.openness > 70 ? '→ Emphasize innovation, creativity, and adaptability' : '→ Focus on proven methods and reliability'}

- Conscientiousness: ${personality.conscientiousness}/100
  ${personality.conscientiousness > 70 ? '→ Highlight attention to detail, organization, and thoroughness' : '→ Emphasize flexibility and quick adaptation'}

- Extraversion: ${personality.extraversion}/100
  ${personality.extraversion > 70 ? '→ Showcase team leadership, collaboration, and communication' : '→ Highlight independent work and deep focus'}

- Work Style: ${personality.workStyle}
  ${personality.workStyle === 'collaborative' ? '→ Emphasize teamwork and cross-functional projects' : '→ Highlight individual contributions'}

- Communication Style: ${personality.communicationStyle}
  ${personality.communicationStyle === 'analytical' ? '→ Use data-driven language and metrics' : '→ Focus on impact and outcomes'}

Frame all achievements and experiences through this personality lens.
`;
  }

  return `You are an expert resume writer. Generate a professional, ATS-optimized resume tailored to the job description below.

${personalityGuidance}

JOB DESCRIPTION:
${jobDescription}

CANDIDATE'S EXPERIENCE:
${resumeText}

PERSONAL STORIES & ADDITIONAL CONTEXT:
${personalStories}

SECTIONS TO INCLUDE:
${selectedSections.join(', ')}

OUTPUT FORMAT:
- Return ONLY valid markdown
- Include only the requested sections
- Tailor content to match job description keywords
- Quantify achievements with metrics where possible
- Keep bullet points concise (1-2 lines max)
- Professional tone matching the candidate's personality
- ATS-friendly formatting (no tables, simple structure)

Generate the resume now:`;
}

// Helper: Calculate cost based on model pricing
function calculateCost(tokens, model) {
  // Gemini 1.5 Pro pricing (Vertex AI): $1.25 per 1M tokens
  if (model === 'gemini-1.5-pro') {
    return (tokens / 1000000) * 1.25;
  }
  return 0;
}

// Helper: Convert markdown to HTML
function markdownToHtml(markdown) {
  // Use markdown library or simple replacement
  // For now, basic implementation:
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 20px auto; }
    h1 { font-size: 24px; margin-bottom: 10px; }
    h2 { font-size: 18px; margin-top: 20px; border-bottom: 2px solid #333; }
    ul { margin: 10px 0; }
    li { margin: 5px 0; }
  </style>
</head>
<body>
${markdown.replace(/^# (.+)$/gm, '<h1>$1</h1>')
          .replace(/^## (.+)$/gm, '<h2>$1</h2>')
          .replace(/^- (.+)$/gm, '<li>$1</li>')
          .replace(/(<li>.*<\/li>)+/gs, '<ul>$&</ul>')}
</body>
</html>`;
}

module.exports = router;
```

---

### **Phase 2: Update Frontend to Use New Endpoint** (30 mins)

**File**: `src/services/api.js`

```javascript
// OLD (Vercel serverless function)
export const generateCv = async (formData) => {
  const response = await fetch('/api/generate-cv', {
    method: 'POST',
    body: formData  // FormData with files
  });
  return response.blob(); // Returns PDF blob
};

// NEW (Cloud Run backend)
export const generateResume = async (data) => {
  const token = await getFirebaseToken(); // Get auth token

  const response = await fetch(`${API_BASE_URL}/api/resume/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Resume generation failed');
  }

  return response.json(); // Returns { resume: { pdfUrl, id, ... }, usage: { ... } }
};
```

**File**: `src/components/ProcessModal.js`

```javascript
// OLD implementation (lines 51-75)
const handleGenerate = async () => {
  setIsLoading(true);
  const formData = new FormData();
  files.forEach(file => formData.append('documents', file));
  formData.append('resumeText', resumeText);
  formData.append('personalStories', personalStories);
  formData.append('jobDescription', jobDescription);
  formData.append('selectedSections', selectedSections.join(','));

  try {
    const pdfBlob = await generateCv(formData);
    const url = window.URL.createObjectURL(pdfBlob);
    window.open(url, '_blank');
    handleClose();
  } catch (err) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};

// NEW implementation (with tracking)
const handleGenerate = async () => {
  setIsLoading(true);
  setError('');

  try {
    // Build request payload (no files - send text only)
    const payload = {
      resumeText: resumeText || '',
      personalStories: personalStories || '',
      jobDescription,
      selectedSections,
      targetCompany: extractCompanyName(jobDescription) // Optional: parse company from JD
    };

    // Call new backend endpoint
    const result = await generateResume(payload);

    // ✅ Resume now tracked in database
    console.log('Resume generated:', result.resume.id);

    // Open PDF in new tab
    window.open(result.resume.pdfUrl, '_blank');

    // Update user's resume count in UI
    setUserResumeCount(result.usage.resumesGenerated);

    // Show success message
    setSuccessMessage(`Resume generated! (${result.usage.remainingResumes} remaining)`);

    // Redirect to "My Resumes" page
    setTimeout(() => {
      navigate('/resume');
      handleClose();
    }, 2000);

  } catch (err) {
    console.error('Resume generation error:', err);

    // Handle specific errors
    if (err.message.includes('Resume limit reached')) {
      setError('You've reached your resume limit. Upgrade to Pro for unlimited resumes!');
      // Show upgrade CTA
    } else {
      setError(err.message || 'Failed to generate resume. Please try again.');
    }
  } finally {
    setIsLoading(false);
  }
};
```

---

### **Phase 3: Build "My Resumes" Page** (1 hour)

**File**: `src/components/ResumesListPage.js` (NEW)

```jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Container, Typography, Box, Card, CardContent, CardActions,
  Button, Grid, Chip, CircularProgress
} from '@mui/material';
import { Download, Visibility, Delete } from '@mui/icons-material';

function ResumesListPage() {
  const { currentUser } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const token = await currentUser.getIdToken();
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/resume/list`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setResumes(data.resumes);
      } catch (error) {
        console.error('Failed to load resumes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResumes();
  }, [currentUser]);

  const handleDownload = (pdfUrl) => {
    window.open(pdfUrl, '_blank');
  };

  if (loading) return <CircularProgress />;

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>My Resumes</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {resumes.length} resume{resumes.length !== 1 ? 's' : ''} generated
      </Typography>

      <Grid container spacing={3}>
        {resumes.map((resume) => (
          <Grid item xs={12} md={6} key={resume.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{resume.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {resume.targetCompany || 'General Resume'}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Chip
                    label={new Date(resume.createdAt).toLocaleDateString()}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Chip label={resume.status} size="small" color="success" />
                </Box>
              </CardContent>
              <CardActions>
                <Button size="small" startIcon={<Download />} onClick={() => handleDownload(resume.pdfUrl)}>
                  Download
                </Button>
                <Button size="small" startIcon={<Visibility />} onClick={() => window.open(`/resume/${resume.id}`, '_blank')}>
                  Preview
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default ResumesListPage;
```

Add route to `App.js`:
```jsx
<Route path="/resumes" element={
  <ProtectedRoute>
    <ResumesListPage />
  </ProtectedRoute>
} />
```

---

### **Phase 4: Add Backend List Endpoint** (15 mins)

```javascript
// api/routes/resume.js

// GET /api/resume/list - Get user's resume history
router.get('/list', verifyFirebaseToken, async (req, res, next) => {
  try {
    const { user } = req;

    const resumes = await prisma.resume.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        targetCompany: true,
        pdfUrl: true,
        status: true,
        createdAt: true,
        downloadedAt: true
      }
    });

    return res.json({
      resumes,
      total: resumes.length
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/resume/:id/download - Download specific resume
router.get('/:id/download', verifyFirebaseToken, async (req, res, next) => {
  try {
    const { user } = req;
    const { id } = req.params;

    const resume = await prisma.resume.findFirst({
      where: { id, userId: user.id }
    });

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Mark as downloaded
    await prisma.resume.update({
      where: { id },
      data: { downloadedAt: new Date() }
    });

    // Redirect to Cloud Storage URL
    return res.redirect(resume.pdfUrl);
  } catch (error) {
    next(error);
  }
});
```

---

## 📊 Database Schema Updates Needed

### **Add index for resume queries**:
```sql
CREATE INDEX idx_resumes_user_created ON resumes(user_id, created_at DESC);
```

### **Add trigger to update users.resumes_generated**:
```sql
CREATE OR REPLACE FUNCTION update_resume_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET resumes_generated = (
    SELECT COUNT(*) FROM resumes WHERE user_id = NEW.user_id
  )
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER resume_count_trigger
AFTER INSERT ON resumes
FOR EACH ROW
EXECUTE FUNCTION update_resume_count();
```

---

## ✅ Implementation Checklist

### **Backend (3 hours total)**
- [ ] Create `api/routes/resume.js` with `/generate` endpoint (1.5 hours)
- [ ] Create `api/services/pdfGenerator.js` - Puppeteer wrapper (30 mins)
- [ ] Create `api/services/storage.js` - Cloud Storage upload (30 mins)
- [ ] Add resume routes to `api/server.js` (15 mins)
- [ ] Test locally with Postman (15 mins)

### **Frontend (1.5 hours total)**
- [ ] Update `src/services/api.js` with `generateResume()` (15 mins)
- [ ] Modify `ProcessModal.js` to use new endpoint (30 mins)
- [ ] Create `ResumesListPage.js` component (30 mins)
- [ ] Add route to `App.js` (5 mins)
- [ ] Test end-to-end flow (10 mins)

### **Deployment (30 mins)**
- [ ] Deploy backend to Cloud Run (new revision)
- [ ] Test authentication and resume generation
- [ ] Verify Cloud Storage uploads
- [ ] Test resume limit enforcement

**Total Time**: ~5 hours to implement full resume tracking

---

## 🎯 Benefits After Implementation

✅ **User Benefits**:
- See history of all generated resumes
- Re-download resumes anytime
- Track resume usage vs. limits

✅ **Business Benefits**:
- Enforce free tier limits (1 resume + social share gate)
- Track which users are power users (subscription targets)
- Analytics on resume generation patterns
- Retention (users come back to download resumes)

✅ **Technical Benefits**:
- Centralized resume storage (not just browser downloads)
- Backup of all user-generated content
- Cost tracking per resume
- Performance metrics (generation time)

---

## 🚀 Quick Start (Next Session)

**Priority 1**: Implement backend resume tracking (Phases 1-2)
**Priority 2**: Test end-to-end with existing UI
**Priority 3**: Deploy to production

**Estimated Time**: 3 hours to get basic tracking working

---

**Last Updated**: 2025-11-04
**Status**: Ready for implementation
**Depends On**: Cloud Storage bucket setup (already exists: `cvstomize-resumes`)
