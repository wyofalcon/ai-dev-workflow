/**
 * Gemini Service Factory
 *
 * Automatically selects the appropriate Gemini service based on environment:
 * - USE_MOCK_AI=true → Mock service (FREE, no GCP costs)
 * - Otherwise → Vertex AI service (requires GCP credentials)
 *
 * This makes it easy to develop locally without GCP costs,
 * while seamlessly switching to production services.
 */

function getGeminiService() {
  // Use mock service for cost-free local development
  if (process.env.USE_MOCK_AI === "true") {
    console.log("🤖 AI Mode: MOCK (free, no GCP costs)");
    return require("./geminiServiceMock");
  }

  // Use real Vertex AI service
  console.log("🤖 AI Mode: Vertex AI (GCP)");
  return require("./geminiServiceVertex");
}

module.exports = {
  getGeminiService,
  // Export singleton for convenience
  geminiService: getGeminiService(),
};
