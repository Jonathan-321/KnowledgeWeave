import axios from 'axios';
import { eq, and, inArray } from 'drizzle-orm';
import { db } from '../db';
import { enhancedResources, resources, resourceConcepts, concepts } from '@shared/enhancedSchema';
import { DifficultyLevel, ResourceQuality } from '@shared/enhancedSchema';
import { DiscoveredResource, visualResourceDiscoveryService } from './VisualResourceDiscoveryService';

/**
 * Represents a resource that has been curated and connected to concepts
 * in the knowledge graph
 */
export interface CuratedResource {
  id: number;
  resourceId: number;
  url: string;
  title: string;
  description: string;
  sourceType: 'video' | 'article' | 'interactive' | 'course' | 'book' | 'tool';
  sourceQuality: ResourceQuality;
  visualRichness: number;
  authorityScore: number;
  imageUrl?: string;
  sourceName: string;
  author?: string;
  publishDate?: Date;
  estimatedTimeMinutes: number;
  difficultyLevel: DifficultyLevel;
  conceptConnections: {
    conceptId: number;
    conceptName: string;
    relevanceScore: number; // 0-100
    isCore: boolean; // Is this a primary resource for the concept?
  }[];
  learningPathPosition?: {
    pathId: number;
    sequenceOrder: number;
    isPrerequisite: boolean;
  };
  communityRating?: number;
  expertVerified: boolean;
  learningStyleFit: {
    visual: number; // 0-100
    auditory: number; // 0-100
    reading: number; // 0-100
    kinesthetic: number; // 0-100
  };
  tags: string[];
  aiSummary?: string;
  dateAdded: Date;
}

/**
 * Represents a connection between resources in the graph
 */
export interface ResourceConnection {
  sourceResourceId: number;
  targetResourceId: number;
  connectionType: 'prerequisite' | 'extension' | 'alternative' | 'application' | 'deepDive';
  connectionStrength: number; // 0-100
}

/**
 * Service for managing the resource graph and curated resources
 */
export class ResourceGraphService {
  /**
   * Discovers and curates high-quality resources for a specific concept
   * @param conceptId The concept ID to curate resources for
   * @param limit Maximum number of resources to curate
   * @returns Array of curated resources
   */
  async discoverAndCurateResourcesForConcept(conceptId: number, limit = 10): Promise<CuratedResource[]> {
    try {
      // Get concept details
      const conceptResult = await db.select().from(concepts).where(eq(concepts.id, conceptId));
      
      if (conceptResult.length === 0) {
        throw new Error(`Concept with ID ${conceptId} not found`);
      }
      
      const concept = conceptResult[0];
      
      // Discover visual resources using the existing service
      const discoveredResources = await visualResourceDiscoveryService.discoverVisualResourcesForConcept(
        concept.name,
        limit * 2 // Discover more than needed to allow for filtering
      );
      
      // Filter and transform discovered resources into curated resources
      const curatedResources: CuratedResource[] = await Promise.all(
        discoveredResources.map(async (resource) => {
          // Generate AI summary of the resource
          const aiSummary = await this.generateResourceSummary(resource, concept.name);
          
          // Create curated resource
          return {
            id: 0, // Will be assigned when saved to DB
            resourceId: 0, // Will be assigned when saved to DB
            url: resource.url,
            title: resource.title,
            description: resource.description,
            sourceType: resource.sourceType,
            sourceQuality: resource.sourceQuality,
            visualRichness: resource.visualRichness,
            authorityScore: resource.authorityScore,
            imageUrl: resource.imageUrl,
            sourceName: resource.sourceName,
            author: resource.author,
            publishDate: resource.publishDate,
            estimatedTimeMinutes: resource.estimatedTimeMinutes,
            difficultyLevel: resource.difficultyLevel,
            conceptConnections: [
              {
                conceptId: concept.id,
                conceptName: concept.name,
                relevanceScore: this.calculateRelevanceScore(resource, concept.name),
                isCore: true
              }
            ],
            learningPathPosition: undefined,
            communityRating: undefined,
            expertVerified: false,
            learningStyleFit: resource.learningStyleFit,
            tags: concept.tags ? concept.tags : [],
            aiSummary,
            dateAdded: new Date()
          };
        })
      );
      
      // Sort by relevance score
      const sortedResources = curatedResources.sort((a, b) => {
        const aScore = a.conceptConnections[0].relevanceScore;
        const bScore = b.conceptConnections[0].relevanceScore;
        return bScore - aScore;
      });
      
      // Return top resources
      return sortedResources.slice(0, limit);
    } catch (error) {
      console.error('Error discovering and curating resources:', error);
      throw error;
    }
  }
  
  /**
   * Saves curated resources to the database
   * @param curatedResources Array of curated resources to save
   * @returns Array of saved resource IDs
   */
  async saveCuratedResources(curatedResources: CuratedResource[]): Promise<number[]> {
    const savedResourceIds: number[] = [];
    
    for (const resource of curatedResources) {
      try {
        // Check if resource with same URL already exists
        const existingResources = await db.select()
          .from(enhancedResources)
          .where(eq(enhancedResources.url, resource.url));
        
        if (existingResources.length > 0) {
          // Resource already exists, update connections
          const existingResource = existingResources[0];
          
          // Add new concept connections
          for (const connection of resource.conceptConnections) {
            // Check if connection already exists
            const existingConnections = await db.select()
              .from(resourceConcepts)
              .where(
                and(
                  eq(resourceConcepts.resourceId, existingResource.id),
                  eq(resourceConcepts.conceptId, connection.conceptId)
                )
              );
            
            if (existingConnections.length === 0) {
              // Add new connection
              await db.insert(resourceConcepts).values({
                resourceId: existingResource.id,
                conceptId: connection.conceptId,
                relevanceScore: connection.relevanceScore,
                isCore: connection.isCore
              });
            }
          }
          
          savedResourceIds.push(existingResource.id);
        } else {
          // Insert new resource
          const insertResult = await db.insert(enhancedResources).values({
            url: resource.url,
            title: resource.title,
            description: resource.description,
            type: resource.sourceType,
            quality: resource.sourceQuality,
            visualRichness: resource.visualRichness,
            authorityScore: resource.authorityScore,
            imageUrl: resource.imageUrl,
            sourceName: resource.sourceName,
            author: resource.author,
            publishDate: resource.publishDate,
            estimatedTimeMinutes: resource.estimatedTimeMinutes,
            difficultyLevel: resource.difficultyLevel,
            learningStyleFit: JSON.stringify(resource.learningStyleFit),
            tags: resource.tags,
            aiSummary: resource.aiSummary,
            dateAdded: resource.dateAdded,
            expertVerified: resource.expertVerified
          });
          
          // Get inserted ID
          const newResourceId = insertResult[0].insertId;
          
          // Add concept connections
          for (const connection of resource.conceptConnections) {
            await db.insert(resourceConcepts).values({
              resourceId: newResourceId,
              conceptId: connection.conceptId,
              relevanceScore: connection.relevanceScore,
              isCore: connection.isCore
            });
          }
          
          savedResourceIds.push(newResourceId);
        }
      } catch (error) {
        console.error(`Error saving curated resource: ${resource.title}`, error);
      }
    }
    
    return savedResourceIds;
  }
  
  /**
   * Finds related concepts for a resource based on its content
   * @param resourceUrl URL of the resource
   * @param resourceTitle Title of the resource
   * @param resourceDescription Description of the resource
   * @returns Array of related concept IDs with relevance scores
   */
  async findRelatedConcepts(
    resourceUrl: string,
    resourceTitle: string,
    resourceDescription: string
  ): Promise<Array<{ conceptId: number; relevanceScore: number }>> {
    // Get all concepts
    const allConcepts = await db.select().from(concepts);
    
    // Calculate relevance for each concept
    const relevanceScores = allConcepts.map(concept => {
      const titleMatches = this.countOccurrences(resourceTitle.toLowerCase(), concept.name.toLowerCase());
      const descriptionMatches = this.countOccurrences(resourceDescription.toLowerCase(), concept.name.toLowerCase());
      
      // Calculate relevance score
      const score = (titleMatches * 10) + (descriptionMatches * 2);
      
      return {
        conceptId: concept.id,
        relevanceScore: Math.min(100, score)
      };
    });
    
    // Filter to include only concepts with non-zero relevance
    return relevanceScores.filter(item => item.relevanceScore > 0);
  }
  
  /**
   * Gets curated resources for a concept
   * @param conceptId The concept ID to get resources for
   * @param limit Maximum number of resources to return
   * @returns Array of curated resources
   */
  async getCuratedResourcesForConcept(conceptId: number, limit = 10): Promise<CuratedResource[]> {
    try {
      // Get concept-resource connections
      const connections = await db.select()
        .from(resourceConcepts)
        .where(eq(resourceConcepts.conceptId, conceptId))
        .limit(limit);
      
      if (connections.length === 0) {
        return [];
      }
      
      // Get resource IDs
      const resourceIds = connections.map(conn => conn.resourceId);
      
      // Get resources
      const resourceResults = await db.select()
        .from(enhancedResources)
        .where(inArray(enhancedResources.id, resourceIds));
      
      // Get concept details
      const conceptResult = await db.select().from(concepts).where(eq(concepts.id, conceptId));
      
      if (conceptResult.length === 0) {
        throw new Error(`Concept with ID ${conceptId} not found`);
      }
      
      const concept = conceptResult[0];
      
      // Transform to curated resources
      const curatedResources: CuratedResource[] = resourceResults.map(resource => {
        // Find the connection for this resource
        const connection = connections.find(conn => conn.resourceId === resource.id);
        
        return {
          id: resource.id,
          resourceId: resource.id,
          url: resource.url,
          title: resource.title,
          description: resource.description,
          sourceType: resource.type as any,
          sourceQuality: resource.quality,
          visualRichness: resource.visualRichness,
          authorityScore: resource.authorityScore,
          imageUrl: resource.imageUrl,
          sourceName: resource.sourceName,
          author: resource.author,
          publishDate: resource.publishDate,
          estimatedTimeMinutes: resource.estimatedTimeMinutes,
          difficultyLevel: resource.difficultyLevel,
          conceptConnections: [
            {
              conceptId: concept.id,
              conceptName: concept.name,
              relevanceScore: connection ? connection.relevanceScore : 0,
              isCore: connection ? connection.isCore : false
            }
          ],
          learningPathPosition: undefined,
          communityRating: undefined,
          expertVerified: resource.expertVerified,
          learningStyleFit: typeof resource.learningStyleFit === 'string' 
            ? JSON.parse(resource.learningStyleFit) 
            : resource.learningStyleFit,
          tags: resource.tags,
          aiSummary: resource.aiSummary,
          dateAdded: resource.dateAdded
        };
      });
      
      // Sort by relevance score
      return curatedResources.sort((a, b) => {
        const aScore = a.conceptConnections[0].relevanceScore;
        const bScore = b.conceptConnections[0].relevanceScore;
        return bScore - aScore;
      });
    } catch (error) {
      console.error('Error getting curated resources:', error);
      throw error;
    }
  }
  
  /**
   * Gets resource connections (graph edges) for a set of resources
   * @param resourceIds Array of resource IDs
   * @returns Array of resource connections
   */
  async getResourceConnections(resourceIds: number[]): Promise<ResourceConnection[]> {
    try {
      // For now, generate synthetic connections based on shared concepts
      // In a real implementation, this would query a dedicated table of resource connections
      
      // Get all concepts connected to these resources
      const connections = await db.select()
        .from(resourceConcepts)
        .where(inArray(resourceConcepts.resourceId, resourceIds));
      
      // Create a map of resources to concepts
      const resourceConceptsMap = new Map<number, number[]>();
      
      for (const conn of connections) {
        if (!resourceConceptsMap.has(conn.resourceId)) {
          resourceConceptsMap.set(conn.resourceId, []);
        }
        
        resourceConceptsMap.get(conn.resourceId)!.push(conn.conceptId);
      }
      
      // Generate connections based on shared concepts
      const resourceConnections: ResourceConnection[] = [];
      
      // Compare each pair of resources
      for (let i = 0; i < resourceIds.length; i++) {
        for (let j = i + 1; j < resourceIds.length; j++) {
          const resourceA = resourceIds[i];
          const resourceB = resourceIds[j];
          
          const conceptsA = resourceConceptsMap.get(resourceA) || [];
          const conceptsB = resourceConceptsMap.get(resourceB) || [];
          
          // Find shared concepts
          const sharedConcepts = conceptsA.filter(conceptId => conceptsB.includes(conceptId));
          
          if (sharedConcepts.length > 0) {
            // Calculate connection strength based on number of shared concepts
            const connectionStrength = Math.min(100, sharedConcepts.length * 25);
            
            // Determine connection type (simplified version)
            let connectionType: 'prerequisite' | 'extension' | 'alternative' | 'application' | 'deepDive' = 'alternative';
            
            // Add connection in both directions
            resourceConnections.push({
              sourceResourceId: resourceA,
              targetResourceId: resourceB,
              connectionType,
              connectionStrength
            });
            
            resourceConnections.push({
              sourceResourceId: resourceB,
              targetResourceId: resourceA,
              connectionType,
              connectionStrength
            });
          }
        }
      }
      
      return resourceConnections;
    } catch (error) {
      console.error('Error getting resource connections:', error);
      throw error;
    }
  }
  
  /**
   * Helper method to calculate relevance score between a resource and a concept
   * @param resource The discovered resource
   * @param conceptName The concept name
   * @returns Relevance score (0-100)
   */
  private calculateRelevanceScore(resource: DiscoveredResource, conceptName: string): number {
    const titleMatches = this.countOccurrences(resource.title.toLowerCase(), conceptName.toLowerCase());
    const descriptionMatches = this.countOccurrences(resource.description.toLowerCase(), conceptName.toLowerCase());
    
    // Calculate relevance score
    // Title matches are weighted more heavily
    const score = (titleMatches * 20) + (descriptionMatches * 5);
    
    // Cap at 100
    return Math.min(100, score);
  }
  
  /**
   * Helper method to count occurrences of a substring in a string
   * @param text The text to search in
   * @param searchTerm The term to search for
   * @returns Number of occurrences
   */
  private countOccurrences(text: string, searchTerm: string): number {
    let count = 0;
    let position = text.indexOf(searchTerm);
    
    while (position !== -1) {
      count++;
      position = text.indexOf(searchTerm, position + 1);
    }
    
    return count;
  }
  
  /**
   * Generates an AI summary of a resource in the context of a concept
   * @param resource The discovered resource
   * @param conceptName The concept name
   * @returns AI-generated summary
   */
  private async generateResourceSummary(resource: DiscoveredResource, conceptName: string): Promise<string> {
    // In a production system, this would call an AI service
    // For now, generate a simple summary
    
    const resourceType = this.getResourceTypeDescription(resource.sourceType);
    
    return `This ${resourceType} covers ${conceptName} with ${this.getQualityDescription(resource.sourceQuality)} quality content. It ${this.getVisualizationDescription(resource.visualRichness)} and would take approximately ${resource.estimatedTimeMinutes} minutes to complete.`;
  }
  
  /**
   * Helper method to get resource type description
   * @param resourceType The resource type
   * @returns Description of the resource type
   */
  private getResourceTypeDescription(resourceType: string): string {
    switch (resourceType) {
      case 'video': return 'educational video';
      case 'article': return 'detailed article';
      case 'interactive': return 'interactive tutorial';
      case 'course': return 'comprehensive course';
      case 'book': return 'in-depth book';
      default: return 'learning resource';
    }
  }
  
  /**
   * Helper method to get quality description
   * @param quality The resource quality
   * @returns Description of the quality
   */
  private getQualityDescription(quality: ResourceQuality): string {
    switch (quality) {
      case 'high': return 'high';
      case 'medium': return 'moderate';
      case 'low': return 'basic';
      default: return 'standard';
    }
  }
  
  /**
   * Helper method to get visualization description
   * @param visualRichness The visual richness score
   * @returns Description of the visualization
   */
  private getVisualizationDescription(visualRichness: number): string {
    if (visualRichness >= 80) {
      return 'includes excellent visualizations and graphics to enhance understanding';
    } else if (visualRichness >= 60) {
      return 'provides good visual aids to support learning';
    } else if (visualRichness >= 40) {
      return 'includes some helpful visuals';
    } else {
      return 'focuses primarily on textual explanation';
    }
  }
}

export const resourceGraphService = new ResourceGraphService();
