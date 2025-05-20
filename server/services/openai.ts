import OpenAI from "openai";
import { Concept, InsertInsight } from "@shared/schema";

// Initialize OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "sk-dummy-key" });

/**
 * Extract concepts from text
 */
export async function extractConcepts(text: string): Promise<Partial<Concept>[]> {
  try {
    const prompt = `
    Extract the key concepts from the following text. For each concept, provide:
    1. A name (short phrase)
    2. A concise description
    3. Related tags (up to 3)
    
    Format your response as a JSON array of objects with the following structure:
    [
      {
        "name": "Concept Name",
        "description": "Brief description of the concept",
        "tags": ["tag1", "tag2", "tag3"]
      }
    ]
    
    Text to analyze:
    ${text.substring(0, 4000)}
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: "You are a knowledge extraction expert. Extract key concepts with precision and conciseness." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    // Map to our Concept type format
    return result.map((item: any) => ({
      name: item.name,
      description: item.description,
      tags: item.tags,
      userId: 1 // Default user
    }));
  } catch (error) {
    console.error("Error extracting concepts:", error);
    return [];
  }
}

/**
 * Generate insights about relationships between concepts
 */
export async function generateInsights(concepts: Concept[]): Promise<Partial<InsertInsight>[]> {
  try {
    if (concepts.length === 0) {
      return [];
    }

    const conceptNames = concepts.map(c => c.name).join(", ");
    const conceptDescriptions = concepts.map(c => `${c.name}: ${c.description}`).join("\n");
    
    const prompt = `
    Generate insightful connections between these concepts:
    ${conceptDescriptions}
    
    For each insight:
    1. Highlight non-obvious connections between concepts
    2. Suggest deeper understanding or potential applications
    3. Identify gaps in knowledge that could be filled
    
    Format your response as a JSON array of objects with the following structure:
    [
      {
        "content": "Your insightful text here, mentioning connections between concepts",
        "relatedConceptIds": [list of concept IDs that are mentioned]
      }
    ]
    
    The available concept IDs are: ${concepts.map(c => `${c.id} (${c.name})`).join(", ")}
    Generate 2-3 different insights.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: "You are a knowledge connection expert. Generate insightful connections between concepts." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    // Map and validate related concept IDs
    return result.map((item: any) => ({
      content: item.content,
      relatedConceptIds: Array.isArray(item.relatedConceptIds) 
        ? item.relatedConceptIds.filter((id: any) => concepts.some(c => c.id === id))
        : [],
      userId: 1 // Default user
    }));
  } catch (error) {
    console.error("Error generating insights:", error);
    return [];
  }
}
