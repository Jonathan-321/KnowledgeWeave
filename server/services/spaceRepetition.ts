import { Concept } from "@shared/schema";
import { extractConcepts, generateQuizQuestions as generateAnthropicQuizQuestions } from "./anthropic";

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
  relatedDocuments: any[] = [],
  questionCount: number = 3
): Promise<QuizQuestion[]> {
  return generateAnthropicQuizQuestions(concept, relatedDocuments, questionCount);
}

/**
 * Calculate next review date using a spaced repetition algorithm
 * Based on the SuperMemo-2 algorithm
 */
export function calculateNextReview(
  lastReviewDate: Date,
  currentIntervalDays: number,
  performanceRating: number, // 0-5 scale where 5 is perfect recall
  previousEaseFactor: number = 2.5
): Date {
  // The maximum performance rating is 5
  const normalizedRating = Math.min(Math.max(performanceRating, 0), 5);
  
  // Calculate the ease factor (EF) based on performance
  // The formula adjusts the ease factor based on how well the user remembered the item
  let newEaseFactor = previousEaseFactor + (0.1 - (5 - normalizedRating) * (0.08 + (5 - normalizedRating) * 0.02));
  
  // EF should be at least 1.3
  newEaseFactor = Math.max(newEaseFactor, 1.3);
  
  // Calculate the new interval
  let newIntervalDays: number;
  
  if (normalizedRating < 3) {
    // If performance was poor, start over with a short interval (1 day)
    newIntervalDays = 1;
  } else {
    // Calculate the next interval based on the current interval and ease factor
    if (currentIntervalDays === 0) {
      // First review
      newIntervalDays = 1;
    } else if (currentIntervalDays === 1) {
      // Second review
      newIntervalDays = 6;
    } else {
      // Subsequent reviews
      newIntervalDays = Math.round(currentIntervalDays * newEaseFactor);
    }
  }
  
  // Calculate the next review date
  const nextReviewDate = new Date(lastReviewDate);
  nextReviewDate.setDate(nextReviewDate.getDate() + newIntervalDays);
  
  return nextReviewDate;
}

/**
 * Convert comprehension and practice scores to a performance rating
 * Used as input for the spaced repetition algorithm
 */
export function calculatePerformanceRating(comprehension: number, practice: number): number {
  // Weight comprehension and practice scores
  // Comprehension has 60% weight, practice has 40% weight
  const weightedScore = (comprehension * 0.6) + (practice * 0.4);
  
  // Convert to 0-5 scale (from 0-100 scale)
  return (weightedScore / 100) * 5;
}

/**
 * Determine if a concept is due for review
 */
export function isDueForReview(nextReviewDate: Date | null): boolean {
  if (!nextReviewDate) return true;
  
  const now = new Date();
  return nextReviewDate <= now;
}

/**
 * Get concepts due for review for a user
 */
export function getConceptsDueForReview(
  concepts: Concept[],
  learningProgress: any[]
): Concept[] {
  return concepts.filter(concept => {
    const progress = learningProgress.find(p => p.conceptId === concept.id);
    
    if (!progress) return true; // No progress recorded yet, so it's due
    
    return isDueForReview(progress.nextReviewDate);
  });
}

/**
 * Suggest optimal learning path based on concept relationships and review status
 */
export function suggestLearningPath(
  concepts: Concept[],
  conceptConnections: any[],
  learningProgress: any[]
): Concept[] {
  // Get concepts that are due for review
  const dueForReview = getConceptsDueForReview(concepts, learningProgress);
  
  // For concepts not due for review, calculate their dependency level
  const notDue = concepts.filter(concept => !dueForReview.includes(concept));
  
  // Analyze the concept graph to find dependency relationships
  const dependencyMap = new Map<number, number>();
  
  for (const concept of notDue) {
    // Count how many other concepts depend on this one
    const dependencies = conceptConnections.filter(conn => 
      conn.targetId === concept.id && conn.strength === 'strong'
    ).length;
    
    dependencyMap.set(concept.id, dependencies);
  }
  
  // Sort concepts by dependency level (most fundamental first)
  const sortedByDependency = [...notDue].sort((a, b) => 
    (dependencyMap.get(b.id) || 0) - (dependencyMap.get(a.id) || 0)
  );
  
  // Combine due concepts with dependency-sorted concepts
  return [...dueForReview, ...sortedByDependency];
}