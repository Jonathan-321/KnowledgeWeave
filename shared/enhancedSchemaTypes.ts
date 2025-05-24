/**
 * Type definitions for the enhanced knowledge graph components
 */

export type ConceptRelationshipType = 'prerequisite' | 'related' | 'extension' | 'application' | 'example';

export interface EnhancedGraphNode {
  id: number;
  label: string;
  type: 'concept' | 'resource';
  importance?: number;
  mastery?: number;
  color?: string;
  domainArea?: string;
  depthLevel?: number;
  resourceCount?: number;
  descriptionShort?: string;
  prerequisites?: number[];
  x?: number;
  y?: number;
}

export interface EnhancedGraphLink {
  source: number | EnhancedGraphNode;
  target: number | EnhancedGraphNode;
  type: ConceptRelationshipType;
  strength?: 'strong' | 'moderate' | 'weak';
  strengthValue?: number;
  bidirectional?: boolean;
  description?: string;
}

export interface ResourceConnection {
  conceptId: number;
  resourceId: number;
  resourceType: string;
}

export interface UserProgress {
  conceptId: number;
  mastery: number;
  knowledgeGaps: number[];
}

export interface EnhancedKnowledgeGraph {
  nodes: EnhancedGraphNode[];
  links: EnhancedGraphLink[];
  domains: string[];
  resourceConnections: ResourceConnection[];
  userProgress?: UserProgress[];
}

export interface KnowledgeGap {
  id: number;
  conceptId: number;
  topic: string;
  confidenceScore: number;
}

export interface LearningPathItem {
  concept: EnhancedGraphNode;
  prerequisites: (EnhancedGraphNode | undefined)[];
  estimatedTimeToMastery: number;
}

export interface EnhancedResource {
  id: number;
  resourceId: number;
  title: string;
  url: string;
  description: string;
  type: 'video' | 'article' | 'interactive' | 'course' | 'book';
  quality: 'high' | 'medium' | 'low';
  visualRichness: number;
  authorityScore: number;
  engagementScore: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTimeMinutes: number;
  learningStyleFit: {
    visual: number;
    auditory: number;
    reading: number;
    kinesthetic: number;
  };
  lastUpdatedAt?: Date;
  tags?: string[];
  author?: string;
  imageUrl?: string;
}
