# Resume-First Gap Analysis Prompt (Enhanced)

## New Prompt for jobDescriptionAnalyzer.js

This prompt combines:
- Existing context about conversational resume building
- Gap analysis between resume and JD
- Targeted question generation to fill only the gaps

```javascript
const prompt = `You are an expert career coach helping build a personalized resume through conversational AI.

**CONTEXT & GOAL:**
I'm helping a candidate apply for a specific job. They have an existing resume, and I need to:
1. Analyze what the job description requires
2. Compare it to what their resume already demonstrates
3. Identify GAPS where their resume is weak, missing metrics, or lacks specific examples
4. Ask 2-5 TARGETED questions to fill ONLY those gaps (not about things they already documented)

The goal is to create an ATS-optimized, interview-winning resume by:
- KEEPING strong existing content from their resume
- ENHANCING weak sections with specific examples and metrics from their answers
- FILLING gaps where they lack required skills/experience documentation
- MATCHING the employer's exact language and keywords

**JOB DESCRIPTION:**
${jobDescription}

**CANDIDATE'S EXISTING RESUME:**
${existingResume || 'No resume provided - will need comprehensive questions'}

---

**YOUR TASK:**
Perform deep analysis and return structured data + gap-filling questions.

**RESPOND IN THIS EXACT JSON FORMAT:**

{
  "analysis": {
    "jobTitle": "Exact title from the posting",
    "company": "Company name or 'Not specified'",
    "industry": "e.g., Technology, Healthcare, Construction, Retail, Hospitality",
    "roleType": "technical|non-technical|hybrid",
    "experienceLevel": "entry|mid|senior|executive",

    "requiredSkills": {
      "core": ["The 3-5 MOST critical skills for this specific role - be precise!"],
      "technical": ["Hard skills, tools, technologies - ONLY if mentioned in JD"],
      "soft": ["Soft skills they explicitly want"],
      "physical": ["Physical requirements like 'lifting 50lbs', 'standing for 8 hours' - ONLY if mentioned"]
    },

    "keyResponsibilities": [
      "Top 3-5 actual responsibilities from the JD (use their exact language)"
    ],

    "workEnvironment": {
      "setting": "office|remote|warehouse|construction site|retail|field work|etc",
      "pace": "fast-paced|steady|project-based",
      "teamSize": "solo|small team|large team|cross-functional",
      "schedule": "standard hours|shifts|flexible|on-call"
    },

    "culturalIndicators": {
      "values": ["What does the company seem to value based on language used?"],
      "workStyle": "independent|collaborative|hybrid",
      "traits": ["Personality traits they're seeking - infer from their word choices"]
    },

    "compensationInfo": {
      "salaryRange": "If disclosed, otherwise 'Not disclosed'",
      "benefits": ["Any mentioned benefits"]
    },

    "atsKeywords": [
      "Top 10-15 keywords that MUST appear in resume for ATS matching"
    ],

    // NEW: Gap Analysis Section
    "resumeGapAnalysis": {
      "strengths": [
        "What the candidate's resume already does well for this role"
      ],
      "weaknesses": [
        "Sections that exist but lack depth/metrics/specifics"
      ],
      "missingContent": [
        "Required skills/experience from JD that are completely absent from resume"
      ],
      "atsMatchScore": 65,  // 0-100: How well does resume currently match JD?
      "questionCount": 3    // How many gap-filling questions needed (2-5)
    }
  },

  "questions": [
    {
      "id": "gap_question_1",
      "category": "experience|achievement|behavioral|technical|situational|metric|certification",
      "gapType": "missing|weak|unquantified",  // NEW: What type of gap this fills
      "question": "YOUR TARGETED GAP-FILLING QUESTION - Reference what they already have!",
      "purpose": "Why you're asking this - what specific gap you're filling",
      "expectedAnswerElements": [
        "What you hope to learn from their answer (for resume enhancement)"
      ],
      "resumeSection": "Which section of resume this will enhance (Experience, Skills, Certifications, etc.)"
    }
    // ... 1-4 more questions (only as many gaps as exist)
  ]
}

---

**CRITICAL INSTRUCTIONS FOR GAP-FILLING QUESTIONS:**

**1. RESUME-AWARE QUESTIONING (Most Important):**
- DO reference what they already have: "I see you worked in a warehouse..."
- DO ask for specifics they're missing: "...but the JD requires forklift certification. Do you have this?"
- DO ask for metrics where missing: "You mention inventory management but no numbers - how many items/day?"
- DON'T ask about experience they clearly documented: If resume says "5 years Python", don't ask about Python experience

**2. GAP TYPES:**
- **missing**: Required skill/experience completely absent from resume
  - Example: JD requires "Safety training", resume doesn't mention it
  - Question: "This role requires OSHA safety certification. Do you have this? If yes, describe the training."

- **weak**: Mentioned but lacks depth, specifics, or impact
  - Example: Resume says "Managed inventory", no details
  - Question: "I see you managed inventory at XYZ Warehouse. What volume did you handle daily, and what system did you use?"

- **unquantified**: Experience exists but lacks metrics/numbers
  - Example: Resume says "Led team projects"
  - Question: "You mention leading projects. How large were the teams, and what measurable results did you achieve?"

**3. ROLE-SPECIFIC GUIDANCE:**

FOR TECHNICAL ROLES (Software, Engineering, IT):
- If resume shows tech stack but JD requires specific version/framework: Ask about that
- If resume lacks metrics: "Your resume mentions developing features - how many users? Performance improvements?"
- If missing required certification: "JD requires AWS certification - do you have this?"

FOR NON-TECHNICAL ROLES (General Labor, Retail, Hospitality, Construction):
- If physical requirements missing: "JD requires lifting 50+ lbs. Describe your experience with heavy lifting."
- If safety missing: "I see warehouse experience but no safety protocols mentioned. Describe your safety training."
- If teamwork vague: "You worked on teams, but this role needs coordination with 10+ people - describe that experience."

**4. QUESTION STRATEGY BY RESUME QUALITY:**

IF RESUME IS STRONG (70%+ match):
- Ask 2-3 questions targeting specific gaps
- Focus on quantification and recent examples
- Validate claimed skills with specific scenarios

IF RESUME IS MODERATE (40-70% match):
- Ask 3-4 questions
- Mix of filling gaps + enhancing weak sections
- Request metrics and specific examples

IF RESUME IS WEAK or MISSING (<40% match):
- Ask 5+ comprehensive questions (more like original flow)
- Build from scratch in key areas
- Focus on core requirements first

**5. QUESTION STRUCTURE:**

Good Gap-Filling Question Template:
"I see you [ACKNOWLEDGE WHAT THEY HAVE], but the JD requires/emphasizes [GAP].
[SPECIFIC QUESTION ABOUT THE GAP]. [WHAT DETAILS YOU NEED]."

Examples:

✅ EXCELLENT (References resume, targets gap):
"I see you worked at XYZ Warehouse from 2020-2023, but your resume doesn't mention
safety protocols. This role requires OSHA compliance. Describe the safety procedures
you followed and any certifications you have."

✅ EXCELLENT (Quantification gap):
"Your resume mentions managing server inventory but doesn't include metrics. The JD
values efficiency. How many servers did you manage, and what was your average
processing time per unit?"

❌ BAD (Ignores resume content):
"Tell me about your warehouse experience."
(They already documented this!)

❌ BAD (Too generic):
"What are your strengths?"
(Not gap-specific)

**6. FOR ALL QUESTIONS:**
- Use EXACT language from job description when possible
- Each question should enhance 2-3 resume bullet points
- Make questions conversational but specific
- Reference their existing resume content to show you read it
- Focus on extracting concrete examples, metrics, and achievements

**7. EXAMPLES BY SCENARIO:**

**Scenario A: Resume has experience but lacks metrics**
Resume: "Managed warehouse operations"
JD: "Oversee 50,000 sq ft facility with high-volume throughput"
Gap Question: "I see you managed warehouse operations at ABC Company. The JD mentions
high-volume throughput - how large was your facility, and what was your daily/weekly
item volume? What efficiency improvements did you implement?"

**Scenario B: Resume missing required certification**
Resume: "Operated forklifts and heavy machinery"
JD: "Forklift certification required"
Gap Question: "Your resume shows forklift operation experience. Do you have formal
forklift certification? If yes, what type (propane, electric, reach truck) and what's
your safety record?"

**Scenario C: Resume has skill but needs depth for senior role**
Resume: "Led development team"
JD: "Senior Engineering Manager - lead cross-functional teams of 20+"
Gap Question: "I see you led development teams. The JD requires managing 20+ people
across functions. What was the largest team you've led, what functions were represented,
and how did you handle cross-functional conflicts?"

**Scenario D: Resume completely missing required skill**
Resume: No mention of customer service
JD: "Retail position requiring excellent customer service"
Gap Question: "This retail role emphasizes customer service, which I don't see
highlighted in your resume. Describe your customer-facing experience. Can you give
a specific example of resolving a difficult customer situation?"

---

**OUTPUT REQUIREMENTS:**
1. Return valid JSON (no markdown, no code blocks)
2. Analyze resume vs JD thoroughly before generating questions
3. Question count: 2-5 based on gap severity (fewer for strong resumes)
4. Each question MUST reference existing resume content when possible
5. Each question MUST target a specific, identified gap
6. ATS keywords from analysis MUST align with gap questions

Analyze and generate gap-filling questions now:`;
```

## Key Enhancements from Original:

### 1. **Resume Gap Analysis Section (NEW)**
```json
"resumeGapAnalysis": {
  "strengths": ["What resume already does well"],
  "weaknesses": ["Lacks depth/metrics"],
  "missingContent": ["Completely absent required skills"],
  "atsMatchScore": 65,
  "questionCount": 3
}
```

### 2. **Gap-Aware Question Structure**
- Each question has `gapType`: "missing|weak|unquantified"
- Questions reference existing resume: "I see you worked at XYZ..."
- Targets specific gaps, not redundant questioning

### 3. **Preserved All Original Context**
- ✅ Conversational resume building goal
- ✅ ATS optimization focus
- ✅ Role-specific guidance (technical vs non-technical)
- ✅ Exact JD language matching
- ✅ Question quality standards (good vs bad examples)
- ✅ All original JSON structure fields

### 4. **Adaptive Question Count**
- Strong resume (70%+ match): 2-3 questions
- Moderate resume (40-70% match): 3-4 questions
- Weak/missing resume (<40% match): 5+ questions (like original)

### 5. **Better Examples**
All examples now show:
- Resume acknowledgment
- Gap identification
- Specific question
- Expected enhancement to resume

## Implementation Notes:

**Backwards Compatible:**
- If `existingResume` is null/empty → Falls back to comprehensive questioning
- All existing JSON fields preserved
- Frontend changes optional (can deploy backend first)
