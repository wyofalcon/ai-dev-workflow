/**
 * Resume Context Aggregator
 * 
 * Fetches and aggregates content from user's resume pool (uploaded + generated resumes)
 * to provide comprehensive context for Gold Standard resume generation.
 * 
 * Limits to 5 most recent resumes to prevent token bloat.
 */

const prisma = require('../config/database');

/**
 * Fetch resume context from user's resume pool
 * @param {string} userId - User database ID
 * @param {number} limit - Max number of resumes to fetch (default: 5)
 * @returns {Object} Aggregated resume context
 */
async function fetchResumeContext(userId, limit = 5) {
  try {
    console.log(`📚 Fetching resume context for user ${userId} (limit: ${limit})...`);

    // Fetch uploaded resumes (most recent first)
    const uploadedResumes = await prisma.uploadedResume.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: Math.ceil(limit / 2), // Take half from uploads
      select: {
        id: true,
        filename: true,
        parsedData: true,
        rawText: true,
        createdAt: true
      }
    });

    // Fetch generated resumes (most recent first)
    const generatedResumes = await prisma.resume.findMany({
      where: { 
        userId,
        status: { in: ['complete', 'draft'] }
      },
      orderBy: { createdAt: 'desc' },
      take: Math.ceil(limit / 2), // Take half from generated
      select: {
        id: true,
        title: true,
        targetCompany: true,
        resumeMarkdown: true,
        atsOptimization: true,
        createdAt: true
      }
    });

    console.log(`  ✅ Found ${uploadedResumes.length} uploaded + ${generatedResumes.length} generated resumes`);

    if (uploadedResumes.length === 0 && generatedResumes.length === 0) {
      console.log('  ℹ️ No resume context available');
      return null;
    }

    // Aggregate skills from all resumes
    const skillsSet = new Set();
    
    uploadedResumes.forEach(resume => {
      if (resume.parsedData?.skills) {
        resume.parsedData.skills.forEach(skill => skillsSet.add(skill));
      }
    });

    generatedResumes.forEach(resume => {
      if (resume.atsOptimization?.extractedSkills) {
        resume.atsOptimization.extractedSkills.forEach(skill => skillsSet.add(skill));
      }
    });

    // Aggregate experience from uploaded resumes
    const experienceList = [];
    uploadedResumes.forEach(resume => {
      if (resume.parsedData?.experience) {
        const exp = resume.parsedData.experience;
        if (Array.isArray(exp)) {
          experienceList.push(...exp);
        }
      }
    });

    // Aggregate achievements/accomplishments
    const achievementsList = [];
    uploadedResumes.forEach(resume => {
      if (resume.parsedData?.achievements) {
        achievementsList.push(...resume.parsedData.achievements);
      }
    });

    // Aggregate certifications
    const certificationsSet = new Set();
    uploadedResumes.forEach(resume => {
      if (resume.parsedData?.certifications) {
        resume.parsedData.certifications.forEach(cert => certificationsSet.add(cert));
      }
    });

    // Aggregate education
    const educationList = [];
    uploadedResumes.forEach(resume => {
      if (resume.parsedData?.education) {
        const edu = resume.parsedData.education;
        if (Array.isArray(edu)) {
          educationList.push(...edu);
        }
      }
    });

    // Extract job titles from experience
    const jobTitles = new Set();
    experienceList.forEach(exp => {
      if (exp.title) jobTitles.add(exp.title);
      if (exp.position) jobTitles.add(exp.position);
    });

    // Build context object
    const context = {
      skills: Array.from(skillsSet).slice(0, 50), // Limit to 50 most recent skills
      experience: experienceList.slice(0, 10), // Limit to 10 most recent positions
      achievements: achievementsList.slice(0, 15), // Limit to 15 achievements
      certifications: Array.from(certificationsSet),
      education: educationList.slice(0, 5), // Limit to 5 education entries
      jobTitles: Array.from(jobTitles),
      metadata: {
        uploadedCount: uploadedResumes.length,
        generatedCount: generatedResumes.length,
        totalResumes: uploadedResumes.length + generatedResumes.length,
        oldestResumeDate: Math.min(
          ...uploadedResumes.map(r => r.createdAt.getTime()),
          ...generatedResumes.map(r => r.createdAt.getTime())
        ),
        newestResumeDate: Math.max(
          ...uploadedResumes.map(r => r.createdAt.getTime()),
          ...generatedResumes.map(r => r.createdAt.getTime())
        )
      }
    };

    console.log(`  📊 Aggregated context:`, {
      skills: context.skills.length,
      experience: context.experience.length,
      achievements: context.achievements.length,
      certifications: context.certifications.length,
      education: context.education.length,
      jobTitles: context.jobTitles.length
    });

    return context;

  } catch (error) {
    console.error('❌ Error fetching resume context:', error);
    return null;
  }
}

/**
 * Format resume context for inclusion in Gemini prompt
 * @param {Object} context - Resume context object from fetchResumeContext()
 * @returns {string} Formatted context string for prompt
 */
function formatResumeContextForPrompt(context) {
  if (!context) return '';

  const sections = [];

  // Skills section
  if (context.skills && context.skills.length > 0) {
    sections.push(`**Skills from Resume History:**\n${context.skills.slice(0, 30).join(', ')}`);
  }

  // Experience section (condensed)
  if (context.experience && context.experience.length > 0) {
    const expSummary = context.experience.slice(0, 5).map(exp => {
      const title = exp.title || exp.position || 'Position';
      const company = exp.company || exp.organization || '';
      const duration = exp.duration || exp.dates || '';
      return `- ${title}${company ? ` at ${company}` : ''}${duration ? ` (${duration})` : ''}`;
    }).join('\n');
    sections.push(`**Past Positions:**\n${expSummary}`);
  }

  // Certifications
  if (context.certifications && context.certifications.length > 0) {
    sections.push(`**Certifications:**\n${context.certifications.join(', ')}`);
  }

  // Education
  if (context.education && context.education.length > 0) {
    const eduSummary = context.education.map(edu => {
      const degree = edu.degree || 'Degree';
      const school = edu.school || edu.institution || '';
      return `- ${degree}${school ? ` from ${school}` : ''}`;
    }).join('\n');
    sections.push(`**Education:**\n${eduSummary}`);
  }

  if (sections.length === 0) return '';

  return `\n\n📁 **RESUME HISTORY CONTEXT** (from ${context.metadata.totalResumes} previous resumes):\n\n${sections.join('\n\n')}\n\n**IMPORTANT:** Use this context to ensure consistency with candidate's work history and maintain continuity across resume versions. Include relevant skills and experiences that match the job requirements.\n`;
}

module.exports = {
  fetchResumeContext,
  formatResumeContextForPrompt
};
