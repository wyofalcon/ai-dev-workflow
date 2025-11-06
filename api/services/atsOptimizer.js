/**
 * ATS (Applicant Tracking System) Keyword Optimization Service
 *
 * Extracts keywords from job descriptions and verifies resume keyword coverage
 * for better ATS parsing and ranking.
 *
 * Key features:
 * - Extract skills, responsibilities, qualifications from JD
 * - Identify must-have vs nice-to-have keywords
 * - Calculate keyword coverage percentage
 * - Suggest missing keywords to include
 * - ATS-friendly formatting validation
 */

class ATSOptimizer {
  constructor() {
    // Common ATS keywords that should be preserved
    this.atsImportantTerms = new Set([
      // Technical skills
      'javascript', 'python', 'java', 'react', 'node.js', 'sql', 'aws', 'docker',
      'kubernetes', 'git', 'api', 'rest', 'graphql', 'mongodb', 'postgresql',

      // Soft skills
      'leadership', 'communication', 'collaboration', 'problem-solving',
      'analytical', 'critical thinking', 'time management', 'teamwork',

      // Business terms
      'project management', 'agile', 'scrum', 'budget', 'stakeholder',
      'strategy', 'optimization', 'process improvement', 'metrics', 'kpi',

      // Education/Certifications
      'bachelor', 'master', 'phd', 'mba', 'certified', 'certification',
      'degree', 'diploma', 'training', 'coursework'
    ]);

    // Words to exclude from keyword extraction (stopwords)
    this.stopwords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
      'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that',
      'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
      'my', 'your', 'his', 'her', 'its', 'our', 'their'
    ]);
  }

  /**
   * Extract keywords from job description
   * Returns categorized keywords: skills, responsibilities, qualifications
   */
  extractKeywords(jobDescription) {
    if (!jobDescription || typeof jobDescription !== 'string') {
      return {
        allKeywords: [],
        skills: [],
        responsibilities: [],
        qualifications: [],
        mustHave: [],
        niceToHave: []
      };
    }

    const text = jobDescription.toLowerCase();

    // Extract skills (technical and soft skills)
    const skills = this._extractSkills(text);

    // Extract responsibilities (action-oriented phrases)
    const responsibilities = this._extractResponsibilities(text);

    // Extract qualifications (education, experience, certifications)
    const qualifications = this._extractQualifications(text);

    // Identify must-have vs nice-to-have
    const mustHave = this._identifyMustHave(text, [...skills, ...qualifications]);
    const niceToHave = this._identifyNiceToHave(text, [...skills, ...qualifications]);

    // All unique keywords
    const allKeywords = [...new Set([...skills, ...responsibilities, ...qualifications])];

    return {
      allKeywords,
      skills,
      responsibilities,
      qualifications,
      mustHave,
      niceToHave
    };
  }

  /**
   * Calculate keyword coverage in resume
   * Returns percentage and missing keywords
   */
  calculateCoverage(jobKeywords, resumeText) {
    if (!resumeText || typeof resumeText !== 'string') {
      return {
        coveragePercentage: 0,
        matchedKeywords: [],
        missingKeywords: jobKeywords.allKeywords || [],
        suggestions: []
      };
    }

    const resumeLower = resumeText.toLowerCase();
    const allKeywords = jobKeywords.allKeywords || [];

    // Find matched and missing keywords
    const matchedKeywords = allKeywords.filter(keyword =>
      resumeLower.includes(keyword.toLowerCase())
    );

    const missingKeywords = allKeywords.filter(keyword =>
      !resumeLower.includes(keyword.toLowerCase())
    );

    // Calculate coverage percentage
    const coveragePercentage = allKeywords.length > 0
      ? Math.round((matchedKeywords.length / allKeywords.length) * 100)
      : 0;

    // Generate suggestions for missing keywords
    const suggestions = this._generateSuggestions(
      missingKeywords,
      jobKeywords.mustHave || [],
      jobKeywords.skills || []
    );

    return {
      coveragePercentage,
      matchedKeywords,
      missingKeywords,
      suggestions,
      mustHaveCoverage: this._calculateMustHaveCoverage(jobKeywords.mustHave || [], resumeLower)
    };
  }

  /**
   * Validate ATS-friendly formatting
   */
  validateATSFormatting(resumeMarkdown) {
    const issues = [];
    const warnings = [];

    // Check for problematic elements
    if (resumeMarkdown.includes('<table>') || resumeMarkdown.includes('|---|')) {
      issues.push('Tables may not parse correctly in ATS systems');
    }

    if (resumeMarkdown.includes('![') || resumeMarkdown.includes('<img')) {
      issues.push('Images are not readable by ATS systems');
    }

    if (resumeMarkdown.match(/\*{3,}|\_{3,}/)) {
      warnings.push('Excessive formatting may confuse ATS parsers');
    }

    // Check for contact information
    const hasEmail = resumeMarkdown.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const hasPhone = resumeMarkdown.match(/\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/);

    if (!hasEmail) {
      issues.push('Missing email address');
    }

    if (!hasPhone) {
      warnings.push('Missing phone number');
    }

    // Check for standard sections
    const hasExperience = resumeMarkdown.toLowerCase().includes('experience') ||
                          resumeMarkdown.toLowerCase().includes('work history');
    const hasEducation = resumeMarkdown.toLowerCase().includes('education');
    const hasSkills = resumeMarkdown.toLowerCase().includes('skill') ||
                      resumeMarkdown.toLowerCase().includes('competenc');

    if (!hasExperience) {
      issues.push('Missing Professional Experience section');
    }

    if (!hasEducation) {
      warnings.push('Missing Education section (recommended)');
    }

    if (!hasSkills) {
      warnings.push('Missing Skills/Competencies section (recommended for ATS)');
    }

    return {
      isATSFriendly: issues.length === 0,
      issues,
      warnings,
      score: this._calculateATSScore(issues, warnings)
    };
  }

  /**
   * Optimize resume for ATS by injecting missing keywords naturally
   */
  suggestOptimizations(jobKeywords, resumeCoverage) {
    const optimizations = [];

    // Priority 1: Missing must-have keywords
    if (resumeCoverage.mustHaveCoverage < 80) {
      const missingMustHave = (jobKeywords.mustHave || []).filter(keyword =>
        !resumeCoverage.matchedKeywords.includes(keyword)
      );

      if (missingMustHave.length > 0) {
        optimizations.push({
          priority: 'HIGH',
          category: 'Must-Have Keywords',
          keywords: missingMustHave,
          recommendation: 'Add these critical keywords to your Professional Summary or Core Competencies section'
        });
      }
    }

    // Priority 2: Missing skills
    const missingSkills = (jobKeywords.skills || []).filter(keyword =>
      resumeCoverage.missingKeywords.includes(keyword)
    );

    if (missingSkills.length > 0) {
      optimizations.push({
        priority: 'MEDIUM',
        category: 'Technical/Soft Skills',
        keywords: missingSkills.slice(0, 10), // Top 10 missing skills
        recommendation: 'Include these skills in your Core Competencies section or Professional Experience bullets'
      });
    }

    // Priority 3: Nice-to-have keywords
    const missingNiceToHave = (jobKeywords.niceToHave || []).filter(keyword =>
      resumeCoverage.missingKeywords.includes(keyword)
    );

    if (missingNiceToHave.length > 0) {
      optimizations.push({
        priority: 'LOW',
        category: 'Nice-to-Have Keywords',
        keywords: missingNiceToHave.slice(0, 5), // Top 5
        recommendation: 'Consider adding these if you have relevant experience'
      });
    }

    // Overall coverage guidance
    if (resumeCoverage.coveragePercentage < 70) {
      optimizations.unshift({
        priority: 'CRITICAL',
        category: 'Overall Coverage',
        keywords: [],
        recommendation: `Resume has only ${resumeCoverage.coveragePercentage}% keyword coverage. Target 80%+ for strong ATS ranking.`
      });
    }

    return optimizations;
  }

  // ========== PRIVATE HELPER METHODS ==========

  _extractSkills(text) {
    const skills = [];

    // Extract from "Skills:" or "Requirements:" sections
    const skillsSection = text.match(/(?:skills?|requirements?|qualifications?)[:\s]+([^\.]+)/gi);
    if (skillsSection) {
      skillsSection.forEach(section => {
        const extracted = this._extractPhrases(section);
        skills.push(...extracted);
      });
    }

    // Extract technical skills (common patterns)
    const techSkills = text.match(/\b(?:javascript|python|java|react|node\.?js|sql|aws|docker|kubernetes|git|api|rest|graphql|mongodb|postgresql|typescript|angular|vue|django|flask|express|redis|kafka|elasticsearch|jenkins|terraform|ansible)\b/gi);
    if (techSkills) {
      skills.push(...techSkills.map(s => s.toLowerCase()));
    }

    // Extract soft skills
    const softSkills = text.match(/\b(?:leadership|communication|collaboration|problem[- ]solving|analytical|critical thinking|time management|teamwork|adaptability|creativity|innovation)\b/gi);
    if (softSkills) {
      skills.push(...softSkills.map(s => s.toLowerCase().replace(/-/g, ' ')));
    }

    return [...new Set(skills)];
  }

  _extractResponsibilities(text) {
    const responsibilities = [];

    // Extract action verbs + phrases
    const actionPatterns = [
      /\b(?:manage|develop|design|implement|lead|coordinate|analyze|optimize|create|build|maintain|improve|ensure|support|collaborate|oversee|drive|execute)\s+[a-z\s]+/gi
    ];

    actionPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        responsibilities.push(...matches.map(m => m.toLowerCase().trim()));
      }
    });

    return [...new Set(responsibilities)].slice(0, 15); // Top 15 responsibilities
  }

  _extractQualifications(text) {
    const qualifications = [];

    // Education
    const education = text.match(/\b(?:bachelor'?s?|master'?s?|phd|mba|associate'?s?|degree|diploma)\b/gi);
    if (education) {
      qualifications.push(...education.map(e => e.toLowerCase().replace(/'/g, '')));
    }

    // Experience (years)
    const experience = text.match(/\b\d+\+?\s*years?\s+(?:of\s+)?experience\b/gi);
    if (experience) {
      qualifications.push(...experience.map(e => e.toLowerCase()));
    }

    // Certifications
    const certs = text.match(/\b(?:certified|certification|license|licensed|accredited)\b/gi);
    if (certs) {
      qualifications.push(...certs.map(c => c.toLowerCase()));
    }

    return [...new Set(qualifications)];
  }

  _identifyMustHave(text, keywords) {
    const mustHaveIndicators = [
      /required/gi, /must have/gi, /essential/gi, /mandatory/gi, /critical/gi
    ];

    const mustHave = [];

    // Find sections with must-have indicators
    mustHaveIndicators.forEach(indicator => {
      if (text.match(indicator)) {
        // Extract nearby keywords
        const sentences = text.split(/[.!?]/);
        sentences.forEach(sentence => {
          if (sentence.match(indicator)) {
            keywords.forEach(keyword => {
              if (sentence.toLowerCase().includes(keyword.toLowerCase())) {
                mustHave.push(keyword);
              }
            });
          }
        });
      }
    });

    return [...new Set(mustHave)];
  }

  _identifyNiceToHave(text, keywords) {
    const niceToHaveIndicators = [
      /preferred/gi, /nice to have/gi, /bonus/gi, /plus/gi, /desired/gi
    ];

    const niceToHave = [];

    niceToHaveIndicators.forEach(indicator => {
      if (text.match(indicator)) {
        const sentences = text.split(/[.!?]/);
        sentences.forEach(sentence => {
          if (sentence.match(indicator)) {
            keywords.forEach(keyword => {
              if (sentence.toLowerCase().includes(keyword.toLowerCase())) {
                niceToHave.push(keyword);
              }
            });
          }
        });
      }
    });

    return [...new Set(niceToHave)];
  }

  _extractPhrases(text) {
    const phrases = text
      .toLowerCase()
      .split(/[,;•\n]/)
      .map(phrase => phrase.trim())
      .filter(phrase => {
        // Remove stopwords and very short phrases
        const words = phrase.split(/\s+/);
        return words.length >= 1 && words.length <= 5 &&
               !words.every(word => this.stopwords.has(word));
      });

    return phrases;
  }

  _calculateMustHaveCoverage(mustHaveKeywords, resumeText) {
    if (mustHaveKeywords.length === 0) return 100;

    const matched = mustHaveKeywords.filter(keyword =>
      resumeText.includes(keyword.toLowerCase())
    );

    return Math.round((matched.length / mustHaveKeywords.length) * 100);
  }

  _generateSuggestions(missingKeywords, mustHave, skills) {
    const suggestions = [];

    // Suggest must-have keywords first
    mustHave.forEach(keyword => {
      if (missingKeywords.includes(keyword)) {
        suggestions.push({
          keyword,
          priority: 'HIGH',
          suggestion: `Add "${keyword}" to your Professional Summary or Core Competencies section`
        });
      }
    });

    // Suggest missing skills
    skills.forEach(keyword => {
      if (missingKeywords.includes(keyword) && suggestions.length < 10) {
        suggestions.push({
          keyword,
          priority: 'MEDIUM',
          suggestion: `Include "${keyword}" in relevant experience bullets or skills section`
        });
      }
    });

    return suggestions;
  }

  _calculateATSScore(issues, warnings) {
    let score = 100;
    score -= issues.length * 15; // Each issue -15 points
    score -= warnings.length * 5; // Each warning -5 points
    return Math.max(0, score);
  }
}

// Export singleton
const atsOptimizer = new ATSOptimizer();
module.exports = atsOptimizer;
