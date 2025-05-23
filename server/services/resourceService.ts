/**
 * Resource Service
 * 
 * Handles resource discovery, management, and user interaction tracking
 */

import { storage } from '../storage';
import { ResourceType, LearningStyle } from '@shared/schema';
import axios from 'axios';
import { 
  discoverResourcesForConcept as scrapeResourcesForConcept, 
  analyzeResourceUrl as scrapeResourceUrl, 
  searchResources, 
  rankResources,
  DiscoveredResource
} from '../utils/resourceScraper';

interface ResourceCreationParams {
  title: string;
  url: string;
  description: string;
  type: ResourceType;
  sourceAuthority: number;
  visualRichness: number;
  interactivity: number;
  qualityScore?: number;
  imageUrl?: string;
  tags: string[];
}

interface ResourceUpdateParams {
  id: number;
  title?: string;
  description?: string;
  sourceAuthority?: number;
  visualRichness?: number;
  interactivity?: number;
  qualityScore?: number;
  imageUrl?: string;
  tags?: string[];
}

interface ResourceInteractionParams {
  userId: number;
  resourceId: number;
  interactionType: 'view' | 'complete' | 'save' | 'share';
  rating?: number;
  timeSpentSeconds?: number;
  feedback?: string;
}

class ResourceService {
  /**
   * Get resources for a specific concept
   */
  async getResourcesForConcept(conceptId: number) {
    return storage.getResourcesByConceptId(conceptId);
  }

  /**
   * Discover resources for a concept based on name/description
   */
  async discoverResourcesForConcept(conceptId: number, limit = 5) {
    const concept = await storage.getConcept(conceptId);
    
    if (!concept) {
      throw new Error(`Concept with ID ${conceptId} not found`);
    }
    
    try {
      // Use the resource scraper to find resources
      const discoveredResources = await scrapeResourcesForConcept(concept.name, limit);
      
      // Store discovered resources in database
      const savedResources = [];
      
      for (const resource of discoveredResources) {
        // Check if resource with this URL already exists
        const existingResources = await storage.getResourcesByUrl(resource.url);
        
        if (existingResources && existingResources.length > 0) {
          const existingResource = existingResources[0];
          
          // Connect existing resource to this concept if not already connected
          const conceptResources = await storage.getConceptResourcesByResourceId(existingResource.id);
          const isConnected = conceptResources.some(cr => cr.conceptId === conceptId);
          
          if (!isConnected) {
            await this.connectResourceToConcept(existingResource.id, conceptId, 85);
          }
          
          savedResources.push(existingResource);
        } else {
          // Create new resource
          const createdResource = await this.createResource({
            title: resource.title,
            url: resource.url,
            description: resource.description,
            type: resource.type as ResourceType,
            sourceAuthority: resource.sourceAuthority,
            visualRichness: resource.visualRichness,
            interactivity: resource.interactivity,
            qualityScore: resource.qualityScore,
            imageUrl: resource.imageUrl,
            tags: resource.tags
          });
          
          // Connect to concept
          await this.connectResourceToConcept(createdResource.id, conceptId, 85);
          
          savedResources.push(createdResource);
        }
      }
      
      return savedResources;
    } catch (error) {
      console.error(`Error discovering resources for concept ${concept.name}:`, error);
      
      // Fallback to pre-defined resources if discovery fails
      const fallbackResources = [
        {
          title: `${concept.name} Tutorial`,
          url: `https://example.com/${concept.name.toLowerCase().replace(/\s+/g, '-')}`,
          description: `Learn about ${concept.name} with this comprehensive tutorial.`,
          type: 'article' as ResourceType,
          sourceAuthority: 80,
          visualRichness: 70,
          interactivity: 50,
          qualityScore: 70,
          imageUrl: 'https://example.com/image.jpg',
          tags: [concept.name.toLowerCase(), 'tutorial']
        },
        {
          title: `${concept.name} Video Explanation`,
          url: `https://example.com/video/${concept.name.toLowerCase().replace(/\s+/g, '-')}`,
          description: `Watch this video to understand ${concept.name} visually.`,
          type: 'video' as ResourceType,
          sourceAuthority: 85,
          visualRichness: 90,
          interactivity: 60,
          qualityScore: 80,
          imageUrl: 'https://example.com/video-thumb.jpg',
          tags: [concept.name.toLowerCase(), 'video']
        }
      ];
      
      return fallbackResources.slice(0, limit);
    }
  }

  /**
   * Analyze a URL to extract metadata and evaluate as a learning resource
   */
  async analyzeResourceUrl(url: string): Promise<DiscoveredResource | null> {
    try {
      return await scrapeResourceUrl(url);
    } catch (error) {
      console.error(`Error analyzing resource URL ${url}:`, error);
      return null;
    }
  }

  /**
   * Create a new resource
   */
  async createResource(resourceData: ResourceCreationParams) {
    // Calculate quality score if not provided
    const qualityScore = resourceData.qualityScore || Math.round(
      (resourceData.sourceAuthority * 0.4) + 
      (resourceData.visualRichness * 0.3) + 
      (resourceData.interactivity * 0.3)
    );
    
    return storage.createResource({
      ...resourceData,
      qualityScore
    });
  }

  /**
   * Update an existing resource
   */
  async updateResource(resourceData: ResourceUpdateParams) {
    // If metrics are updated, recalculate quality score
    let qualityScore = resourceData.qualityScore;
    
    if (
      !qualityScore &&
      (resourceData.sourceAuthority !== undefined || 
      resourceData.visualRichness !== undefined || 
      resourceData.interactivity !== undefined)
    ) {
      // Get current resource data
      const currentResource = await storage.getResource(resourceData.id);
      
      // Calculate new quality score with updated metrics
      qualityScore = Math.round(
        ((resourceData.sourceAuthority || currentResource.sourceAuthority) * 0.4) + 
        ((resourceData.visualRichness || currentResource.visualRichness) * 0.3) + 
        ((resourceData.interactivity || currentResource.interactivity) * 0.3)
      );
    }
    
    return storage.updateResource({
      ...resourceData,
      ...(qualityScore !== undefined ? { qualityScore } : {})
    });
  }

  /**
   * Delete a resource
   */
  async deleteResource(resourceId: number) {
    return storage.deleteResource(resourceId);
  }

  /**
   * Connect a resource to a concept
   */
  async connectResourceToConcept(resourceId: number, conceptId: number, relevanceScore = 75) {
    return storage.connectResourceToConcept(resourceId, conceptId, relevanceScore);
  }

  /**
   * Record a user interaction with a resource
   */
  async recordResourceInteraction(params: ResourceInteractionParams) {
    // Record the interaction
    const interaction = await storage.recordResourceInteraction(params);
    
    // If this is a rating, update the cumulative resource rating
    if (params.rating !== undefined) {
      // Get all ratings for this resource
      const interactions = await storage.getResourceInteractions(params.resourceId);
      const ratings = interactions.filter(i => i.rating !== undefined && i.rating > 0);
      
      // Calculate average rating
      const totalRatings = ratings.length;
      if (totalRatings > 0) {
        const avgRating = ratings.reduce((sum, curr) => sum + (curr.rating || 0), 0) / totalRatings;
      
        // Update the resource quality score to factor in user ratings
        const resource = await storage.getResource(params.resourceId);
        const newQualityScore = Math.round((resource.qualityScore * 0.7) + (avgRating * 20 * 0.3));
      
        // Update the resource
        await this.updateResource({
          id: params.resourceId,
          qualityScore: newQualityScore
        });
      }
    }
    
    // If this is a completion, update the user's learning progress
    if (params.interactionType === 'complete') {
      // Get the concepts associated with this resource
      const conceptResources = await storage.getConceptResourcesByResourceId(params.resourceId);
      
      // Update user's learning progress for each concept
      for (const cr of conceptResources) {
        await storage.updateUserLearningProgress(params.userId, cr.conceptId, 0.2);
      }
      
      // Update user learning style based on resource type and rating
      const resource = await storage.getResource(params.resourceId);
      const userStyle: Partial<LearningStyle> = {};
      
      // If user rated this resource highly (4-5 stars), boost corresponding learning style
      if (params.rating && params.rating >= 4) {
        if (resource.type === 'video') {
          userStyle.visualLearning = 10;
          userStyle.audioLearning = 10;
        } else if (resource.type === 'article') {
          userStyle.readingLearning = 10;
        } else if (resource.type === 'interactive') {
          userStyle.interactiveLearning = 10;
        }
        
        // Update user learning style (uses incremental adjustment)
        await this.updateUserLearningStyle(params.userId, userStyle);
      }
    }
    
    return interaction;
  }

  /**
   * Get personalized resource recommendations for a user
   */
  async getPersonalizedResourcesForUser(userId: number, conceptId: number, limit = 5) {
    // Get user learning style
    const userStyle = await storage.getLearningStyle(userId);
    
    // Get all resources for the concept
    const resources = await storage.getResourcesByConceptId(conceptId);
    
    // Apply personalization based on learning style
    const scoredResources = await Promise.all(resources.map(async (resource) => {
      let personalScore = resource.qualityScore;
      
      // Adjust score based on user's learning style
      if (userStyle) {
        if (userStyle.visualLearning > 70 && resource.visualRichness > 80) {
          personalScore += 10;
        }
        
        if (userStyle.interactiveLearning > 70 && resource.interactivity > 80) {
          personalScore += 10;
        }
        
        if (userStyle.readingLearning > 70 && resource.type === 'article') {
          personalScore += 10;
        }
        
        if (userStyle.audioLearning > 70 && resource.type === 'video') {
          personalScore += 10;
        }
      }
      
      // Factor in user's past interactions with this resource
      const interactions = await storage.getResourceInteractions(resource.id, userId);
      
      // If user has viewed but not completed, boost score to encourage completion
      const hasViewed = interactions.some(i => i.interactionType === 'view');
      const hasCompleted = interactions.some(i => i.interactionType === 'complete');
      
      if (hasViewed && !hasCompleted) {
        personalScore += 5;
      }
      
      // If user has saved this resource, boost score
      if (interactions.some(i => i.interactionType === 'save')) {
        personalScore += 8;
      }
      
      return {
        ...resource,
        personalScore
      };
    }));
    
    // Sort by personalized score and limit results
    return scoredResources
      .sort((a, b) => b.personalScore - a.personalScore)
      .slice(0, limit);
  }

  /**
   * Update user learning style based on their interactions
   */
  async updateUserLearningStyle(userId: number, newStyle: Partial<LearningStyle>) {
    return storage.updateUserLearningStyle(userId, newStyle);
  }

  /**
   * Generate a learning path for a concept
   */
  async generateLearningPathForConcept(conceptId: number, userId?: number) {
    const resources = userId 
      ? await this.getPersonalizedResourcesForUser(userId, conceptId, 10)
      : await storage.getResourcesByConceptId(conceptId);
    
    // Extract concept prerequisites
    const concept = await storage.getConcept(conceptId);
    const prerequisites = await storage.getPrerequisitesForConcept(conceptId);
    
    // Organize resources into a learning path
    const beginner = resources.filter(r => 
      r.tags?.some(tag => tag.includes('introduction') || tag.includes('beginner'))
    );
    
    const intermediate = resources.filter(r => 
      r.tags?.some(tag => tag.includes('intermediate'))
    );
    
    const advanced = resources.filter(r => 
      r.tags?.some(tag => tag.includes('advanced'))
    );
    
    // Create resources by type for balanced learning
    const videos = resources.filter(r => r.type === 'video');
    const articles = resources.filter(r => r.type === 'article');
    const interactive = resources.filter(r => r.type === 'interactive');
    
    // Create a structured learning path
    const learningPath = [];
    
    // Start with 1-2 beginner resources
    learningPath.push(...beginner.slice(0, 2));
    
    // Add a balanced mix of resource types if available
    if (videos.length > 0 && !learningPath.some(r => r.type === 'video')) {
      learningPath.push(videos[0]);
    }
    
    if (interactive.length > 0 && !learningPath.some(r => r.type === 'interactive')) {
      learningPath.push(interactive[0]);
    }
    
    if (articles.length > 0 && !learningPath.some(r => r.type === 'article')) {
      learningPath.push(articles[0]);
    }
    
    // Add some intermediate resources
    learningPath.push(...intermediate.slice(0, 2));
    
    // Add advanced content last
    learningPath.push(...advanced.slice(0, 1));
    
    // Remove duplicates that might have been added in multiple categories
    const uniquePath = [];
    const ids = new Set();
    
    for (const resource of learningPath) {
      if (!ids.has(resource.id)) {
        uniquePath.push(resource);
        ids.add(resource.id);
      }
    }
    
    // If we don't have enough resources, add more from the general pool
    const remainingCount = 5 - uniquePath.length;
    if (remainingCount > 0) {
      const remainingResources = resources.filter(r => !ids.has(r.id));
      uniquePath.push(...remainingResources.slice(0, remainingCount));
    }
    
    // Return the learning path with additional metadata
    return {
      concept: concept?.name || 'Unknown Concept',
      prerequisites: prerequisites.map(p => p.name),
      path: uniquePath.map((resource, index) => ({
        ...resource,
        order: index + 1,
        estimatedTimeMinutes: Math.round(
          resource.type === 'video' ? 10 : 
          resource.type === 'article' ? 15 : 
          resource.type === 'interactive' ? 20 : 
          resource.type === 'course' ? 60 : 15
        )
      }))
    };
  }

  /**
   * Search for resources by keyword
   */
  async searchResourcesByKeyword(keyword: string, limit = 10) {
    try {
      const results = await searchResources(keyword, limit);
      return rankResources(results);
    } catch (error) {
      console.error(`Error searching resources by keyword "${keyword}":`, error);
      return [];
    }
  }
  
  /**
   * Recommend resources for a user (wrapper method for getPersonalizedResourcesForUser)
   */
  async recommendResourcesForUser(userId: number, conceptId: number, limit = 5) {
    return this.getPersonalizedResourcesForUser(userId, conceptId, limit);
  }
  
  /**
   * Generate learning path (wrapper method for generateLearningPathForConcept)
   */
  async generateLearningPath(conceptId: number, userId?: number) {
    return this.generateLearningPathForConcept(conceptId, userId);
  }
}

export const resourceService = new ResourceService();
