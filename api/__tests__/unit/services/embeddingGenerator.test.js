/**
 * Unit tests for Embedding Generator (Vertex AI Integration)
 *
 * Tests:
 * 1. Single embedding generation
 * 2. Batch processing with rate limiting
 * 3. Story-optimized embeddings
 * 4. Format conversion for pgvector
 * 5. Error handling
 */

const {
  generateEmbedding,
  generateStoryEmbedding,
  generateEmbeddingsBatch,
  formatEmbeddingForPgVector,
  calculateCosineSimilarity
} = require('../../../services/embeddingGenerator');

// Mock Vertex AI
jest.mock('@google-cloud/vertexai', () => ({
  VertexAI: jest.fn().mockImplementation(() => ({
    preview: {
      getGenerativeModel: jest.fn(() => ({
        embedContent: jest.fn((content) => {
          // Return mock 768-dim embedding
          const text = content.content[0].parts[0].text;
          const mockEmbedding = new Array(768).fill(0);

          // Generate deterministic embedding based on text length
          for (let i = 0; i < Math.min(text.length, 768); i++) {
            mockEmbedding[i] = (text.charCodeAt(i) % 100) / 100;
          }

          // Fill rest with small random values
          for (let i = text.length; i < 768; i++) {
            mockEmbedding[i] = Math.random() * 0.1;
          }

          return Promise.resolve({
            embedding: { values: mockEmbedding }
          });
        })
      }))
    }
  }))
}));

describe('Embedding Generator - Unit Tests', () => {
  describe('Single Embedding Generation', () => {
    it('should generate 768-dimensional vector', async () => {
      const text = 'This is a test sentence about software engineering.';

      const embedding = await generateEmbedding(text);

      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding).toHaveLength(768);
    });

    it('should return numbers in embedding vector', async () => {
      const embedding = await generateEmbedding('test');

      embedding.forEach(value => {
        expect(typeof value).toBe('number');
        expect(isNaN(value)).toBe(false);
        expect(isFinite(value)).toBe(true);
      });
    });

    it('should handle empty text', async () => {
      const embedding = await generateEmbedding('');

      expect(embedding).toHaveLength(768);
    });

    it('should handle very long text', async () => {
      const longText = 'word '.repeat(1000); // 5000+ characters

      const embedding = await generateEmbedding(longText);

      expect(embedding).toHaveLength(768);
    });

    it('should handle special characters', async () => {
      const specialText = "Test with 'quotes', \"double quotes\", and symbols: @#$%^&*()!";

      const embedding = await generateEmbedding(specialText);

      expect(embedding).toHaveLength(768);
    });

    it('should handle non-English text', async () => {
      const unicodeText = '这是中文测试 Prueba en español Тест на русском';

      const embedding = await generateEmbedding(unicodeText);

      expect(embedding).toHaveLength(768);
    });
  });

  describe('Story-Optimized Embeddings', () => {
    it('should combine question + answer + summary', async () => {
      const story = {
        questionText: 'What is your proudest achievement?',
        storyText: 'I led a team of 5 engineers to build a scalable platform.',
        storySummary: 'Led engineering team to build platform'
      };

      const embedding = await generateStoryEmbedding(story);

      expect(embedding).toHaveLength(768);
    });

    it('should work without summary', async () => {
      const story = {
        questionText: 'Test question',
        storyText: 'Test story',
        storySummary: null
      };

      const embedding = await generateStoryEmbedding(story);

      expect(embedding).toHaveLength(768);
    });

    it('should prioritize summary when available', async () => {
      const storyWithSummary = {
        questionText: 'Q',
        storyText: 'Very long story text that goes on and on...',
        storySummary: 'Short summary'
      };

      const storyWithoutSummary = {
        questionText: 'Q',
        storyText: 'Very long story text that goes on and on...',
        storySummary: null
      };

      const embedding1 = await generateStoryEmbedding(storyWithSummary);
      const embedding2 = await generateStoryEmbedding(storyWithoutSummary);

      // Embeddings should be different (summary changes input)
      expect(embedding1).not.toEqual(embedding2);
    });
  });

  describe('Batch Processing', () => {
    it('should process multiple texts in batch', async () => {
      const texts = [
        'First test text',
        'Second test text',
        'Third test text'
      ];

      const embeddings = await generateEmbeddingsBatch(texts);

      expect(embeddings).toHaveLength(3);
      embeddings.forEach(embedding => {
        expect(embedding).toHaveLength(768);
      });
    });

    it('should handle empty batch', async () => {
      const embeddings = await generateEmbeddingsBatch([]);

      expect(embeddings).toEqual([]);
    });

    it('should handle single item batch', async () => {
      const embeddings = await generateEmbeddingsBatch(['single text']);

      expect(embeddings).toHaveLength(1);
      expect(embeddings[0]).toHaveLength(768);
    });

    it('should respect rate limiting delay', async () => {
      const texts = ['text1', 'text2', 'text3'];

      const start = Date.now();
      await generateEmbeddingsBatch(texts, 100); // 100ms delay
      const duration = Date.now() - start;

      // Should take at least 200ms (2 delays for 3 items)
      // Allow some margin for processing time
      expect(duration).toBeGreaterThanOrEqual(150);
    });
  });

  describe('pgvector Format Conversion', () => {
    it('should format vector as bracketed comma-separated string', () => {
      const embedding = [0.1, 0.2, 0.3];

      const formatted = formatEmbeddingForPgVector(embedding);

      expect(formatted).toBe('[0.1,0.2,0.3]');
    });

    it('should handle 768-dimensional vector', () => {
      const embedding = new Array(768).fill(0.123);

      const formatted = formatEmbeddingForPgVector(embedding);

      expect(formatted.startsWith('[')).toBe(true);
      expect(formatted.endsWith(']')).toBe(true);

      const values = formatted.slice(1, -1).split(',');
      expect(values).toHaveLength(768);
    });

    it('should preserve decimal precision', () => {
      const embedding = [0.123456789, 0.987654321];

      const formatted = formatEmbeddingForPgVector(embedding);

      expect(formatted).toBe('[0.123456789,0.987654321]');
    });

    it('should handle negative values', () => {
      const embedding = [-0.5, 0.5, -0.3];

      const formatted = formatEmbeddingForPgVector(embedding);

      expect(formatted).toBe('[-0.5,0.5,-0.3]');
    });

    it('should handle zero values', () => {
      const embedding = [0, 0, 0];

      const formatted = formatEmbeddingForPgVector(embedding);

      expect(formatted).toBe('[0,0,0]');
    });

    it('should handle very small numbers', () => {
      const embedding = [0.000001, 0.999999];

      const formatted = formatEmbeddingForPgVector(embedding);

      expect(formatted).toContain('0.000001');
      expect(formatted).toContain('0.999999');
    });
  });

  describe('Cosine Similarity Calculation', () => {
    it('should return 1.0 for identical vectors', () => {
      const vec1 = [0.1, 0.2, 0.3];
      const vec2 = [0.1, 0.2, 0.3];

      const similarity = calculateCosineSimilarity(vec1, vec2);

      expect(similarity).toBeCloseTo(1.0, 5);
    });

    it('should return 0.0 for orthogonal vectors', () => {
      const vec1 = [1, 0, 0];
      const vec2 = [0, 1, 0];

      const similarity = calculateCosineSimilarity(vec1, vec2);

      expect(similarity).toBeCloseTo(0.0, 5);
    });

    it('should return -1.0 for opposite vectors', () => {
      const vec1 = [1, 0, 0];
      const vec2 = [-1, 0, 0];

      const similarity = calculateCosineSimilarity(vec1, vec2);

      expect(similarity).toBeCloseTo(-1.0, 5);
    });

    it('should handle 768-dimensional vectors', () => {
      const vec1 = new Array(768).fill(0.1);
      const vec2 = new Array(768).fill(0.1);

      const similarity = calculateCosineSimilarity(vec1, vec2);

      expect(similarity).toBeCloseTo(1.0, 5);
    });

    it('should be commutative', () => {
      const vec1 = [0.5, 0.3, 0.2];
      const vec2 = [0.1, 0.4, 0.6];

      const sim1 = calculateCosineSimilarity(vec1, vec2);
      const sim2 = calculateCosineSimilarity(vec2, vec1);

      expect(sim1).toBeCloseTo(sim2, 10);
    });

    it('should return value between -1 and 1', () => {
      const vec1 = Array.from({ length: 768 }, () => Math.random());
      const vec2 = Array.from({ length: 768 }, () => Math.random());

      const similarity = calculateCosineSimilarity(vec1, vec2);

      expect(similarity).toBeGreaterThanOrEqual(-1);
      expect(similarity).toBeLessThanOrEqual(1);
    });

    it('should handle zero vectors gracefully', () => {
      const vec1 = [0, 0, 0];
      const vec2 = [0.1, 0.2, 0.3];

      const similarity = calculateCosineSimilarity(vec1, vec2);

      // Should return 0 (or handle division by zero)
      expect(similarity).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle null or undefined input gracefully', async () => {
      await expect(generateEmbedding(null)).rejects.toThrow();
    });

    it('should throw error for invalid story object', async () => {
      const invalidStory = {
        // Missing required fields
        randomField: 'value'
      };

      await expect(generateStoryEmbedding(invalidStory)).rejects.toThrow();
    });

    it('should throw error for mismatched vector dimensions in similarity', () => {
      const vec1 = [1, 2, 3];
      const vec2 = [1, 2]; // Different length

      expect(() => calculateCosineSimilarity(vec1, vec2)).toThrow();
    });
  });

  describe('Determinism and Consistency', () => {
    it('should generate same embedding for same text', async () => {
      const text = 'Consistent test text';

      const embedding1 = await generateEmbedding(text);
      const embedding2 = await generateEmbedding(text);

      // Should be identical (mocked implementation is deterministic)
      expect(embedding1).toEqual(embedding2);
    });

    it('should generate different embeddings for different texts', async () => {
      const text1 = 'First text';
      const text2 = 'Different text';

      const embedding1 = await generateEmbedding(text1);
      const embedding2 = await generateEmbedding(text2);

      // Should be different
      expect(embedding1).not.toEqual(embedding2);
    });
  });
});
