import Anthropic from '@anthropic-ai/sdk';
import { Concept } from "@shared/schema";
import { QuizQuestion } from "./spaceRepetition";

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Extract concepts from text
 */
export async function extractConcepts(text: string): Promise<Partial<Concept>[]> {
  try {
    const prompt = `
      I have a document related to a knowledge graph learning system. Please extract the main concepts from this text.
      For each concept, provide:
      1. A name (keep it concise)
      2. A short description (2-3 sentences)
      3. Relevant tags (up to 5 keywords)
      
      Return the information in a structured format that can be easily parsed as JSON.
      Format: An array of objects with "name", "description", and "tags" (array of strings) properties.
      
      Here's the text:
      ${text.slice(0, 8000)}
    `;

    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 2000,
      system: "You extract structured information about concepts from academic text. Your responses must be valid JSON arrays with no extra text.",
      messages: [{ role: "user", content: prompt }],
    });

    // Extract JSON from Claude's response
    const content = response.content[0].text;
    const jsonMatch = content.match(/\[\s*\{.*\}\s*\]/s);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback if no JSON array found
    return JSON.parse(content);
  } catch (error: any) {
    console.error("Error extracting concepts:", error.message);
    return [];
  }
}

/**
 * Generate insights about relationships between concepts
 */
export async function generateInsights(concepts: Concept[]): Promise<any[]> {
  try {
    if (concepts.length < 2) {
      return [];
    }

    const conceptInfo = concepts.map(c => ({ id: c.id, name: c.name, description: c.description }));
    
    const prompt = `
      I have the following concepts from a knowledge graph:
      ${JSON.stringify(conceptInfo, null, 2)}
      
      Please analyze these concepts and generate 2-3 insights about relationships between them.
      For each insight:
      1. Provide a detailed explanation of the relationship (one paragraph)
      2. Include the IDs of the related concepts
      
      Return in a structured JSON format I can parse, with each object having:
      - "content": The insight text explaining the relationship
      - "relatedConceptIds": Array of concept IDs related to this insight
      
      Ensure your insights are educational and would help a student understand the connections between concepts.
    `;

    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 2000,
      system: "You analyze academic concepts and find meaningful relationships between them. Your responses must be valid JSON arrays with no extra text.",
      messages: [{ role: "user", content: prompt }],
    });

    // Extract JSON from Claude's response
    const content = response.content[0].text;
    const jsonMatch = content.match(/\[\s*\{.*\}\s*\]/s);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback if no JSON array found
    return JSON.parse(content);
  } catch (error: any) {
    console.error("Error generating insights:", error.message);
    return [];
  }
}

/**
 * Generate quiz questions for a concept
 */
export async function generateQuizQuestions(
  concept: Concept,
  relatedDocuments: any[] = [],
  questionCount: number = 3
): Promise<QuizQuestion[]> {
  try {
    const prompt = `
      Generate ${questionCount} quiz questions for learning about "${concept.name}".
      
      Concept description: ${concept.description}
      
      ${relatedDocuments.length > 0 ? `Related document information: ${JSON.stringify(relatedDocuments)}` : ''}
      
      For each question:
      1. Create a challenging but fair multiple-choice question testing understanding of this concept
      2. Provide 4 possible answers with only one correct option
      3. The correct answer should be at different positions for different questions (don't always make it the first option)
      4. Include a detailed explanation of why the correct answer is right and others are wrong
      
      Return in JSON format with this structure:
      [
        {
          "question": "The question text",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": 0, // Index of correct answer (0-3)
          "explanation": "Explanation of the correct answer and why others are incorrect"
        },
        // More questions...
      ]
    `;

    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 2000,
      system: "You are an expert educational content creator specializing in creating quiz questions for advanced learning. Your responses must be valid JSON arrays with no extra text.",
      messages: [{ role: "user", content: prompt }],
    });

    // Extract JSON from Claude's response
    const content = response.content[0].text;
    const jsonMatch = content.match(/\[\s*\{.*\}\s*\]/s);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback if no JSON array found
    return JSON.parse(content);
  } catch (error: any) {
    console.error("Error generating quiz questions:", error.message);
    return [];
  }
}