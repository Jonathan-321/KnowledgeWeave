/**
 * Enhanced Spaced Repetition System
 * 
 * This implements the SuperMemo-2 algorithm with adaptations based on learning patterns.
 * The algorithm adjusts intervals based on:
 * 1. User performance (rating of recall quality)
 * 2. Content complexity
 * 3. Previous learning patterns
 * 4. Concept relationships in the knowledge graph
 */

import { storage } from "../storage";
import { Concept, LearningProgress, InsertLearningProgress } from "@shared/schema";

// Define QuizQuestion interface for use in anthropic.ts
export interface QuizQuestion {
  question: string;
  options?: string[];
  correctAnswer: number | string;
  explanation: string;
  difficulty: "basic" | "medium" | "advanced";
  conceptArea?: string;
  type?: "multiple_choice" | "true_false" | "short_answer";
}

// Quality of recall ratings (1-5)
// 1: Complete blackout - complete failure to recall
// 2: Incorrect response - wrong answer but upon seeing correct answer, it felt familiar
// 3: Correct response after hesitation
// 4: Correct response with difficulty - recall took effort
// 5: Perfect recall - correct response with no difficulty

// SuperMemo-2 algorithm parameters
const DEFAULT_EASE_FACTOR = 2.5;
const MIN_EASE_FACTOR = 1.3;
const EASE_BONUS = 0.1;
const EASE_PENALTY = 0.2;

// Additional parameters for our enhanced algorithm
const COMPLEXITY_WEIGHT = 0.2; // How much concept complexity affects intervals
const RELATIONSHIP_BOOST = 0.15; // Boost for related concepts already learned

interface SpacedRepetitionData {
  conceptId: number;
  quality: number; // 1-5 rating
  previousInterval?: number; // Previous interval in days
  previousEaseFactor?: number; // Previous ease factor
  complexity?: number; // 1-10 rating of concept complexity
}

/**
 * Calculate the next review interval and ease factor based on learning performance
 */
export async function calculateNextReview(data: SpacedRepetitionData): Promise<{
  nextReviewDate: Date;
  interval: number;
  easeFactor: number;
}> {
  // Retrieve current learning progress if it exists
  const currentProgress = await storage.getLearningProgressByConceptId(data.conceptId);
  
  // Get concept to check complexity
  const concept = await storage.getConcept(data.conceptId);
  if (!concept) {
    throw new Error("Concept not found");
  }
  
  // Default values if not provided
  const quality = data.quality;
  const previousInterval = data.previousInterval || currentProgress?.interval || 0;
  const previousEaseFactor = data.previousEaseFactor || currentProgress?.easeFactor || DEFAULT_EASE_FACTOR;
  // Default to medium complexity (5) if not provided
  const complexity = data.complexity || concept.complexity || 5;
  
  // Normalize complexity to a factor between 0.8 and 1.2
  const complexityFactor = 1 + COMPLEXITY_WEIGHT * ((complexity - 5) / 10);
  
  // Calculate relationship boost based on related concepts' progress
  const relationshipBoost = await calculateRelationshipBoost(data.conceptId);
  
  // Calculate new ease factor based on quality of recall
  let newEaseFactor = previousEaseFactor;
  if (quality >= 3) {
    // Correct recall (quality 3-5) - increase ease factor
    newEaseFactor += EASE_BONUS * (quality - 3);
  } else {
    // Failed recall (quality 1-2) - decrease ease factor
    newEaseFactor -= EASE_PENALTY;
  }
  
  // Ensure ease factor doesn't go below minimum
  newEaseFactor = Math.max(MIN_EASE_FACTOR, newEaseFactor);
  
  // Calculate new interval
  let newInterval;
  if (quality < 3) {
    // If recall quality is poor, reset interval to 1 day
    newInterval = 1;
  } else if (previousInterval === 0) {
    // First successful review
    newInterval = 1;
  } else if (previousInterval === 1) {
    // Second successful review
    newInterval = 6;
  } else {
    // Calculate new interval based on previous interval, ease factor, complexity and relationships
    newInterval = Math.round(
      previousInterval * 
      newEaseFactor * 
      complexityFactor * 
      (1 + relationshipBoost)
    );
  }
  
  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);
  
  return {
    nextReviewDate,
    interval: newInterval,
    easeFactor: newEaseFactor
  };
}

/**
 * Calculate a boost factor based on the user's progress with related concepts
 */
async function calculateRelationshipBoost(conceptId: number): Promise<number> {
  // Get all concept connections where this concept is the source or target
  const allConnections = await storage.getAllConceptConnections();
  
  const relatedConceptIds: number[] = [];
  
  // Find all directly connected concepts
  allConnections.forEach(connection => {
    if (connection.sourceId === conceptId) {
      relatedConceptIds.push(connection.targetId);
    } else if (connection.targetId === conceptId) {
      relatedConceptIds.push(connection.sourceId);
    }
  });
  
  if (relatedConceptIds.length === 0) {
    return 0; // No related concepts to boost from
  }
  
  // Get learning progress for all related concepts
  const allProgress = await storage.getAllLearningProgress();
  const relatedProgress = allProgress.filter(
    progress => relatedConceptIds.includes(progress.conceptId)
  );
  
  if (relatedProgress.length === 0) {
    return 0; // No learning progress on related concepts
  }
  
  // Calculate average comprehension of related concepts
  // Handle null values with nullish coalescing
  const avgComprehension = relatedProgress.reduce(
    (sum, progress) => sum + (progress.comprehension ?? 0),
    0
  ) / relatedProgress.length;
  
  // Convert to a boost factor (max boost of RELATIONSHIP_BOOST)
  return (avgComprehension / 100) * RELATIONSHIP_BOOST;
}

/**
 * Update learning progress with new spaced repetition data
 */
export async function updateLearningProgress(
  conceptId: number, 
  quality: number, 
  duration: number
): Promise<LearningProgress> {
  // Get the current progress if it exists
  let currentProgress = await storage.getLearningProgressByConceptId(conceptId);
  
  // Get the concept
  const concept = await storage.getConcept(conceptId);
  if (!concept) {
    throw new Error("Concept not found");
  }
  
  // Calculate practice and comprehension scores based on quality and duration
  const practiceScore = calculatePracticeScore(quality, duration);
  
  // Calculate new comprehension score - factor in previous score if it exists
  let comprehensionScore;
  if (currentProgress && currentProgress.comprehension !== null) {
    // Weight previous score and new quality
    comprehensionScore = Math.round(
      currentProgress.comprehension * 0.7 + (quality * 20) * 0.3
    );
  } else {
    // First time - base on quality only
    comprehensionScore = quality * 20; // Scale 1-5 to 20-100
  }
  
  // Ensure scores are within bounds
  comprehensionScore = Math.max(0, Math.min(100, comprehensionScore));
  
  // Calculate next review data
  const spacedRepetitionData: SpacedRepetitionData = {
    conceptId,
    quality,
    previousInterval: currentProgress?.interval,
    previousEaseFactor: currentProgress?.easeFactor,
    complexity: concept.complexity
  };
  
  const { nextReviewDate, interval, easeFactor } = await calculateNextReview(spacedRepetitionData);
  
  // Handle review count and study time safely
  const reviewCount = (currentProgress?.reviewCount || 0) + 1;
  const totalStudyTime = (currentProgress?.totalStudyTime || 0) + duration;
  
  // Prepare the learning progress data
  const progressData: Partial<LearningProgress> = {
    conceptId,
    comprehension: comprehensionScore,
    practice: practiceScore,
    lastReviewed: new Date(),
    nextReviewDate,
    reviewCount,
    totalStudyTime,
    interval,
    easeFactor
  };
  
  // Update or create the learning progress
  if (currentProgress) {
    return await storage.updateLearningProgress(currentProgress.id, progressData);
  } else {
    return await storage.createLearningProgress(progressData as InsertLearningProgress);
  }
}

/**
 * Calculate practice score based on quality and duration
 */
function calculatePracticeScore(quality: number, duration: number): number {
  // Base score from quality
  let score = quality * 10; // 10-50 points
  
  // Bonus for time spent (capped at 20 extra points)
  // Each minute adds 5 points, up to 4 minutes
  const timeBonus = Math.min(20, Math.floor(duration / 60) * 5);
  
  // Combine scores and ensure within bounds
  return Math.max(0, Math.min(100, score + timeBonus));
}

/**
 * Generate quiz questions for spaced repetition based on concept
 */
export async function generateQuizQuestions(conceptId: number, count: number = 5): Promise<any[]> {
  // This function would integrate with anthropic.ts to generate adaptive quiz questions
  // Implement stub for now - to be expanded with Anthropic API integration
  const concept = await storage.getConcept(conceptId);
  if (!concept) {
    throw new Error("Concept not found");
  }
  
  // For now return placeholder data - will be replaced with actual API call
  return [
    {
      question: `What is the primary function of ${concept.name}?`,
      type: "open_ended"
    },
    {
      question: `Explain a key application of ${concept.name}.`,
      type: "open_ended"
    },
    {
      question: `How does ${concept.name} relate to other concepts in the knowledge graph?`,
      type: "open_ended"
    }
  ];
}

/**
 * Generate recommended learning schedule based on current progress
 */
export async function generateLearningSchedule(userId: number): Promise<any[]> {
  // Get all learning progress for user
  const allProgress = await storage.getAllLearningProgress();
  
  // Get concepts
  const concepts = await storage.getAllConcepts();
  
  // Calculate learning schedule
  const schedule = [];
  
  for (const concept of concepts) {
    const progress = allProgress.find(p => p.conceptId === concept.id);
    
    if (!progress) {
      // Not started learning yet - high priority
      schedule.push({
        conceptId: concept.id,
        conceptName: concept.name,
        priority: "high",
        recommended: true,
        reviewDate: new Date(), // Recommend starting today
        status: "not_started"
      });
    } else if (progress.nextReviewDate && progress.nextReviewDate <= new Date()) {
      // Due for review
      schedule.push({
        conceptId: concept.id,
        conceptName: concept.name,
        priority: "high",
        recommended: true,
        reviewDate: progress.nextReviewDate,
        status: "due",
        progress: {
          comprehension: progress.comprehension,
          practice: progress.practice
        }
      });
    } else {
      // Scheduled for future review
      schedule.push({
        conceptId: concept.id,
        conceptName: concept.name,
        priority: "normal",
        recommended: false,
        reviewDate: progress.nextReviewDate,
        status: "scheduled",
        progress: {
          comprehension: progress.comprehension,
          practice: progress.practice
        }
      });
    }
  }
  
  // Sort by priority and review date
  return schedule.sort((a, b) => {
    if (a.priority === "high" && b.priority !== "high") return -1;
    if (a.priority !== "high" && b.priority === "high") return 1;
    
    // Handle possible null dates
    const dateA = a.reviewDate ? new Date(a.reviewDate).getTime() : Date.now();
    const dateB = b.reviewDate ? new Date(b.reviewDate).getTime() : Date.now();
    
    return dateA - dateB;
  });
}