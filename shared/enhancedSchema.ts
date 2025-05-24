import { pgTable, text, serial, integer, boolean, json, timestamp, real, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export existing base tables
export * from "./schema";
import * as baseSchema from "./schema";

// Export enhanced schema types
export * from "./enhancedSchemaTypes";

// Resource quality enum for better type safety
export type ResourceQuality = 'high' | 'medium' | 'low';

// Learning style match enum
export type LearningStyleMatch = 'excellent' | 'good' | 'fair' | 'poor';

// Relationship types between concepts
export type ConceptRelationshipType = 'prerequisite' | 'related' | 'extension' | 'application' | 'example';

// Difficulty levels
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

// Enhanced concept table with more metadata
export const enhancedConcepts = pgTable("enhanced_concepts", {
  id: serial("id").primaryKey(),
  conceptId: integer("concept_id").notNull().references(() => baseSchema.concepts.id), // Reference to base concept
  importance: integer("importance").default(5), // 1-10 scale of concept importance in the knowledge domain
  masteryDifficulty: integer("mastery_difficulty").default(5), // 1-10 scale of how difficult the concept is to master
  estimatedLearningTimeMinutes: integer("estimated_learning_time").default(30), // Estimated time to learn basics
  visualizationSize: real("visualization_size").default(1.0), // Relative size in visualization (0.5-2.0)
  visualizationColor: text("visualization_color"), // Hex color for visualization
  domainArea: text("domain_area"), // E.g., "mathematics", "computer science"
  prerequisiteIds: integer("prerequisite_ids").array(), // Concepts that should be learned first
  applicationIds: integer("application_ids").array(), // Concepts where this one is applied
  keywords: text("keywords").array(), // Related keywords and terms
  popularityScore: integer("popularity_score").default(50), // How popular/common the concept is (0-100)
  depthLevel: integer("depth_level").default(1), // How deep in the knowledge hierarchy (1 = fundamental, higher = more specialized)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEnhancedConceptSchema = createInsertSchema(enhancedConcepts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Enhanced concept relationships with more metadata
export const enhancedConceptRelationships = pgTable("enhanced_concept_relationships", {
  id: serial("id").primaryKey(),
  sourceId: integer("source_id").notNull(), // From concept
  targetId: integer("target_id").notNull(), // To concept
  relationshipType: text("relationship_type").notNull(), // Type of relationship (prerequisite, related, etc.)
  strength: integer("strength").default(50), // 0-100 scale of relationship strength
  description: text("description"), // Human-readable description of the relationship
  bidirectional: boolean("bidirectional").default(false), // Whether the relationship goes both ways
  confidence: integer("confidence").default(100), // AI confidence in this relationship (0-100)
  createdBy: text("created_by").default("system"), // "user", "system", "ai"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEnhancedConceptRelationshipSchema = createInsertSchema(enhancedConceptRelationships).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Enhanced resources with more detailed metadata
export const enhancedResources = pgTable("enhanced_resources", {
  id: serial("id").primaryKey(),
  resourceId: integer("resource_id").notNull().references(() => baseSchema.resources.id), // Reference to base resource
  title: text("title").notNull(),
  url: text("url").notNull(),
  description: text("description"),
  type: text("type").notNull(), // One of ResourceType
  
  // Content quality metrics
  quality: text("quality").default("medium"), // 'high', 'medium', 'low'
  visualRichness: integer("visual_richness").default(50), // 0-100 how visually rich the content is
  interactivityLevel: integer("interactivity_level").default(0), // 0-100 how interactive
  engagementScore: integer("engagement_score").default(50), // 0-100 how engaging
  authorityScore: integer("authority_score").default(50), // 0-100 credibility of the source
  accuracyScore: integer("accuracy_score").default(50), // 0-100 factual accuracy
  completenessScore: integer("completeness_score").default(50), // 0-100 completeness of coverage
  freshnessScore: integer("freshness_score").default(50), // 0-100 how recent/up-to-date
  
  // Learning metrics
  difficultyLevel: text("difficulty_level").default("beginner"), // beginner, intermediate, advanced, expert
  prerequisiteResourceIds: integer("prerequisite_resource_ids").array(), // Resources to consume first
  estimatedTimeMinutes: integer("estimated_time_minutes").default(15), // Time to complete
  readabilityScore: integer("readability_score").default(50), // 0-100 how easy to read/follow
  
  // Learning style fit
  visualLearningFit: integer("visual_learning_fit").default(50), // 0-100 fit for visual learners
  auditoryLearningFit: integer("auditory_learning_fit").default(50), // 0-100 fit for auditory learners
  readingLearningFit: integer("reading_learning_fit").default(50), // 0-100 fit for reading/writing learners
  kinestheticLearningFit: integer("kinesthetic_learning_fit").default(50), // 0-100 fit for kinesthetic learners
  
  // Discovery metadata
  source: text("source"), // Where this resource was found
  imageUrl: text("image_url"), // Preview image
  author: text("author"), // Content author
  publicationDate: timestamp("publication_date"), // When content was published
  tags: text("tags").array(), // Topic tags
  language: text("language").default("en"), // Content language
  
  // System metadata
  dateAdded: timestamp("date_added").defaultNow(),
  lastChecked: timestamp("last_checked").defaultNow(),
  isActive: boolean("is_active").default(true),
  averageRating: real("average_rating").default(0), // 0-5 average user rating
  viewCount: integer("view_count").default(0), // How many views
  completionCount: integer("completion_count").default(0), // How many completions
  lastModified: timestamp("last_modified").defaultNow(),
});

export const insertEnhancedResourceSchema = createInsertSchema(enhancedResources).omit({
  id: true,
  dateAdded: true,
  lastChecked: true,
  lastModified: true,
});

// Enhanced concept-resource connections with learning path information
export const enhancedConceptResources = pgTable("enhanced_concept_resources", {
  id: serial("id").primaryKey(),
  conceptId: integer("concept_id").notNull(),
  resourceId: integer("resource_id").notNull(),
  relevanceScore: integer("relevance_score").default(70), // 0-100 how relevant
  importanceForConcept: integer("importance_for_concept").default(5), // 1-10 importance
  learningPathOrder: integer("learning_path_order"), // Position in optimal learning sequence
  isCoreMaterial: boolean("is_core_material").default(false), // Essential for understanding
  isSupplementary: boolean("is_supplementary").default(false), // Extra/advanced material
  notes: text("notes"), // Curator notes
  coveragePercentage: integer("coverage_percentage").default(100), // % of concept covered by resource
  targetAudience: text("target_audience").array(), // Who this is best for
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  
  // Composite primary key to prevent duplicates
  primaryKey: primaryKey({ columns: ["conceptId", "resourceId"] })
});

export const insertEnhancedConceptResourceSchema = createInsertSchema(enhancedConceptResources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Learning paths with sequencing information
export const learningPaths = pgTable("learning_paths", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"), // If personalized, otherwise null for shared paths
  name: text("name").notNull(),
  description: text("description"),
  difficultyLevel: text("difficulty_level").default("beginner"),
  estimatedTotalTimeMinutes: integer("estimated_total_time").default(0),
  conceptIds: integer("concept_ids").array().notNull(), // Ordered array of concept IDs
  resourceIds: integer("resource_ids").array().notNull(), // Ordered array of resource IDs
  prerequisites: text("prerequisites"), // Describes what user should know first
  isPublic: boolean("is_public").default(false), // Whether visible to other users
  creatorId: integer("creator_id"), // User who created this path
  isSystemGenerated: boolean("is_system_generated").default(false),
  tags: text("tags").array(),
  averageRating: real("average_rating").default(0), // Average rating from users
  completionCount: integer("completion_count").default(0), // Times completed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLearningPathSchema = createInsertSchema(learningPaths).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Learning path items with detailed metadata
export const learningPathItems = pgTable("learning_path_items", {
  id: serial("id").primaryKey(),
  pathId: integer("path_id").notNull(),
  sequenceNumber: integer("sequence_number").notNull(), // Order in path
  itemType: text("item_type").notNull(), // 'concept', 'resource', 'quiz', 'activity'
  conceptId: integer("concept_id"), // If concept-focused
  resourceId: integer("resource_id"), // If resource-focused
  name: text("name").notNull(),
  description: text("description"),
  estimatedTimeMinutes: integer("estimated_time_minutes").default(15),
  isCheckpoint: boolean("is_checkpoint").default(false), // User should test knowledge here
  isOptional: boolean("is_optional").default(false),
  completionCriteria: text("completion_criteria"), // What constitutes completion
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLearningPathItemSchema = createInsertSchema(learningPathItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// User progress on learning paths
export const learningPathProgress = pgTable("learning_path_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  pathId: integer("path_id").notNull(),
  currentItemId: integer("current_item_id"), // Current position
  percentComplete: integer("percent_complete").default(0),
  lastItemCompletedId: integer("last_item_completed_id"),
  completedItemIds: integer("completed_item_ids").array(), // Items completed
  startedAt: timestamp("started_at").defaultNow(),
  lastActivityAt: timestamp("last_activity_at").defaultNow(),
  completedAt: timestamp("completed_at"), // If finished
  // User-specific timing data to personalize estimates
  averageCompletionTimePerItem: integer("average_completion_time").default(0), // Average minutes per item
  totalTimeSpentMinutes: integer("total_time_spent").default(0),
});

export const insertLearningPathProgressSchema = createInsertSchema(learningPathProgress).omit({
  id: true,
  startedAt: true,
  lastActivityAt: true,
  completedAt: true,
});

// Knowledge gap tracking
export const knowledgeGaps = pgTable("knowledge_gaps", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  conceptId: integer("concept_id").notNull(),
  confidenceScore: integer("confidence_score").default(0), // 0-100 user confidence
  identifiedAt: timestamp("identified_at").defaultNow(),
  source: text("source").notNull(), // 'quiz', 'self-assessment', 'system'
  quizItemId: integer("quiz_item_id"), // Quiz question that revealed the gap
  status: text("status").default("active"), // 'active', 'addressed', 'resolved'
  recommendedResourceIds: integer("recommended_resource_ids").array(), // Resources to address gap
  lastReviewedAt: timestamp("last_reviewed_at"),
  resolved: boolean("resolved").default(false),
  resolutionNotes: text("resolution_notes"),
  priorityScore: integer("priority_score").default(50), // 0-100 importance to address
});

export const insertKnowledgeGapSchema = createInsertSchema(knowledgeGaps).omit({
  id: true,
  identifiedAt: true,
  lastReviewedAt: true,
});

// User study sessions
export const studySessions = pgTable("study_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  durationMinutes: integer("duration_minutes"),
  conceptIds: integer("concept_ids").array(), // Concepts studied
  resourceIds: integer("resource_ids").array(), // Resources used
  pathId: integer("path_id"), // If part of a learning path
  learningGoals: text("learning_goals"),
  outcomes: text("outcomes"),
  productivityScore: integer("productivity_score"), // 1-10 self-assessment
  focusLevel: integer("focus_level"), // 1-10 self-assessment
  notes: text("notes"),
  location: text("location"), // Where user studied
  device: text("device"), // Device used
  environmentalFactors: text("environmental_factors"), // Noise, etc.
});

export const insertStudySessionSchema = createInsertSchema(studySessions).omit({
  id: true,
  endTime: true,
  durationMinutes: true,
});

// Enhanced visualization settings for the knowledge graph
export const visualizationSettings = pgTable("visualization_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  nodeSize: text("node_size").default("importance"), // What determines node size: 'importance', 'mastery', etc.
  nodeColor: text("node_color").default("domain"), // What determines node color: 'domain', 'mastery', etc.
  edgeThickness: text("edge_thickness").default("strength"), // What determines edge thickness
  layout: text("layout").default("force"), // 'force', 'hierarchical', 'radial'
  showLabels: boolean("show_labels").default(true),
  groupingEnabled: boolean("grouping_enabled").default(true),
  filterLevel: integer("filter_level").default(0), // 0-10 how much to filter low-importance items
  highlightRelated: boolean("highlight_related").default(true), // Highlight related nodes on selection
  showResourcePreviews: boolean("show_resource_previews").default(true),
  animationSpeed: integer("animation_speed").default(5), // 1-10
  interactionMode: text("interaction_mode").default("default"), // 'default', 'explore', 'learn'
  customColorPalette: text("custom_color_palette").array(),
  lastModified: timestamp("last_modified").defaultNow(),
});

export const insertVisualizationSettingsSchema = createInsertSchema(visualizationSettings).omit({
  id: true,
  lastModified: true,
});

// Resource discovery sources configuration
export const resourceDiscoverySources = pgTable("resource_discovery_sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  type: text("type").notNull(), // 'search', 'api', 'academic'
  baseUrl: text("base_url").notNull(),
  enabled: boolean("enabled").default(true),
  priority: integer("priority").default(5), // 1-10 search priority
  apiKey: text("api_key"), // If requires API key
  queryParams: json("query_params"), // Default query parameters
  resultSelector: text("result_selector"), // CSS selector for results if scraping
  qualityIndicators: text("quality_indicators").array(), // Indicators of quality
  contentTypes: text("content_types").array(), // Types of content provided
  rateLimitPerMinute: integer("rate_limit_per_minute"), // API rate limit
  lastSuccessfulUse: timestamp("last_successful_use"),
  successRate: integer("success_rate").default(100), // 0-100 % success
  averageResultQuality: integer("average_result_quality").default(70), // 0-100 quality
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertResourceDiscoverySourceSchema = createInsertSchema(resourceDiscoverySources).omit({
  id: true,
  lastSuccessfulUse: true,
  createdAt: true,
  updatedAt: true,
});

// Resource discovery logs
export const resourceDiscoveryLogs = pgTable("resource_discovery_logs", {
  id: serial("id").primaryKey(),
  sourceId: integer("source_id").notNull(),
  conceptId: integer("concept_id").notNull(),
  query: text("query").notNull(),
  resultCount: integer("result_count").default(0),
  successfulCount: integer("successful_count").default(0),
  failedCount: integer("failed_count").default(0),
  timestamp: timestamp("timestamp").defaultNow(),
  duration: integer("duration"), // Milliseconds
  error: text("error"),
  status: text("status").default("completed"), // 'running', 'completed', 'failed'
});

export const insertResourceDiscoveryLogSchema = createInsertSchema(resourceDiscoveryLogs).omit({
  id: true,
  timestamp: true,
});

// Types for the enhanced schema
export type EnhancedConcept = typeof enhancedConcepts.$inferSelect;
export type InsertEnhancedConcept = z.infer<typeof insertEnhancedConceptSchema>;

export type EnhancedConceptRelationship = typeof enhancedConceptRelationships.$inferSelect;
export type InsertEnhancedConceptRelationship = z.infer<typeof insertEnhancedConceptRelationshipSchema>;

export type EnhancedResource = typeof enhancedResources.$inferSelect;
export type InsertEnhancedResource = z.infer<typeof insertEnhancedResourceSchema>;

export type EnhancedConceptResource = typeof enhancedConceptResources.$inferSelect;
export type InsertEnhancedConceptResource = z.infer<typeof insertEnhancedConceptResourceSchema>;

export type LearningPath = typeof learningPaths.$inferSelect;
export type InsertLearningPath = z.infer<typeof insertLearningPathSchema>;

export type LearningPathItem = typeof learningPathItems.$inferSelect;
export type InsertLearningPathItem = z.infer<typeof insertLearningPathItemSchema>;

export type LearningPathProgress = typeof learningPathProgress.$inferSelect;
export type InsertLearningPathProgress = z.infer<typeof insertLearningPathProgressSchema>;

export type KnowledgeGap = typeof knowledgeGaps.$inferSelect;
export type InsertKnowledgeGap = z.infer<typeof insertKnowledgeGapSchema>;

export type StudySession = typeof studySessions.$inferSelect;
export type InsertStudySession = z.infer<typeof insertStudySessionSchema>;

export type VisualizationSetting = typeof visualizationSettings.$inferSelect;
export type InsertVisualizationSetting = z.infer<typeof insertVisualizationSettingsSchema>;

export type ResourceDiscoverySource = typeof resourceDiscoverySources.$inferSelect;
export type InsertResourceDiscoverySource = z.infer<typeof insertResourceDiscoverySourceSchema>;

export type ResourceDiscoveryLog = typeof resourceDiscoveryLogs.$inferSelect;
export type InsertResourceDiscoveryLog = z.infer<typeof insertResourceDiscoveryLogSchema>;

// Enhanced Knowledge Graph types for visualization
export interface EnhancedGraphNode extends baseSchema.GraphNode {
  importance: number; // 1-10 scale for node sizing
  mastery?: number; // 0-100 user's mastery level
  color?: string; // Node color for domain grouping
  domainArea?: string; // Knowledge domain
  depthLevel: number; // How fundamental vs specialized
  resourceCount?: number; // Number of associated resources
  prerequisites?: number[]; // IDs of prerequisite concepts
  image?: string; // Visual representation
  descriptionShort?: string; // Brief description for tooltips
}

export interface EnhancedGraphLink extends baseSchema.GraphLink {
  type: ConceptRelationshipType; // Relationship type
  strengthValue: number; // 0-100 strength value
  bidirectional: boolean; // Whether relationship goes both ways
  description?: string; // Description of relationship
}

export interface EnhancedKnowledgeGraph extends baseSchema.KnowledgeGraph {
  nodes: EnhancedGraphNode[];
  links: EnhancedGraphLink[];
  domains: string[]; // List of knowledge domains present
  resourceConnections?: Array<{
    conceptId: number;
    resourceId: number;
    resourceType: string;
  }>;
  userProgress?: {
    conceptId: number;
    mastery: number;
    knowledgeGaps: number[];
  }[];
}
