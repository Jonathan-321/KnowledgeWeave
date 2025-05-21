import Anthropic from '@anthropic-ai/sdk';
import { Concept } from "@shared/schema";
import { QuizQuestion } from "./spaceRepetition";

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Extract JSON from Claude's response, handling different response types
 */
function extractJsonFromResponse(response: any): any {
  try {
    if (!response.content || response.content.length === 0) {
      return null;
    }
    
    const firstContent = response.content[0];
    if (firstContent.type !== 'text') {
      return null;
    }
    
    const text = firstContent.text;
    
    // First try to extract JSON array pattern
    const jsonPattern = /\[\s*\{[\s\S]*\}\s*\]/;
    const jsonMatch = text.match(jsonPattern);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // If that fails, try to parse the whole response as JSON
    return JSON.parse(text);
  } catch (error) {
    console.error("Error extracting JSON from response:", error);
    return null;
  }
}

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

    const concepts = extractJsonFromResponse(response);
    return concepts || [];
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

    const insights = extractJsonFromResponse(response);
    return insights || [];
  } catch (error: any) {
    console.error("Error generating insights:", error.message);
    return [];
  }
}

/**
 * Generate adaptive quiz questions for a concept with difficulty adjusted based on learning progress
 */
export async function generateQuizQuestions(
  concept: Concept,
  learningProgress?: any,
  relatedDocuments: any[] = [],
  questionCount: number = 3
): Promise<QuizQuestion[]> {
  try {
    // Determine difficulty level based on learning progress
    let difficulty = "medium";
    let focusAreas = [];
    
    if (learningProgress) {
      // Adjust difficulty based on comprehension score
      if (learningProgress.comprehension < 40) {
        difficulty = "basic";
      } else if (learningProgress.comprehension > 75) {
        difficulty = "advanced";
      }
      
      // Add focus on areas that need improvement
      if (learningProgress.reviewCount > 2 && learningProgress.comprehension < 60) {
        focusAreas.push("fundamentals");
      }
    }
    
    // Create adaptive system prompt
    const systemPrompt = `You are an expert educational content creator who specializes in adaptive learning.
    
    Create ${difficulty}-level quiz questions that adapt to a learner's current understanding.
    ${focusAreas.length > 0 ? `Focus especially on: ${focusAreas.join(", ")}` : ""}
    
    For basic level: Focus on core definitions and foundational principles.
    For medium level: Include application of concepts and some analysis.
    For advanced level: Focus on synthesis, evaluation and connecting with other concepts.
    
    Your responses must be VALID JSON ARRAYS with no extra text. Return ONLY a JSON array of questions.`;
    
    const prompt = `
      Generate ${questionCount} adaptive quiz questions for learning about "${concept.name}" at ${difficulty} difficulty.
      
      Concept description: ${concept.description}
      ${concept.tags ? `Tags: ${concept.tags.join(', ')}` : ''}
      
      ${relatedDocuments.length > 0 ? `Related document information: ${JSON.stringify(relatedDocuments)}` : ''}
      ${learningProgress ? `Current learner stats:
        - Comprehension score: ${learningProgress.comprehension}/100
        - Times reviewed: ${learningProgress.reviewCount || 0}
        - Last review: ${learningProgress.lastReviewDate || 'Never'}` 
        : 'No prior learning history available'}
      
      For each question:
      1. Create a question appropriate for ${difficulty} difficulty level
      2. Provide 4 possible answers with only one correct option
      3. The correct answer should be at different positions
      4. Include a detailed explanation of why the correct answer is right
      5. Add a "difficulty" field marking this as "${difficulty}"
      6. Add a "conceptArea" field indicating what specific aspect of ${concept.name} this tests
      
      Return in JSON format with this structure:
      [
        {
          "question": "The question text",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": 0, // Index of correct answer (0-3)
          "explanation": "Explanation of the correct answer and why others are incorrect",
          "difficulty": "${difficulty}", // "basic", "medium", or "advanced"
          "conceptArea": "The specific area of the concept being tested"
        },
        // More questions...
      ]
    `;

    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    });

    // Extract JSON from Claude's response
    let questions = extractJsonFromResponse(response);
    
    // Fallback if JSON extraction fails
    if (!questions || questions.length === 0) {
      // Create default questions based on concept information
      return [
        {
          question: `What is the primary purpose of ${concept.name}?`,
          options: [
            concept.description.split('.')[0],
            "It's a theoretical framework with no practical applications",
            "It's only used in specific academic contexts",
            "None of the above"
          ],
          correctAnswer: 0,
          explanation: `${concept.name} is primarily about ${concept.description.split('.')[0]}.`,
          difficulty: difficulty as "basic" | "medium" | "advanced", 
          conceptArea: "Fundamentals"
        },
        {
          question: `Which field is most closely associated with ${concept.name}?`,
          options: [
            concept.tags?.[0] || "Machine Learning",
            "Database Management",
            "Web Development", 
            "Network Security"
          ],
          correctAnswer: 0,
          explanation: `${concept.name} is closely associated with ${concept.tags?.[0] || "this field"}.`,
          difficulty: difficulty as "basic" | "medium" | "advanced",
          conceptArea: "Field Context"
        }
      ];
    }
    
    return questions;
  } catch (error: any) {
    console.error("Error generating quiz questions:", error.message);
    
    // Even if there's an error, return some basic questions so the UI doesn't break
    return [
      {
        question: `What is ${concept.name} used for?`,
        options: [
          concept.description.split('.')[0],
          "It has no practical applications",
          "It's purely theoretical",
          "None of the above"
        ],
        correctAnswer: 0,
        explanation: `${concept.name} is used for ${concept.description.split('.')[0]}.`,
        difficulty: "basic" as "basic" | "medium" | "advanced",
        conceptArea: "Basic Understanding"
      }
    ];
  }
}