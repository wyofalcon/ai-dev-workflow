/**
 * Mock Gemini Service for Local Development
 *
 * Use this instead of geminiServiceVertex.js to avoid GCP/Vertex AI costs.
 * Returns realistic mock responses for testing the UI flow.
 *
 * Usage:
 *   Set USE_MOCK_AI=true in your environment
 *   The service auto-switches based on this flag
 */

class MockGeminiService {
  constructor() {
    console.log("🤖 Using MOCK Gemini Service (no GCP costs)");
    this.responseDelay = 500; // Simulate API latency
  }

  /**
   * Simulate API delay for realistic UX testing
   */
  async _delay() {
    return new Promise((resolve) => setTimeout(resolve, this.responseDelay));
  }

  /**
   * Extract text from prompt (handles both string and object formats)
   */
  _extractPromptText(prompt) {
    if (typeof prompt === "string") {
      return prompt;
    }
    // Handle { contents: [{ role: 'user', parts: [{ text: '...' }] }] } format
    if (prompt?.contents?.[0]?.parts?.[0]?.text) {
      return prompt.contents[0].parts[0].text;
    }
    // Handle array format [{ text: '...' }]
    if (Array.isArray(prompt) && prompt[0]?.text) {
      return prompt[0].text;
    }
    // Fallback to JSON string representation
    return JSON.stringify(prompt);
  }

  /**
   * Mock Flash model (conversations)
   */
  getFlashModel() {
    return {
      startChat: () => ({
        sendMessage: async (message) => {
          await this._delay();
          return {
            response: {
              candidates: [
                {
                  content: {
                    parts: [
                      {
                        text: this._getMockConversationResponse(message),
                      },
                    ],
                  },
                },
              ],
              usageMetadata: { totalTokenCount: 150 },
            },
          };
        },
      }),
      generateContent: async (prompt) => {
        await this._delay();
        const promptText = this._extractPromptText(prompt);
        return {
          response: {
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: this._getMockAnalysisResponse(promptText),
                    },
                  ],
                },
              },
            ],
          },
        };
      },
    };
  }

  /**
   * Mock Pro model (resume generation)
   */
  getProModel() {
    return {
      generateContent: async (prompt) => {
        await this._delay();
        const promptText = this._extractPromptText(prompt);
        return {
          response: {
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: this._getMockResumeResponse(promptText),
                    },
                  ],
                },
              },
            ],
          },
        };
      },
    };
  }

  /**
   * Mock conversational message
   */
  async sendConversationalMessage(userMessage, conversationHistory = []) {
    await this._delay();
    return {
      response: this._getMockConversationResponse(userMessage),
      tokensUsed: 150,
    };
  }

  /**
   * Mock resume generation
   */
  async generateResume(profileData, jobDescription, selectedSections) {
    await this._delay();
    return {
      resumeContent: this._getMockResumeContent(profileData, selectedSections),
      tokensUsed: 2500,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Mock Response Generators
  // ─────────────────────────────────────────────────────────────

  _getMockConversationResponse(message) {
    const responses = [
      "That's great experience! Can you tell me more about the specific technologies you used?",
      "Interesting. How did you measure the impact of that project?",
      "What challenges did you face and how did you overcome them?",
      "That's helpful context. What was your role in the team?",
      "Thanks for sharing! One more question - what was the scale of this project?",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  _getMockAnalysisResponse(prompt) {
    // Resume parsing response (for uploaded resumes)
    if (
      prompt.includes("resume parser") ||
      prompt.includes("RESUME TEXT") ||
      prompt.includes("Extract the following information")
    ) {
      return JSON.stringify({
        fullName: "Alex Johnson",
        email: "alex.johnson@email.com",
        phone: "(555) 987-6543",
        location: "Austin, TX",
        linkedinUrl: "linkedin.com/in/alexjohnson",
        summary:
          "Results-driven software engineer with 6+ years of experience building scalable web applications and leading cross-functional teams.",
        yearsExperience: 6,
        careerLevel: "senior",
        currentTitle: "Senior Software Engineer",
        skills: [
          "JavaScript",
          "TypeScript",
          "React",
          "Node.js",
          "Python",
          "PostgreSQL",
          "AWS",
          "Docker",
          "Kubernetes",
        ],
        industries: ["Technology", "SaaS", "FinTech"],
        education: [
          {
            degree: "Bachelor of Science",
            school: "University of Texas at Austin",
            year: "2018",
            field: "Computer Science",
          },
        ],
        certifications: [
          "AWS Certified Developer",
          "Google Cloud Professional",
        ],
        languages: ["English", "Spanish"],
        experience: [
          {
            title: "Senior Software Engineer",
            company: "TechCorp Inc.",
            location: "Austin, TX",
            startDate: "2021",
            endDate: "Present",
            highlights: [
              "Led development of microservices architecture serving 2M+ daily users",
              "Reduced infrastructure costs by 35% through optimization initiatives",
              "Mentored team of 5 engineers, improving sprint velocity by 40%",
            ],
          },
          {
            title: "Software Engineer",
            company: "StartupXYZ",
            location: "San Francisco, CA",
            startDate: "2018",
            endDate: "2021",
            highlights: [
              "Built real-time analytics dashboard processing 500K events per minute",
              "Implemented CI/CD pipeline reducing deployment time by 80%",
            ],
          },
        ],
      });
    }

    // Return mock job description analysis with questions
    // This format matches what jobDescriptionAnalyzer expects
    if (
      prompt.includes("analyze") ||
      prompt.includes("job") ||
      prompt.includes("description") ||
      prompt.includes("requirements")
    ) {
      return JSON.stringify({
        analysis: {
          jobTitle: "Software Engineer",
          company: "Tech Company",
          seniorityLevel: "mid",
          requirements: {
            required: ["JavaScript", "React", "Node.js"],
            preferred: ["PostgreSQL", "AWS", "Docker"],
            education: "Bachelor's degree in CS or related field",
            yearsExperience: "3-5 years",
          },
          keyResponsibilities: [
            "Develop and maintain web applications",
            "Collaborate with cross-functional teams",
            "Write clean, testable code",
          ],
          cultureFit: ["collaborative", "innovative", "fast-paced"],
          gaps: ["PostgreSQL experience", "AWS certification"],
        },
        questions: [
          {
            id: "q1",
            question:
              "Tell me about a challenging technical project you led. What was the outcome?",
            targetTrait: "achievement",
            followUp: "What specific technologies did you use?",
          },
          {
            id: "q2",
            question:
              "Describe a time when you had to learn a new technology quickly. How did you approach it?",
            targetTrait: "learning",
            followUp: "How do you stay current with new technologies?",
          },
          {
            id: "q3",
            question:
              "Can you share an example of how you collaborated with a difficult team member?",
            targetTrait: "teamwork",
            followUp: "What did you learn from that experience?",
          },
        ],
        overallMatch: 75,
      });
    }

    // Personality inference response
    if (
      prompt.includes("personality") ||
      prompt.includes("Big Five") ||
      prompt.includes("OCEAN")
    ) {
      return JSON.stringify({
        openness: 72,
        conscientiousness: 85,
        extraversion: 58,
        agreeableness: 76,
        neuroticism: 35,
        confidence: 0.82,
        insights: [
          "Shows strong attention to detail and organization",
          "Demonstrates adaptability and willingness to learn",
          "Values collaborative work environments",
        ],
      });
    }

    return JSON.stringify({ message: "Mock analysis complete", success: true });
  }

  _getMockResumeContent(profileData, selectedSections) {
    const name = profileData?.name || "John Doe";
    const email = profileData?.email || "john.doe@email.com";

    return {
      header: {
        name: name,
        title: "Senior Software Engineer",
        email: email,
        phone: "(555) 123-4567",
        location: "San Francisco, CA",
        linkedin: "linkedin.com/in/johndoe",
      },
      summary: `Experienced software engineer with 5+ years building scalable web applications. Proven track record of delivering high-impact features and mentoring junior developers. Passionate about clean code and user-centric design.`,
      experience: [
        {
          company: "TechCorp Inc.",
          title: "Senior Software Engineer",
          dates: "2021 - Present",
          bullets: [
            "Led development of customer-facing dashboard serving 100K+ users",
            "Reduced API response times by 40% through database optimization",
            "Mentored team of 3 junior developers, improving code review velocity by 25%",
          ],
        },
        {
          company: "StartupXYZ",
          title: "Software Engineer",
          dates: "2019 - 2021",
          bullets: [
            "Built real-time notification system processing 1M+ events daily",
            "Implemented CI/CD pipeline reducing deployment time from 2 hours to 15 minutes",
          ],
        },
      ],
      skills: {
        technical: [
          "JavaScript",
          "TypeScript",
          "React",
          "Node.js",
          "PostgreSQL",
          "AWS",
        ],
        soft: ["Leadership", "Communication", "Problem Solving"],
      },
      education: [
        {
          school: "University of Technology",
          degree: "B.S. Computer Science",
          year: "2019",
        },
      ],
    };
  }

  _getMockResumeResponse(prompt) {
    return JSON.stringify(this._getMockResumeContent({}, []));
  }
}

module.exports = new MockGeminiService();
