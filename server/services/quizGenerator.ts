import { Concept } from "@shared/schema";
import Anthropic from '@anthropic-ai/sdk';

// Define QuizQuestion type
export type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: "basic" | "medium" | "advanced";
  conceptArea?: string;
};

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025

/**
 * Extracts JSON from Claude's response
 */
function extractJsonFromResponse(response: any): any {
  try {
    // Get content text from response
    const firstContent = response.content[0];
    if (!firstContent || !('text' in firstContent)) {
      return null;
    }
    
    const text = firstContent.text;
    
    // First try to extract JSON array pattern that matches arrays of objects
    const jsonPattern = /\[\s*\{[^]*\}\s*\]/;
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
 * Generates quiz questions for a concept with adjustable difficulty
 */
export async function generateQuizQuestions(concept: Concept, difficulty: "basic" | "medium" | "advanced" = 'medium'): Promise<QuizQuestion[]> {
  try {
    const systemPrompt = `
      You are an educational content creator specializing in creating quiz questions.
      Generate 5 multiple-choice questions about the concept: "${concept.name}".
      
      Guidelines:
      - The difficulty level should be ${difficulty}
      - Each question should have 4 options with only one correct answer
      - Include explanations for the correct answers
      - Return the response in JSON format with this structure:
      [
        {
          "question": "Question text here?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": 0, // Index of the correct option (0-based)
          "explanation": "Explanation of why this answer is correct",
          "difficulty": "${difficulty}",
          "conceptArea": "The specific area of the concept being tested"
        },
        // more questions...
      ]
      
      Additional context for the concept:
      ${concept.description}
      Tags: ${concept.tags?.join(', ')}
    `;

    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [
        { role: 'user', content: `Generate quiz questions for: ${concept.name}` }
      ],
    });

    // Extract JSON from the response
    const questions = extractJsonFromResponse(response);
    
    if (questions && Array.isArray(questions) && questions.length > 0) {
      return questions.map(q => ({
        ...q,
        difficulty: q.difficulty || difficulty
      }));
    }
    
    // Fallback questions if JSON parsing fails
    return [
      {
        question: `What is the primary purpose of ${concept.name}?`,
        options: [
          "To create computational models inspired by the brain",
          "To store data in a structured format",
          "To manage database connections",
          "To optimize algorithms"
        ],
        correctAnswer: 0,
        explanation: `${concept.name} is primarily about modeling computational systems inspired by biological neural structures.`,
        difficulty
      },
      {
        question: `Which field is most closely associated with ${concept.name}?`,
        options: [
          "Machine Learning",
          "Database Management",
          "Web Development", 
          "Networking"
        ],
        correctAnswer: 0,
        explanation: `${concept.name} is a core component of modern machine learning approaches.`,
        difficulty
      }
    ];
  } catch (error) {
    console.error("Error generating quiz questions:", error);
    // Return some fallback questions if there's an error
    return [
      {
        question: `What is ${concept.name} used for?`,
        options: [
          "Creating computational models",
          "Storing data",
          "Network management",
          "Software development"
        ],
        correctAnswer: 0,
        explanation: `${concept.name} is used for creating computational models based on known principles in this field.`,
        difficulty
      },
      {
        question: `Which of these is related to ${concept.name}?`,
        options: [
          "Pattern recognition",
          "Operating systems",
          "Browser technology",
          "Office software"
        ],
        correctAnswer: 0,
        explanation: "Pattern recognition is a common application in this field.",
        difficulty
      }
    ];
  }
}