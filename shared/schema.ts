import { pgTable, text, serial, integer, boolean, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(), // 'pdf', 'article', 'note'
  content: text("content").notNull(),
  fileSize: integer("file_size"),
  pageCount: integer("page_count"),
  processed: boolean("processed").default(false),
  uploadDate: timestamp("upload_date").defaultNow(),
  userId: integer("user_id"),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadDate: true,
  processed: true,
});

export const concepts = pgTable("concepts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  tags: text("tags").array(),
  userId: integer("user_id"),
  complexity: integer("complexity").default(5), // 1-10 scale of concept difficulty
});

export const insertConceptSchema = createInsertSchema(concepts).omit({
  id: true,
});

export const conceptConnections = pgTable("concept_connections", {
  id: serial("id").primaryKey(),
  sourceId: integer("source_id").notNull(),
  targetId: integer("target_id").notNull(),
  strength: text("strength").notNull(), // 'strong', 'moderate', 'weak'
  aiGenerated: boolean("ai_generated").default(false),
  userId: integer("user_id"),
});

export const insertConceptConnectionSchema = createInsertSchema(conceptConnections).omit({
  id: true,
});

export const documentConcepts = pgTable("document_concepts", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
  conceptId: integer("concept_id").notNull(),
  pageReferences: text("page_references"),
  userId: integer("user_id"),
});

export const insertDocumentConceptSchema = createInsertSchema(documentConcepts).omit({
  id: true,
});

export const learningProgress = pgTable("learning_progress", {
  id: serial("id").primaryKey(),
  conceptId: integer("concept_id").notNull(),
  comprehension: integer("comprehension").default(0), // 0-100
  practice: integer("practice").default(0), // 0-100
  lastReviewed: timestamp("lastreviewed"),
  nextReviewDate: timestamp("nextreviewdate"),
  userId: integer("user_id"),
  // Enhanced spaced repetition fields
  interval: integer("interval").default(0), // Current interval in days
  easeFactor: integer("ease_factor").default(250), // Ease factor * 100 (stored as integer)
  reviewCount: integer("review_count").default(0), // Number of reviews completed
  totalStudyTime: integer("total_study_time").default(0), // Total study time in seconds
});

export const insertLearningProgressSchema = createInsertSchema(learningProgress).omit({
  id: true,
});

export const insights = pgTable("insights", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  isHelpful: boolean("is_helpful"),
  addedToGraph: boolean("added_to_graph").default(false),
  relatedConceptIds: integer("related_concept_ids").array(),
  userId: integer("user_id"),
});

export const insertInsightSchema = createInsertSchema(insights).omit({
  id: true,
  isHelpful: true,
  addedToGraph: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

export type InsertConcept = z.infer<typeof insertConceptSchema>;
export type Concept = typeof concepts.$inferSelect;

export type InsertConceptConnection = z.infer<typeof insertConceptConnectionSchema>;
export type ConceptConnection = typeof conceptConnections.$inferSelect;

export type InsertDocumentConcept = z.infer<typeof insertDocumentConceptSchema>;
export type DocumentConcept = typeof documentConcepts.$inferSelect;

export type InsertLearningProgress = z.infer<typeof insertLearningProgressSchema>;
export type LearningProgress = typeof learningProgress.$inferSelect;

export type InsertInsight = z.infer<typeof insertInsightSchema>;
export type Insight = typeof insights.$inferSelect;

// GraphNode type for frontend visualization
export type GraphNode = {
  id: number;
  label: string;
  type: 'concept' | 'document' | 'ai-generated';
  radius?: number;
};

// GraphLink type for frontend visualization
export type GraphLink = {
  source: number;
  target: number;
  strength: 'strong' | 'moderate' | 'weak';
};

// Knowledge Graph type combining nodes and links
export interface KnowledgeGraph {
  nodes: GraphNode[];
  links: GraphLink[];
}

// Learning resource types and categories
export const resourceTypes = [
  'article',
  'video',
  'interactive',
  'visualization',
  'course',
  'documentation',
  'tutorial',
  'tool'
] as const;

export type ResourceType = typeof resourceTypes[number];

export const resources = pgTable("learning_resources", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  description: text("description"),
  type: text("type").notNull(), // One of ResourceType
  sourceAuthority: integer("source_authority").default(50), // 0-100 score
  visualRichness: integer("visual_richness").default(50), // 0-100 score
  interactivity: integer("interactivity").default(0), // 0-100 score
  qualityScore: integer("quality_score").default(50), // 0-100 score
  imageUrl: text("image_url"),
  tags: text("tags").array(),
  dateAdded: timestamp("date_added").defaultNow(),
  lastChecked: timestamp("last_checked").defaultNow(),
  isActive: boolean("is_active").default(true),
});

export const insertResourceSchema = createInsertSchema(resources).omit({
  id: true,
  dateAdded: true,
  lastChecked: true,
});

// Connecting resources to concepts
export const conceptResources = pgTable("concept_resources", {
  id: serial("id").primaryKey(),
  conceptId: integer("concept_id").notNull(),
  resourceId: integer("resource_id").notNull(),
  relevanceScore: integer("relevance_score").default(50), // 0-100
  learningPathOrder: integer("learning_path_order"), // Optional position in learning path
  isRequired: boolean("is_required").default(false),
});

export const insertConceptResourceSchema = createInsertSchema(conceptResources).omit({
  id: true,
});

// User interaction with resources
export const resourceInteractions = pgTable("resource_interactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  resourceId: integer("resource_id").notNull(),
  interactionType: text("interaction_type").notNull(), // 'view', 'complete', 'bookmark', 'rate'
  rating: integer("rating"), // 1-5 if rated
  helpfulnessScore: integer("helpfulness_score"), // 1-100 subjective score
  timeSpent: integer("time_spent"), // seconds
  timestamp: timestamp("timestamp").defaultNow(),
  notes: text("notes"),
});

export const insertResourceInteractionSchema = createInsertSchema(resourceInteractions).omit({
  id: true,
  timestamp: true,
});

// Learning styles for users
export const learningStyles = pgTable("learning_styles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  visualScore: integer("visual_score").default(50), // 0-100
  auditoryScore: integer("auditory_score").default(50), // 0-100
  readWriteScore: integer("read_write_score").default(50), // 0-100
  kinestheticScore: integer("kinesthetic_score").default(50), // 0-100
  theoreticalScore: integer("theoretical_score").default(50), // 0-100
  practicalScore: integer("practical_score").default(50), // 0-100
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertLearningStyleSchema = createInsertSchema(learningStyles).omit({
  id: true,
  lastUpdated: true,
});

// Knowledge Graph type combining nodes and links
