import { Concept } from "@shared/schema";

// A simple in-memory vector database
class SimpleVectorDB {
  private vectors: { id: number; vector: number[]; metadata: any }[] = [];
  private dimension: number = 128; // Default vector dimension

  // Add a vector to the database
  async addVector(id: number, vector: number[], metadata: any = {}) {
    if (vector.length !== this.dimension) {
      throw new Error(`Vector must have dimension ${this.dimension}`);
    }
    this.vectors.push({ id, vector, metadata });
  }

  // Update a vector in the database
  async updateVector(id: number, vector: number[], metadata: any = {}) {
    const index = this.vectors.findIndex(v => v.id === id);
    if (index === -1) {
      throw new Error(`Vector with id ${id} not found`);
    }
    this.vectors[index] = { id, vector, metadata };
  }

  // Get similar vectors using cosine similarity
  async getSimilar(vector: number[], limit: number = 5) {
    if (vector.length !== this.dimension) {
      throw new Error(`Query vector must have dimension ${this.dimension}`);
    }

    // Calculate cosine similarity
    const similarities = this.vectors.map(v => ({
      id: v.id,
      metadata: v.metadata,
      similarity: this.cosineSimilarity(vector, v.vector)
    }));

    // Sort by similarity (highest first)
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  // Cosine similarity between two vectors
  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) {
      return 0;
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // Generate a random vector (for demo purposes)
  generateRandomVector(): number[] {
    return Array.from({ length: this.dimension }, () => Math.random() * 2 - 1);
  }
}

// Initialize the vector database
const vectorDB = new SimpleVectorDB();

/**
 * Get concept vector embedding (simplified for demo)
 */
function getConceptVector(concept: Concept): number[] {
  // In a real implementation, this would call an embedding API
  // For now, generate a random vector based on the concept name
  // This makes the vectors for the same concept consistent
  let seedValue = concept.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const rng = () => {
    seedValue = (seedValue * 9301 + 49297) % 233280;
    return seedValue / 233280;
  };
  return Array.from({ length: 128 }, () => rng() * 2 - 1);
}

/**
 * Add or update a concept in the vector database
 */
export async function indexConcept(concept: Concept) {
  const vector = getConceptVector(concept);
  
  try {
    await vectorDB.updateVector(concept.id, vector, { concept });
  } catch (error) {
    await vectorDB.addVector(concept.id, vector, { concept });
  }
}

/**
 * Get recommended concepts based on vector similarity
 */
export async function getRecommendedConcepts(concept: Concept, limit: number = 5) {
  // Get vector for the query concept
  const vector = getConceptVector(concept);
  
  // Get similar concepts
  const similar = await vectorDB.getSimilar(vector, limit + 1);
  
  // Filter out the query concept itself
  return similar
    .filter(item => item.id !== concept.id)
    .slice(0, limit)
    .map(item => ({
      concept: item.metadata.concept,
      similarity: item.similarity
    }));
}
