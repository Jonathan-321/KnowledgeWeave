import { db } from '@/db';
import { 
  concepts, 
  users, 
  learningProgress, 
  enhancedConcepts,
  conceptRelationships,
  enhancedResources,
  resourceConcepts
} from '@shared/enhancedSchema';
import { and, eq, gt, sql } from 'drizzle-orm';
import { EnhancedGraphNode, EnhancedGraphLink, EnhancedKnowledgeGraph } from '@shared/enhancedSchema';

/**
 * Service for processing and managing knowledge graph visualization data
 */
export class GraphVisualizationService {
  /**
   * Generates the complete knowledge graph with all concepts and relationships
   * @returns The complete knowledge graph data
   */
  async getCompleteKnowledgeGraph(): Promise<EnhancedKnowledgeGraph> {
    // Get all enhanced concepts
    const conceptNodes = await this.getEnhancedConcepts();
    
    // Get all relationships between concepts
    const relationships = await this.getConceptRelationships();
    
    // Calculate domain areas
    const domains = [...new Set(conceptNodes.map(node => node.domainArea).filter(Boolean))];
    
    // Get resource connections
    const resourceConnections = await this.getResourceConnections();
    
    return {
      nodes: conceptNodes,
      links: relationships,
      domains,
      resourceConnections,
      userProgress: []
    };
  }
  
  /**
   * Gets the personalized knowledge graph for a specific user
   * @param userId The user ID
   * @returns The personalized knowledge graph data
   */
  async getPersonalizedKnowledgeGraph(userId: number): Promise<EnhancedKnowledgeGraph> {
    // Get base knowledge graph
    const baseGraph = await this.getCompleteKnowledgeGraph();
    
    // Get user learning progress
    const progress = await db.select()
      .from(learningProgress)
      .where(eq(learningProgress.user_id, userId));
    
    // Map user progress data to concepts
    const conceptMastery = new Map<number, number>();
    progress.forEach(p => {
      conceptMastery.set(p.concept_id, p.mastery_level);
    });
    
    // Augment graph nodes with user's mastery data
    const userGraph: EnhancedKnowledgeGraph = {
      ...baseGraph,
      nodes: baseGraph.nodes.map(node => ({
        ...node,
        mastery: conceptMastery.has(node.id) ? conceptMastery.get(node.id) : undefined
      })),
      userProgress: progress.map(p => ({
        conceptId: p.concept_id,
        mastery: p.mastery_level,
        knowledgeGaps: [] // To be populated from knowledge gap data
      }))
    };
    
    // Get user's knowledge gaps for each concept
    const knowledgeGaps = await this.getUserKnowledgeGaps(userId);
    
    // Augment user progress with knowledge gaps
    userGraph.userProgress = userGraph.userProgress.map(progress => {
      const gaps = knowledgeGaps.filter(gap => gap.conceptId === progress.conceptId);
      return {
        ...progress,
        knowledgeGaps: gaps.map(gap => gap.id)
      };
    });
    
    return userGraph;
  }
  
  /**
   * Gets the neighborhood of a concept in the knowledge graph
   * @param conceptId The central concept ID
   * @param depth The depth of neighborhood to retrieve (default: 2)
   * @returns The neighborhood subgraph
   */
  async getConceptNeighborhood(conceptId: number, depth: number = 2): Promise<EnhancedKnowledgeGraph> {
    // Get the complete graph
    const fullGraph = await this.getCompleteKnowledgeGraph();
    
    // Find the central concept
    const centralNode = fullGraph.nodes.find(node => node.id === conceptId);
    if (!centralNode) {
      throw new Error(`Concept with ID ${conceptId} not found`);
    }
    
    // BFS to get neighborhood nodes
    const visited = new Set<number>([conceptId]);
    const queue: {id: number, depth: number}[] = [{id: conceptId, depth: 0}];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      
      // Skip if we've reached the maximum depth
      if (current.depth >= depth) continue;
      
      // Find all connected nodes
      const connectedLinks = fullGraph.links.filter(
        link => {
          const sourceId = typeof link.source === 'number' ? link.source : link.source.id;
          const targetId = typeof link.target === 'number' ? link.target : link.target.id;
          return sourceId === current.id || targetId === current.id;
        }
      );
      
      // Add connected nodes to the queue
      connectedLinks.forEach(link => {
        const sourceId = typeof link.source === 'number' ? link.source : link.source.id;
        const targetId = typeof link.target === 'number' ? link.target : link.target.id;
        
        const nextId = sourceId === current.id ? targetId : sourceId;
        
        if (!visited.has(nextId)) {
          visited.add(nextId);
          queue.push({id: nextId, depth: current.depth + 1});
        }
      });
    }
    
    // Filter nodes and links
    const nodes = fullGraph.nodes.filter(node => visited.has(node.id));
    const links = fullGraph.links.filter(link => {
      const sourceId = typeof link.source === 'number' ? link.source : link.source.id;
      const targetId = typeof link.target === 'number' ? link.target : link.target.id;
      return visited.has(sourceId) && visited.has(targetId);
    });
    
    // Get resource connections only for the filtered nodes
    const nodeIds = nodes.map(node => node.id);
    const filteredResourceConnections = fullGraph.resourceConnections.filter(
      conn => nodeIds.includes(conn.conceptId)
    );
    
    return {
      nodes,
      links,
      domains: fullGraph.domains,
      resourceConnections: filteredResourceConnections,
      userProgress: fullGraph.userProgress.filter(progress => nodeIds.includes(progress.conceptId))
    };
  }
  
  /**
   * Gets all enhanced concepts from the database
   * @returns Array of enhanced graph nodes
   */
  private async getEnhancedConcepts(): Promise<EnhancedGraphNode[]> {
    // Join enhanced concepts with base concepts
    const result = await db.select({
      id: enhancedConcepts.id,
      conceptId: enhancedConcepts.concept_id,
      name: concepts.name,
      description: concepts.description,
      importance: enhancedConcepts.importance,
      mastery_difficulty: enhancedConcepts.mastery_difficulty,
      domain_area: enhancedConcepts.domain_area,
      depth_level: enhancedConcepts.depth_level,
      visual_position_x: enhancedConcepts.visual_position_x,
      visual_position_y: enhancedConcepts.visual_position_y
    })
      .from(enhancedConcepts)
      .innerJoin(concepts, eq(enhancedConcepts.concept_id, concepts.id));
    
    // Count resources for each concept
    const resourceCounts = await db.select({
      conceptId: resourceConcepts.concept_id,
      count: sql<number>`count(*)`.as('count')
    })
      .from(resourceConcepts)
      .groupBy(resourceConcepts.concept_id);
    
    // Create a map for quick lookup
    const resourceCountMap = new Map<number, number>();
    resourceCounts.forEach(item => {
      resourceCountMap.set(item.conceptId, item.count);
    });
    
    // Transform into graph nodes
    return result.map(row => ({
      id: row.conceptId,
      label: row.name,
      type: 'concept',
      importance: row.importance || 5,
      domainArea: row.domain_area || 'Uncategorized',
      depthLevel: row.depth_level || 1,
      descriptionShort: row.description?.slice(0, 120) + (row.description && row.description.length > 120 ? '...' : ''),
      resourceCount: resourceCountMap.get(row.conceptId) || 0,
      x: row.visual_position_x,
      y: row.visual_position_y
    }));
  }
  
  /**
   * Gets all relationships between concepts
   * @returns Array of graph links
   */
  private async getConceptRelationships(): Promise<EnhancedGraphLink[]> {
    const relationships = await db.select()
      .from(conceptRelationships);
    
    return relationships.map(rel => ({
      source: rel.source_concept_id,
      target: rel.target_concept_id,
      type: rel.relationship_type,
      strength: rel.strength,
      strengthValue: this.getStrengthValue(rel.strength),
      bidirectional: rel.bidirectional,
      description: rel.description || undefined
    }));
  }
  
  /**
   * Maps strength descriptors to numeric values
   * @param strength The strength descriptor
   * @returns Numeric strength value
   */
  private getStrengthValue(strength: string | null): number {
    if (!strength) return 50;
    
    switch (strength.toLowerCase()) {
      case 'strong':
        return 90;
      case 'moderate':
        return 60;
      case 'weak':
        return 30;
      default:
        return 50;
    }
  }
  
  /**
   * Gets connections between concepts and resources
   * @returns Array of resource connections
   */
  private async getResourceConnections() {
    const connections = await db.select({
      conceptId: resourceConcepts.concept_id,
      resourceId: resourceConcepts.resource_id,
      resourceType: enhancedResources.type
    })
      .from(resourceConcepts)
      .innerJoin(enhancedResources, eq(resourceConcepts.resource_id, enhancedResources.id));
      
    return connections.map(conn => ({
      conceptId: conn.conceptId,
      resourceId: conn.resourceId,
      resourceType: conn.resourceType || 'unknown'
    }));
  }
  
  /**
   * Gets a user's knowledge gaps
   * @param userId The user ID
   * @returns Array of knowledge gaps
   */
  private async getUserKnowledgeGaps(userId: number) {
    // This would typically come from a knowledge_gaps table
    // For now, simulate with a query on learning progress where mastery is low
    const lowMasteryProgress = await db.select({
      id: learningProgress.id,
      conceptId: learningProgress.concept_id,
      mastery: learningProgress.mastery_level
    })
      .from(learningProgress)
      .where(and(
        eq(learningProgress.user_id, userId),
        gt(30, learningProgress.mastery_level)
      ));
    
    // Get concept names for better gap descriptions
    const conceptIds = lowMasteryProgress.map(p => p.conceptId);
    const conceptNames = new Map<number, string>();
    
    if (conceptIds.length > 0) {
      const conceptsData = await db.select({
        id: concepts.id,
        name: concepts.name
      })
        .from(concepts)
        .where(sql`${concepts.id} IN ${conceptIds}`);
      
      conceptsData.forEach(c => {
        conceptNames.set(c.id, c.name);
      });
    }
    
    // Create knowledge gap objects
    return lowMasteryProgress.map(p => {
      const conceptName = conceptNames.get(p.conceptId) || `Concept ${p.conceptId}`;
      return {
        id: p.id + 1000, // Simulating gap IDs
        conceptId: p.conceptId,
        topic: `Understanding ${conceptName}`,
        confidenceScore: p.mastery
      };
    });
  }
}

export const graphVisualizationService = new GraphVisualizationService();
