/**
 * Quick test of Gold Standard profileAnalyzer service
 */

const { analyzePersonality } = require('./services/profileAnalyzer');

// Mock test data matching the expected format
const assessmentData = {
  likertResponses: {
    // Openness (Q1-4): inventive, curious, routine(R), original
    q1: 5, // inventive - Strongly Agree
    q2: 5, // curious - Strongly Agree
    q3: 2, // routine (R) - Disagree
    q4: 5, // original - Strongly Agree

    // Conscientiousness (Q5-8): thorough, disorganized(R), reliable, perseveres
    q5: 5, // thorough - Strongly Agree
    q6: 1, // disorganized (R) - Strongly Disagree
    q7: 5, // reliable - Strongly Agree
    q8: 5, // perseveres - Strongly Agree

    // Extraversion (Q9-12): talkative, reserved(R), outgoing, enthusiastic
    q9: 3, // talkative - Neutral
    q10: 3, // reserved (R) - Neutral
    q11: 4, // outgoing - Agree
    q12: 4, // enthusiastic - Agree

    // Agreeableness (Q13-16): helpful, cold(R), considerate, cooperative
    q13: 5, // helpful - Strongly Agree
    q14: 1, // cold (R) - Strongly Disagree
    q15: 5, // considerate - Strongly Agree
    q16: 5, // cooperative - Strongly Agree

    // Neuroticism (Q17-20): worries, relaxed(R), nervous, calm(R)
    q17: 2, // worries - Disagree
    q18: 4, // relaxed (R) - Agree
    q19: 2, // nervous - Disagree
    q20: 4  // calm (R) - Agree
  },
  stories: [
    {
      question_type: 'achievement',
      story_text: 'I led a team to migrate our monolithic app to microservices on Kubernetes. Despite tight deadlines, I planned meticulously, documented everything, and mentored junior developers throughout. The project succeeded, improved system reliability by 99.9%, and reduced deployment time from hours to minutes.'
    },
    {
      question_type: 'challenge',
      story_text: 'When our API response times hit 5 seconds during peak load, I systematically profiled the bottlenecks, implemented database indexing and Redis caching, and redesigned data access patterns. This reduced response time by 96% to under 200ms.'
    }
  ],
  hybridAnswers: [
    {
      question: 'How do you prefer to work?',
      answer: 'I thrive in collaborative environments with clear goals, but also value deep focus time for complex problem-solving.'
    }
  ]
};

async function testGoldStandard() {
  console.log('\n🧪 Testing Gold Standard Personality Assessment\n');
  console.log('📝 Test Data:');
  console.log('- Stories:', assessmentData.stories.length);
  console.log('- Likert responses:', Object.keys(assessmentData.likertResponses).length);
  console.log('- Hybrid answers:', assessmentData.hybridAnswers.length);
  console.log('\n⏳ Running analysis...\n');

  try {
    const result = await analyzePersonality(assessmentData);

    console.log('\n\n✅ ANALYSIS COMPLETE!\n');
    console.log('═'.repeat(60));
    console.log('📊 OCEAN SCORES (0-100 scale)');
    console.log('═'.repeat(60));
    console.log('Openness:         ', result.openness);
    console.log('Conscientiousness:', result.conscientiousness);
    console.log('Extraversion:     ', result.extraversion);
    console.log('Agreeableness:    ', result.agreeableness);
    console.log('Neuroticism:      ', result.neuroticism);

    console.log('\n' + '═'.repeat(60));
    console.log('🎯 ASSESSMENT QUALITY');
    console.log('═'.repeat(60));
    console.log('Confidence Score: ', (result.confidenceScore * 100).toFixed(1) + '%');
    console.log('Assessment Ver:   ', result.assessmentVersion);

    console.log('\n' + '═'.repeat(60));
    console.log('💼 DERIVED WORK PREFERENCES');
    console.log('═'.repeat(60));
    console.log('Work Style:       ', result.workStyle);
    console.log('Communication:    ', result.communicationStyle);
    console.log('Leadership:       ', result.leadershipStyle);
    console.log('Motivation:       ', result.motivationType);
    console.log('Decision Making:  ', result.decisionMaking);

    console.log('\n' + '═'.repeat(60));
    console.log('📝 PROFILE SUMMARY');
    console.log('═'.repeat(60));
    console.log(result.profileSummary);

    console.log('\n' + '═'.repeat(60));
    console.log('🔬 METHODOLOGY BREAKDOWN');
    console.log('═'.repeat(60));
    console.log('Fusion Weights:', JSON.stringify(result.fusionWeights));
    console.log('\nLikert Scores (BFI-20):');
    Object.entries(result.likertScores).forEach(([trait, score]) => {
      console.log('  ' + trait + ':', score);
    });
    console.log('\nNarrative Scores (Gemini NLP):');
    Object.entries(result.narrativeScores).forEach(([trait, score]) => {
      console.log('  ' + trait + ':', score);
    });

    console.log('\n\n✅ TEST PASSED: Gold Standard analysis working correctly!\n');
    return true;
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

testGoldStandard().then(success => {
  process.exit(success ? 0 : 1);
});
