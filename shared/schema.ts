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
  lastReviewed: timestamp("last_reviewed"),
  nextReviewDate: timestamp("next_review_date"),
  userId: integer("user_id"),
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
export type KnowledgeGraph = {
  nodes: GraphNode[];
  links: GraphLink[];
};
