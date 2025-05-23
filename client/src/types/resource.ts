// Resource interfaces for consistent typing across components

export interface Resource {
  id?: number;
  title: string;
  url: string;
  description: string;
  type: 'video' | 'article' | 'interactive' | 'course' | 'tutorial' | string;
  sourceAuthority: number;
  visualRichness: number;
  interactivity: number;
  qualityScore: number;
  imageUrl?: string;
  tags: string[];
  relevanceScore?: number;
  learningPathOrder?: number;
  isRequired?: boolean;
}

export interface ResourceInteraction {
  id?: number;
  userId: number;
  resourceId: number;
  interactionType: 'view' | 'complete' | 'like' | 'dislike' | 'bookmark';
  timestamp?: Date;
  timeSpent?: number;
  rating?: number;
}

export interface LearningPath {
  prerequisites?: string[];
  path: Resource[];
}
