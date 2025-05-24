import express from 'express';
import { graphVisualizationService } from '../services/GraphVisualizationService';
import { resourceDiscoveryService } from '../services/ResourceDiscoveryService';
import { requireAuth } from '../middleware/auth';
import { db } from '../db';
import { enhancedConcepts, ConceptRelationshipType } from '@shared/enhancedSchema';
import { concepts } from '@shared/schema';
import { eq } from 'drizzle-orm';

const router = express.Router();

/**
 * Get the complete knowledge graph with all concepts and relationships
 */
router.get('/complete', async (req, res) => {
  try {
    const graph = await graphVisualizationService.getCompleteKnowledgeGraph();
    res.json(graph);
  } catch (error) {
    console.error('Error fetching complete knowledge graph:', error);
    res.status(500).json({ error: 'Failed to fetch knowledge graph' });
  }
});

/**
 * Get a personalized knowledge graph for the authenticated user
 */
router.get('/personalized', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const graph = await graphVisualizationService.getPersonalizedKnowledgeGraph(userId);
    res.json(graph);
  } catch (error) {
    console.error('Error fetching personalized knowledge graph:', error);
    res.status(500).json({ error: 'Failed to fetch personalized knowledge graph' });
  }
});

/**
 * Get the neighborhood of a concept in the knowledge graph
 */
router.get('/neighborhood/:conceptId', async (req, res) => {
  try {
    const conceptId = parseInt(req.params.conceptId);
    const depth = req.query.depth ? parseInt(req.query.depth as string) : 2;
    
    if (isNaN(conceptId)) {
      return res.status(400).json({ error: 'Invalid concept ID' });
    }
    
    const graph = await graphVisualizationService.getConceptNeighborhood(conceptId, depth);
    res.json(graph);
  } catch (error) {
    console.error('Error fetching concept neighborhood:', error);
    res.status(500).json({ error: 'Failed to fetch concept neighborhood' });
  }
});

/**
 * Get resources for a specific concept
 */
router.get('/resources/:conceptId', async (req, res) => {
  try {
    const conceptId = parseInt(req.params.conceptId);
    
    if (isNaN(conceptId)) {
      return res.status(400).json({ error: 'Invalid concept ID' });
    }
    
    // Get concept name from database
    const enhancedConcept = await db.select()
      .from(enhancedConcepts)
      .where(eq(enhancedConcepts.conceptId, conceptId))
      .limit(1);
      
    const conceptData = enhancedConcept.length > 0 ? 
      await db.select()
        .from(concepts)
        .where(eq(concepts.id, conceptId))
        .limit(1) : 
      [];
      
    const concept = conceptData.length > 0 ? conceptData[0] : null;
    
    if (!concept) {
      return res.status(404).json({ error: 'Concept not found' });
    }
    
    // Discover resources for this concept
    const resources = await resourceDiscoveryService.discoverResourcesForConcept(
      concept.name,
      10 // Limit to 10 resources
    );
    
    res.json(resources);
  } catch (error) {
    console.error('Error discovering resources:', error);
    res.status(500).json({ error: 'Failed to discover resources' });
  }
});

/**
 * Get user's knowledge gaps
 */
router.get('/knowledge-gaps', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    // Use personalized graph to get knowledge gaps data
    const graph = await graphVisualizationService.getPersonalizedKnowledgeGraph(userId);
    
    // Extract knowledge gaps from user progress
    const knowledgeGaps = (graph.userProgress || [])
      .filter(progress => progress.knowledgeGaps && progress.knowledgeGaps.length > 0)
      .flatMap(progress => {
        return progress.knowledgeGaps.map(gapId => {
          return {
            id: gapId,
            conceptId: progress.conceptId,
            mastery: progress.mastery,
            // In a real implementation, we would fetch more details
            topic: `Understanding gap in concept ${progress.conceptId}`,
            confidenceScore: Math.min(progress.mastery, 40) // Lower confidence for gaps
          };
        });
      });
    
    res.json(knowledgeGaps);
  } catch (error) {
    console.error('Error fetching knowledge gaps:', error);
    res.status(500).json({ error: 'Failed to fetch knowledge gaps' });
  }
});

/**
 * Get user's learning path based on the knowledge graph
 */
router.get('/learning-path', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const domainArea = req.query.domain as string;
    const targetConceptId = req.query.targetConcept ? parseInt(req.query.targetConcept as string) : undefined;
    
    // This would be implemented in a LearningPathService
    // For now, provide a simple path based on dependencies
    
    // Get user's progress
    const graph = await graphVisualizationService.getPersonalizedKnowledgeGraph(userId);
    
    // Simple algorithm: 
    // 1. Find concepts with low mastery
    // 2. Order by prerequisites
    const lowMasteryConcepts = graph.nodes
      .filter(node => (node.mastery === undefined || node.mastery < 70) && 
                      (!domainArea || node.domainArea === domainArea))
      .sort((a, b) => (a.depthLevel || 0) - (b.depthLevel || 0));
    
    // Generate learning path
    const learningPath = lowMasteryConcepts.map(concept => {
      // Find prerequisites
      const prerequisites = graph.links
        .filter(link => {
          const targetId = typeof link.target === 'number' ? link.target : link.target.id;
          return targetId === concept.id && link.type === 'prerequisite';
        })
        .map(link => {
          const sourceId = typeof link.source === 'number' ? link.source : link.source.id;
          return graph.nodes.find(node => node.id === sourceId);
        })
        .filter(Boolean);
      
      return {
        concept,
        prerequisites,
        estimatedTimeToMastery: Math.round((100 - (concept.mastery || 0)) * 0.5) // 0.5 hours per percentage point
      };
    });
    
    res.json(learningPath);
  } catch (error) {
    console.error('Error generating learning path:', error);
    res.status(500).json({ error: 'Failed to generate learning path' });
  }
});

/**
 * Get concept relationships by type
 */
router.get('/relationships/:type', async (req, res) => {
  try {
    const relationshipType = req.params.type as ConceptRelationshipType;
    
    // Since we don't have direct access to conceptRelationships table,
    // we'll get all relationships from the graph service instead
    const graph = await graphVisualizationService.getCompleteKnowledgeGraph();
    
    // Filter relationships by the requested type
    const filteredRelationships = graph.links.filter(link => link.type === relationshipType);
    
    res.json(filteredRelationships);
  } catch (error) {
    console.error(`Error fetching ${req.params.type} relationships:`, error);
    res.status(500).json({ error: 'Failed to fetch relationships' });
  }
});

export default router;
