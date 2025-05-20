import OpenAI from "openai";
import { Concept, Document } from "@shared/schema";

// Initialize OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "sk-dummy-key" });

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

/**
 * Generate quiz questions for a concept
 */
export async function generateQuizQuestions(
  concept: Concept,
  relatedDocuments: Document[] = [],
  questionCount: number = 3
): Promise<QuizQuestion[]> {
  try {
    // Extract relevant content from related documents
    let documentContent = "";
    if (relatedDocuments.length > 0) {
      documentContent = relatedDocuments
        .map(doc => doc.content)
        .join("\n\n")
        .substring(0, 2000); // Limit to a reasonable size
    }

    const prompt = `
    Create ${questionCount} multiple-choice questions about "${concept.name}" for a spaced repetition learning system.
    
    Concept Description: ${concept.description}
    
    ${documentContent ? `Additional context from related documents:\n${documentContent}` : ""}
    
    For each question:
    1. Write a clear, specific question that tests understanding of the concept
    2. Provide 4 options with one correct answer
    3. Include a brief explanation of why the correct answer is right
    
    Format your response as a JSON array with the following structure:
    [
      {
        "question": "Question text here?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": 0, // Index of the correct option (0-based)
        "explanation": "Explanation of why the correct answer is right"
      }
    ]
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: "You are an educational content expert. Create high-quality learning questions that promote understanding." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result;
  } catch (error) {
    console.error("Error generating quiz questions:", error);
    return [];
  }
}

/**
 * Schedule next review using a spaced repetition algorithm
 * Based on a simplified SuperMemo-2 algorithm
 */
export function calculateNextReview(
  lastReviewDate: Date,
  currentInterval: number,
  performance: number // 0-1 where 1 is perfect recall
): Date {
  // Easiness factor (starts at 2.5 and changes based on performance)
  const ef = Math.max(1.3, 2.5 - 0.8 * (1 - performance));
  
  // Calculate new interval
  let newInterval: number;
  
  if (currentInterval === 0) {
    newInterval = 1; // First review
  } else if (currentInterval === 1) {
    newInterval = 6; // Second review (6 days)
  } else {
    newInterval = Math.round(currentInterval * ef);
  }
  
  // Cap the interval at 365 days
  newInterval = Math.min(newInterval, 365);
  
  // If performance is very poor, reset interval
  if (performance < 0.3) {
    newInterval = 1;
  }
  
  // Calculate next review date
  const nextReviewDate = new Date(lastReviewDate);
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);
  
  return nextReviewDate;
}
