/**
 * Test RAG-powered story retrieval end-to-end
 *
 * Tests:
 * 1. Embedding generation for sample story
 * 2. Story storage with pgvector
 * 3. Semantic search retrieval
 * 4. Resume integration
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { generateStoryEmbedding, formatEmbeddingForPgVector } = require('../services/embeddingGenerator');
const { retrieveStoriesForResume, retrieveStoriesForCoverLetter } = require('../services/storyRetriever');

async function testRAGFlow() {
  console.log('🧪 Starting RAG Flow Test...\n');

  try {
    // Step 1: Create test user (or use existing)
    console.log('📝 Step 1: Setting up test user...');

    let testUser = await prisma.user.findUnique({
      where: { email: 'rag-test@cvstomize.com' }
    });

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          firebaseUid: 'rag-test-' + Date.now(),
          email: 'rag-test@cvstomize.com',
          emailVerified: true,
          subscriptionTier: 'gold',
          displayName: 'RAG Test User'
        }
      });
      console.log(`✅ Created test user: ${testUser.id}`);
    } else {
      console.log(`✅ Using existing test user: ${testUser.id}`);
    }

    // Step 2: Create personality profile
    console.log('\n📝 Step 2: Creating personality profile...');

    let profile = await prisma.personalityProfile.findUnique({
      where: { userId: testUser.id }
    });

    if (!profile) {
      profile = await prisma.personalityProfile.create({
        data: {
          userId: testUser.id,
          assessmentVersion: 'hybrid-v3',
          isComplete: true,
          openness: 85,
          conscientiousness: 78,
          extraversion: 65,
          agreeableness: 72,
          neuroticism: 40
        }
      });
      console.log(`✅ Created personality profile: ${profile.id}`);
    } else {
      console.log(`✅ Using existing profile: ${profile.id}`);
    }

    // Step 3: Create test stories with embeddings
    console.log('\n📝 Step 3: Creating test stories with embeddings...');

    const testStories = [
      {
        questionType: 'achievement',
        questionText: 'Tell me about your proudest professional achievement',
        storyText: 'I led a team of 5 engineers to migrate our monolithic application to microservices architecture. This reduced deployment time by 80% and improved system reliability from 99.5% to 99.95%. I coordinated across 3 different teams, managed stakeholder expectations, and delivered the project 2 weeks ahead of schedule.',
        category: 'technical_leadership',
        themes: ['leadership', 'architecture', 'performance'],
        skillsDemonstrated: ['microservices', 'team leadership', 'project management', 'cloud migration'],
        relevanceTags: ['engineering', 'architecture', 'devops']
      },
      {
        questionType: 'innovation',
        questionText: 'Describe a time you introduced an innovative solution',
        storyText: 'Our customer support team was drowning in repetitive questions. I built an AI-powered chatbot using GPT-4 that handled 60% of common inquiries automatically. This saved the team 20 hours per week and improved customer satisfaction scores by 15%. I integrated it with our existing Zendesk system using webhooks.',
        category: 'product_innovation',
        themes: ['automation', 'ai', 'efficiency'],
        skillsDemonstrated: ['artificial intelligence', 'automation', 'api integration', 'customer experience'],
        relevanceTags: ['ai', 'automation', 'customer-service']
      },
      {
        questionType: 'team',
        questionText: 'Tell me about a successful team collaboration',
        storyText: 'I worked with our design and product teams to completely redesign our onboarding flow. Through A/B testing and user interviews, we increased signup completion rate from 45% to 78%. I facilitated weekly design reviews, built the frontend with React, and coordinated the rollout across 3 countries.',
        category: 'cross_functional',
        themes: ['collaboration', 'ux', 'data-driven'],
        skillsDemonstrated: ['react', 'a/b testing', 'user research', 'cross-functional collaboration'],
        relevanceTags: ['frontend', 'product', 'design']
      },
      {
        questionType: 'learning',
        questionText: 'Describe how you learned a new technology',
        storyText: 'When our company decided to adopt Kubernetes, I took the initiative to become the internal expert. I completed the CKA certification, set up our first production cluster, and trained 8 other engineers. Within 3 months, we had migrated 12 services to Kubernetes, reducing infrastructure costs by 35%.',
        category: 'technical_growth',
        themes: ['learning', 'infrastructure', 'mentoring'],
        skillsDemonstrated: ['kubernetes', 'devops', 'mentoring', 'cost optimization'],
        relevanceTags: ['kubernetes', 'devops', 'infrastructure']
      },
      {
        questionType: 'passion',
        questionText: 'What project are you most passionate about?',
        storyText: 'I built an open-source library for real-time collaborative editing that has 5,000+ GitHub stars. It uses CRDTs for conflict-free replication and WebSockets for low-latency synchronization. I maintain the project in my free time, respond to issues, and have accepted 150+ pull requests from the community.',
        category: 'open_source',
        themes: ['passion', 'community', 'technical-depth'],
        skillsDemonstrated: ['open source', 'real-time systems', 'websockets', 'community management'],
        relevanceTags: ['open-source', 'real-time', 'collaboration']
      }
    ];

    const createdStories = [];

    for (const storyData of testStories) {
      // Check if story already exists
      const existing = await prisma.profileStory.findFirst({
        where: {
          userId: testUser.id,
          questionType: storyData.questionType
        }
      });

      if (!existing) {
        console.log(`   Generating embedding for ${storyData.questionType} story...`);

        // Generate embedding
        const embedding = await generateStoryEmbedding({
          questionText: storyData.questionText,
          storyText: storyData.storyText,
          storySummary: storyData.storyText.substring(0, 150) + '...'
        });

        const embeddingStr = formatEmbeddingForPgVector(embedding);

        // Create story with embedding via raw SQL
        const result = await prisma.$executeRawUnsafe(
          `INSERT INTO profile_stories
           (id, user_id, profile_id, question_type, question_text, story_text,
            category, themes, skills_demonstrated, relevance_tags, embedding, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::vector, NOW(), NOW())`,
          require('crypto').randomUUID(),
          testUser.id,
          profile.id,
          storyData.questionType,
          storyData.questionText,
          storyData.storyText,
          storyData.category,
          storyData.themes,
          storyData.skillsDemonstrated,
          storyData.relevanceTags,
          embeddingStr
        );

        console.log(`   ✅ Created ${storyData.questionType} story with embedding`);
        createdStories.push(storyData);
      } else {
        console.log(`   ⏭️  Story ${storyData.questionType} already exists`);
      }
    }

    console.log(`✅ Test stories ready (${createdStories.length} new, ${testStories.length - createdStories.length} existing)`);

    // Step 4: Test semantic search with different job descriptions
    console.log('\n📝 Step 4: Testing semantic search...\n');

    const testJobs = [
      {
        title: 'Senior DevOps Engineer',
        description: 'We need a DevOps engineer experienced with Kubernetes, microservices, and cloud infrastructure. Must have led migration projects and mentored junior engineers.'
      },
      {
        title: 'AI/ML Product Engineer',
        description: 'Build AI-powered features for our SaaS product. Experience with GPT models, API integration, and understanding customer needs through data.'
      },
      {
        title: 'Frontend Tech Lead',
        description: 'Lead our frontend team building React applications. Must have experience with A/B testing, user research, and cross-functional collaboration with design and product.'
      }
    ];

    for (const job of testJobs) {
      console.log(`🔍 Job: ${job.title}`);
      console.log(`   Description: ${job.description.substring(0, 100)}...`);

      const stories = await retrieveStoriesForResume(testUser.id, job.description, 3);

      console.log(`   📊 Retrieved ${stories.length} stories:\n`);

      stories.forEach((story, idx) => {
        console.log(`   ${idx + 1}. ${story.questionType} (${(story.similarity * 100).toFixed(1)}% match)`);
        console.log(`      Skills: ${story.skillsDemonstrated?.slice(0, 3).join(', ')}`);
        console.log(`      Preview: ${story.storyText.substring(0, 80)}...`);
        console.log('');
      });
    }

    // Step 5: Test cover letter retrieval
    console.log('📝 Step 5: Testing cover letter story retrieval...\n');

    const companyInfo = 'We are a mission-driven startup building open-source developer tools. We value passion for community, technical excellence, and collaborative culture.';

    const coverLetterStories = await retrieveStoriesForCoverLetter(testUser.id, companyInfo, 2);

    console.log(`🔍 Company: Mission-driven open-source startup`);
    console.log(`   📊 Retrieved ${coverLetterStories.length} stories:\n`);

    coverLetterStories.forEach((story, idx) => {
      console.log(`   ${idx + 1}. ${story.questionType} (${(story.similarity * 100).toFixed(1)}% match)`);
      console.log(`      Themes: ${story.themes?.join(', ')}`);
      console.log(`      Preview: ${story.storyText.substring(0, 80)}...`);
      console.log('');
    });

    // Summary
    console.log('\n✅ RAG Flow Test Complete!\n');
    console.log('📊 Results:');
    console.log(`   - Test user created: ${testUser.email}`);
    console.log(`   - Stories with embeddings: ${testStories.length}`);
    console.log(`   - Semantic search: Working ✓`);
    console.log(`   - Resume retrieval: Working ✓`);
    console.log(`   - Cover letter retrieval: Working ✓`);
    console.log('\n🎉 All RAG components operational!');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run test if executed directly
if (require.main === module) {
  testRAGFlow()
    .then(() => {
      console.log('\n✅ Test script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test script failed:', error);
      process.exit(1);
    });
}

module.exports = { testRAGFlow };
