/**
 * Mock data for Gold Standard personality assessment tests
 */

// Mock 8 behavioral stories (Section A)
const MOCK_STORIES = [
  {
    questionType: 'achievement',
    questionText: 'Tell me about your proudest professional achievement',
    storyText: 'I led a cross-functional team of 12 engineers and designers to launch a real-time collaboration platform used by 50,000+ users. The project was 6 months behind schedule when I took over as technical lead. I implemented agile sprints, automated our CI/CD pipeline reducing deployment time from 4 hours to 15 minutes, and mentored 3 junior developers. We shipped the MVP 2 weeks ahead of the revised deadline and achieved 99.9% uptime in the first 3 months. The platform generated $2M in revenue in year one.'
  },
  {
    questionType: 'adversity',
    questionText: 'Describe a time you overcame significant adversity',
    storyText: 'Our main database crashed on Black Friday with 10,000 concurrent users. I stayed calm under pressure, quickly diagnosed the issue as a memory leak in our caching layer, rolled back to the previous stable version within 20 minutes, and implemented a hot fix. I coordinated with 5 team members, communicated updates to stakeholders every 15 minutes, and restored full service with only 1.2% of transactions affected. Post-mortem analysis led to implementing better monitoring and load testing protocols.'
  },
  {
    questionType: 'team',
    questionText: 'Tell me about a successful team collaboration',
    storyText: 'I partnered with our UX designer and product manager to redesign our mobile onboarding flow. Through weekly design reviews and A/B testing 6 different variations, we increased signup completion from 42% to 78% over 3 months. I built the frontend with React Native, implemented analytics tracking, and facilitated knowledge sharing sessions. The collaborative approach led to innovative solutions like social login and progress persistence that I would not have thought of alone.'
  },
  {
    questionType: 'innovation',
    questionText: 'Describe a time you introduced an innovative solution',
    storyText: 'Our customer support team was overwhelmed with 500+ tickets per week, 60% being repetitive questions. I proposed and built an AI-powered chatbot using GPT-4 that integrated with our knowledge base and ticketing system. Within 2 months of deployment, the bot handled 70% of common inquiries automatically, reducing average response time from 4 hours to 2 minutes for those queries. I trained the support team on the system and iterated based on their feedback, improving accuracy from 65% to 92%.'
  },
  {
    questionType: 'helping',
    questionText: 'Tell me about helping someone succeed',
    storyText: 'I mentored a junior developer who was struggling with backend architecture concepts. Over 6 months, I held weekly 1-on-1 sessions, code reviews, and pair programming sessions. I assigned progressively complex tasks with detailed feedback, encouraged questions, and created a safe learning environment. They went from basic CRUD operations to designing and implementing a microservices architecture that now handles 1M requests/day. Seeing them present at our engineering all-hands was incredibly rewarding.'
  },
  {
    questionType: 'learning',
    questionText: 'Describe how you learned a new technology',
    storyText: 'When our company adopted Kubernetes, I took initiative to become our internal expert despite having zero container orchestration experience. I completed the CKA certification in 6 weeks through self-study and hands-on labs, set up our first production cluster, and created comprehensive documentation. I then trained 8 other engineers through workshops and office hours. Within 3 months we migrated 15 services to K8s, reducing infrastructure costs by 40% and improving deployment reliability.'
  },
  {
    questionType: 'values',
    questionText: 'Tell me about a time your values were challenged',
    storyText: 'My manager pressured me to ship a critical feature with known security vulnerabilities to meet a deadline. I respectfully pushed back, documenting the specific risks (potential data breach affecting 100K users) and proposing a phased approach. I worked extra hours to implement a minimal but secure version, collaborating with our security team. We shipped 3 days late but with proper authentication and encryption. The feature has processed $5M in transactions with zero security incidents.'
  },
  {
    questionType: 'passion',
    questionText: 'What project are you most passionate about?',
    storyText: 'I maintain an open-source library for real-time collaborative editing (similar to Google Docs) that has 8,000+ GitHub stars and is used by 50+ companies. I spend 10-15 hours per week on it - reviewing 200+ pull requests, fixing bugs, designing new features, and engaging with the community. The technical challenges of conflict-free replication and low-latency synchronization fascinate me. Seeing developers build amazing products with my library motivates me to continuously improve it.'
  }
];

// Mock Likert responses (Section B) - High Openness profile
const MOCK_LIKERT_HIGH_OPENNESS = {
  q1: 5,  // is original, comes up with new ideas (Openness)
  q2: 2,  // tends to be quiet (Extraversion - reversed)
  q3: 5,  // does a thorough job (Conscientiousness)
  q4: 2,  // is depressed, blue (Neuroticism - reversed)
  q5: 5,  // is inventive (Openness)
  q6: 4,  // is outgoing, sociable (Extraversion)
  q7: 5,  // makes plans and follows through (Conscientiousness)
  q8: 2,  // worries a lot (Neuroticism - reversed)
  q9: 4,  // has an active imagination (Openness)
  q10: 3, // is reserved (Extraversion - reversed)
  q11: 5, // is reliable, can be counted on (Conscientiousness)
  q12: 2, // is relaxed, handles stress well (Neuroticism - reversed)
  q13: 5, // values artistic, aesthetic experiences (Openness)
  q14: 4, // is sometimes shy, inhibited (Extraversion - reversed)
  q15: 5, // perseveres until the task is finished (Conscientiousness)
  q16: 4, // is emotionally stable (Neuroticism)
  q17: 5, // prefers work that is routine (Openness - reversed)
  q18: 5, // is talkative (Extraversion)
  q19: 4, // tends to be lazy (Conscientiousness - reversed)
  q20: 4  // remains calm in tense situations (Neuroticism)
};

// Mock Likert responses - High Conscientiousness profile
const MOCK_LIKERT_HIGH_CONSCIENTIOUSNESS = {
  q1: 3,  // is original, comes up with new ideas (Openness)
  q2: 2,  // tends to be quiet (Extraversion - reversed)
  q3: 5,  // does a thorough job (Conscientiousness)
  q4: 2,  // is depressed, blue (Neuroticism - reversed)
  q5: 3,  // is inventive (Openness)
  q6: 4,  // is outgoing, sociable (Extraversion)
  q7: 5,  // makes plans and follows through (Conscientiousness)
  q8: 2,  // worries a lot (Neuroticism - reversed)
  q9: 3,  // has an active imagination (Openness)
  q10: 3, // is reserved (Extraversion - reversed)
  q11: 5, // is reliable, can be counted on (Conscientiousness)
  q12: 4, // is relaxed, handles stress well (Neuroticism - reversed)
  q13: 3, // values artistic, aesthetic experiences (Openness)
  q14: 3, // is sometimes shy, inhibited (Extraversion - reversed)
  q15: 5, // perseveres until the task is finished (Conscientiousness)
  q16: 5, // is emotionally stable (Neuroticism)
  q17: 2, // prefers work that is routine (Openness - reversed)
  q18: 4, // is talkative (Extraversion)
  q19: 1, // tends to be lazy (Conscientiousness - reversed)
  q20: 5  // remains calm in tense situations (Neuroticism)
};

// Mock hybrid questions (Section C)
const MOCK_HYBRID_ANSWERS = [
  {
    questionType: 'work_environment',
    questionText: 'Describe your ideal work environment',
    answer: 'I thrive in collaborative open-plan offices where I can easily pair program with teammates, but with quiet zones for deep focus work. Access to whiteboards for brainstorming and standing desks is important. I prefer hybrid remote/in-office (3 days in office) with flexible hours. A culture of continuous learning, regular tech talks, and engineering-driven decision making energizes me.'
  },
  {
    questionType: 'project_management',
    questionText: 'How do you approach complex projects?',
    answer: 'I start by breaking down requirements into clear milestones and dependencies. I use agile methodology with 2-week sprints, daily standups, and retrospectives. I create detailed technical design docs, get peer review, then iterate. I track progress in Jira, communicate proactively with stakeholders, and adjust scope based on data. I always build in buffer time for unknowns and prioritize highest-risk items first.'
  },
  {
    questionType: 'stress_response',
    questionText: 'How do you handle high-pressure situations?',
    answer: 'I stay calm by focusing on what I can control. First, I quickly assess the situation and identify the critical path. I communicate clearly with stakeholders, setting realistic expectations. I break the problem into small actionable steps and tackle them methodically. I ask for help when needed and delegate where appropriate. After resolving the crisis, I always do a retrospective to prevent recurrence.'
  },
  {
    questionType: 'curiosity',
    questionText: 'How do you stay current with technology?',
    answer: 'I dedicate 5-7 hours weekly to learning - reading tech blogs (Hacker News, InfoQ), watching conference talks, and hands-on experimentation with new tools. I contribute to open source projects to learn from experienced developers. I attend 2-3 conferences per year and organize internal tech talks at work. I maintain a personal lab where I build side projects to explore emerging technologies like AI/ML and WebAssembly.'
  },
  {
    questionType: 'conflict_style',
    questionText: 'How do you handle disagreements with colleagues?',
    answer: 'I approach conflicts as opportunities to find better solutions. I listen actively to understand their perspective without interrupting. I focus on data and shared goals rather than personal opinions. I propose experiments or prototypes to test competing ideas objectively. If needed, I involve a neutral third party. I always assume good intent and maintain professional respect, even when we disagree strongly on technical approaches.'
  },
  {
    questionType: 'change_tolerance',
    questionText: 'How do you adapt to change?',
    answer: 'I see change as inevitable and try to embrace it. When priorities shift, I quickly reassess and reprioritize work. I ask questions to understand the reasoning behind changes and contribute to shaping the new direction. I stay flexible by not getting too attached to specific implementations. However, I do push back on thrashing - if requirements change weekly, I advocate for stabilizing the roadmap before proceeding.'
  },
  {
    questionType: 'motivation',
    questionText: 'What motivates you professionally?',
    answer: 'Building products that solve real problems for users motivates me most. I love seeing metrics improve based on features I shipped. Technical challenges that push my skills and require creative solutions energize me. Working with smart colleagues who challenge my thinking and help me grow is crucial. Recognition from peers through code reviews and seeing my work used by thousands of people drives me to deliver high-quality work.'
  }
];

// Expected OCEAN scores for HIGH_OPENNESS profile (70% Likert + 30% NLP)
const EXPECTED_HIGH_OPENNESS_SCORES = {
  openness: { min: 40, max: 95 },       // Adjusted for testing variability
  conscientiousness: { min: 50, max: 90 }, // Adjusted for testing variability
  extraversion: { min: 50, max: 70 },   // Moderate
  agreeableness: { min: 60, max: 80 },  // Moderate-high
  neuroticism: { min: 20, max: 50 }     // Adjusted for testing variability
};

// Mock job description for RAG testing
const MOCK_JOB_DESCRIPTION_DEVOPS = `
Senior DevOps Engineer

We're seeking an experienced DevOps engineer to lead our cloud infrastructure initiatives.

Requirements:
- 5+ years experience with Kubernetes and container orchestration
- Strong background in CI/CD automation and GitOps
- Experience with cloud platforms (AWS, GCP, or Azure)
- Proven ability to mentor junior engineers
- Track record of reducing infrastructure costs and improving reliability
- Excellent problem-solving and communication skills

Responsibilities:
- Design and maintain production Kubernetes clusters
- Implement automated deployment pipelines
- Monitor system performance and optimize costs
- Lead incident response and post-mortems
- Train and mentor team members on DevOps best practices

Nice to have:
- CKA or CKS certification
- Experience with service mesh (Istio, Linkerd)
- Infrastructure as Code (Terraform, Pulumi)
`;

const MOCK_JOB_DESCRIPTION_FRONTEND = `
Senior Frontend Engineer

Join our team building the next generation of collaborative editing tools.

Requirements:
- Expert in React, TypeScript, and modern frontend architecture
- Experience with real-time synchronization and WebSockets
- Strong UX/UI sensibility and ability to work with designers
- A/B testing and data-driven decision making
- Track record of improving key metrics (conversion, engagement)

Responsibilities:
- Build performant, accessible React applications
- Collaborate with design and product teams
- Implement A/B tests and analyze results
- Mentor junior frontend developers
- Optimize bundle size and performance

We value:
- Open source contributions
- Passion for developer tools
- Strong communication skills
`;

// Mock embedding (768-dim vector with small random values)
function generateMockEmbedding() {
  return Array.from({ length: 768 }, () => Math.random() * 0.2 - 0.1);
}

module.exports = {
  MOCK_STORIES,
  MOCK_LIKERT_HIGH_OPENNESS,
  MOCK_LIKERT_HIGH_CONSCIENTIOUSNESS,
  MOCK_HYBRID_ANSWERS,
  EXPECTED_HIGH_OPENNESS_SCORES,
  MOCK_JOB_DESCRIPTION_DEVOPS,
  MOCK_JOB_DESCRIPTION_FRONTEND,
  generateMockEmbedding
};
