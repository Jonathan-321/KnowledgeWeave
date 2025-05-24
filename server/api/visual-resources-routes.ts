import express from 'express';
import { visualResourceDiscoveryService } from '../services/VisualResourceDiscoveryService';
import { requireAuth } from '../middleware/auth';
import { db } from '../db';
import { concepts } from '@shared/schema';
import { enhancedConcepts } from '@shared/enhancedSchema';
import { eq } from 'drizzle-orm';

const router = express.Router();

/**
 * Discover visual resources for a specific concept
 * GET /api/visual-resources/discover/:conceptId
 */
router.get('/discover/:conceptId', async (req, res) => {
  try {
    const conceptId = parseInt(req.params.conceptId);
    
    if (isNaN(conceptId)) {
      return res.status(400).json({ error: 'Invalid concept ID' });
    }
    
    // Get concept name from database
    const conceptData = await db.select({
      id: concepts.id,
      name: concepts.name,
      description: concepts.description
    })
    .from(concepts)
    .where(eq(concepts.id, conceptId))
    .limit(1);
    
    if (!conceptData.length) {
      return res.status(404).json({ error: 'Concept not found' });
    }
    
    const concept = conceptData[0];
    
    // Discover resources for this concept
    const discoveredResources = await visualResourceDiscoveryService.discoverVisualResourcesForConcept(
      concept.name,
      20 // Limit to 20 resources
    );
    
    res.json(discoveredResources);
  } catch (error) {
    console.error('Error discovering visual resources:', error);
    res.status(500).json({ error: 'Failed to discover resources' });
  }
});

/**
 * Save discovered resources for a concept
 * POST /api/visual-resources/save/:conceptId
 */
router.post('/save/:conceptId', requireAuth, async (req, res) => {
  try {
    const conceptId = parseInt(req.params.conceptId);
    const { resources } = req.body;
    
    if (!Array.isArray(resources) || resources.length === 0) {
      return res.status(400).json({ error: 'No resources provided' });
    }
    
    if (isNaN(conceptId)) {
      return res.status(400).json({ error: 'Invalid concept ID' });
    }
    
    // Save resources to database
    const savedResourceIds = await visualResourceDiscoveryService.saveDiscoveredResources(
      conceptId,
      resources
    );
    
    res.json({ 
      message: 'Resources saved successfully',
      savedCount: savedResourceIds.length,
      resourceIds: savedResourceIds
    });
  } catch (error) {
    console.error('Error saving discovered resources:', error);
    res.status(500).json({ error: 'Failed to save resources' });
  }
});

/**
 * Get recommended resources for a user based on learning style
 * GET /api/visual-resources/recommend/:conceptId
 */
router.get('/recommend/:conceptId', requireAuth, async (req, res) => {
  try {
    const conceptId = parseInt(req.params.conceptId);
    const userId = req.user!.id;
    
    if (isNaN(conceptId)) {
      return res.status(400).json({ error: 'Invalid concept ID' });
    }
    
    // Get concept data
    const conceptData = await db.select()
      .from(concepts)
      .where(eq(concepts.id, conceptId))
      .limit(1);
    
    if (!conceptData.length) {
      return res.status(404).json({ error: 'Concept not found' });
    }
    
    // In a real implementation, this would:
    // 1. Get the user's learning style preferences
    // 2. Get their current mastery level for the concept
    // 3. Get resources that match their learning style and level
    // 4. Sort by relevance to their needs
    
    // For now, reuse the discovery service but prioritize different factors
    const allResources = await visualResourceDiscoveryService.discoverVisualResourcesForConcept(
      conceptData[0].name,
      10
    );
    
    // Mock user learning style (in a real app, get from user profile)
    const userLearningStyle = {
      visual: 80,
      auditory: 60,
      reading: 70,
      kinesthetic: 50
    };
    
    // Sort resources by match to learning style
    const recommendedResources = allResources.sort((a, b) => {
      const aMatchScore = 
        (a.learningStyleFit.visual * userLearningStyle.visual +
         a.learningStyleFit.auditory * userLearningStyle.auditory +
         a.learningStyleFit.reading * userLearningStyle.reading +
         a.learningStyleFit.kinesthetic * userLearningStyle.kinesthetic) / 
        (userLearningStyle.visual + userLearningStyle.auditory + 
         userLearningStyle.reading + userLearningStyle.kinesthetic);
         
      const bMatchScore = 
        (b.learningStyleFit.visual * userLearningStyle.visual +
         b.learningStyleFit.auditory * userLearningStyle.auditory +
         b.learningStyleFit.reading * userLearningStyle.reading +
         b.learningStyleFit.kinesthetic * userLearningStyle.kinesthetic) / 
        (userLearningStyle.visual + userLearningStyle.auditory + 
         userLearningStyle.reading + userLearningStyle.kinesthetic);
      
      return bMatchScore - aMatchScore;
    });
    
    res.json(recommendedResources);
  } catch (error) {
    console.error('Error recommending resources:', error);
    res.status(500).json({ error: 'Failed to recommend resources' });
  }
});

/**
 * Get learning path with resources for a concept and its prerequisites
 * GET /api/visual-resources/learning-path/:conceptId
 */
router.get('/learning-path/:conceptId', requireAuth, async (req, res) => {
  try {
    const conceptId = parseInt(req.params.conceptId);
    const userId = req.user!.id;
    
    if (isNaN(conceptId)) {
      return res.status(400).json({ error: 'Invalid concept ID' });
    }
    
    // Get complete graph data to access relationships
    const graphResponse = await fetch(`http://localhost:5000/api/graph/personalized`, {
      headers: {
        'Cookie': req.headers.cookie || '' // Forward cookies for authentication
      }
    });
    
    if (!graphResponse.ok) {
      return res.status(500).json({ error: 'Failed to fetch knowledge graph' });
    }
    
    const graph = await graphResponse.json();
    
    // Find target concept node
    const targetNode = graph.nodes.find((node: any) => node.id === conceptId);
    if (!targetNode) {
      return res.status(404).json({ error: 'Concept not found in graph' });
    }
    
    // Find prerequisite relationships
    const prerequisites = graph.links
      .filter((link: any) => {
        const targetId = typeof link.target === 'number' ? link.target : link.target.id;
        return targetId === conceptId && link.type === 'prerequisite';
      })
      .map((link: any) => {
        const sourceId = typeof link.source === 'number' ? link.source : link.source.id;
        return graph.nodes.find((node: any) => node.id === sourceId);
      })
      .filter(Boolean);
    
    // Create learning path
    const learningPath = [
      // Include prerequisites first
      ...prerequisites.map((prereq: any) => ({
        concept: prereq,
        mastery: graph.userProgress?.find((progress: any) => progress.conceptId === prereq.id)?.mastery || 0,
        estimatedTimeToMastery: Math.round(((100 - (graph.userProgress?.find((progress: any) => 
          progress.conceptId === prereq.id)?.mastery || 0)) * 0.5)),
        order: 'prerequisite'
      })),
      // Then target concept
      {
        concept: targetNode,
        mastery: graph.userProgress?.find((progress: any) => progress.conceptId === conceptId)?.mastery || 0,
        estimatedTimeToMastery: Math.round(((100 - (graph.userProgress?.find((progress: any) => 
          progress.conceptId === conceptId)?.mastery || 0)) * 0.5)),
        order: 'target'
      }
    ];
    
    // Get resources for each concept in the path
    const pathWithResources = await Promise.all(
      learningPath.map(async (item) => {
        try {
          const resourcesResponse = await fetch(`http://localhost:5000/api/visual-resources/recommend/${item.concept.id}`, {
            headers: {
              'Cookie': req.headers.cookie || '' // Forward cookies for authentication
            }
          });
          
          if (resourcesResponse.ok) {
            const resources = await resourcesResponse.json();
            return {
              ...item,
              resources: resources.slice(0, 3) // Top 3 resources
            };
          }
          return {
            ...item,
            resources: []
          };
        } catch (error) {
          console.error(`Error fetching resources for concept ${item.concept.id}:`, error);
          return {
            ...item,
            resources: []
          };
        }
      })
    );
    
    res.json(pathWithResources);
  } catch (error) {
    console.error('Error generating learning path:', error);
    res.status(500).json({ error: 'Failed to generate learning path with resources' });
  }
});

export default router;
