import { Router, Request, Response } from 'express';
import { resourceGraphService } from '../services/ResourceGraphService';

/**
 * Routes for working with the resource graph
 */
const router = Router();

/**
 * Get curated resources for a concept
 * @route GET /concept/:conceptId
 */
router.get('/concept/:conceptId', async (request: Request, response: Response) => {
  const conceptId = parseInt(request.params.conceptId, 10);
  const limit = request.query.limit ? parseInt(request.query.limit as string, 10) : 10;
  
  try {
    const resources = await resourceGraphService.getCuratedResourcesForConcept(conceptId, limit);
    response.json({ resources });
  } catch (error) {
    console.error('Error getting curated resources:', error);
    response.status(500).json({ error: 'Failed to get curated resources' });
  }
});

/**
 * Discover and curate resources for a concept
 * @route POST /discover/:conceptId
 */
router.post('/discover/:conceptId', async (request: Request, response: Response) => {
  const conceptId = parseInt(request.params.conceptId, 10);
  const limit = request.query.limit ? parseInt(request.query.limit as string, 10) : 10;
  
  try {
    // Discover resources
    const curatedResources = await resourceGraphService.discoverAndCurateResourcesForConcept(conceptId, limit);
    
    // Save resources to database
    const resourceIds = await resourceGraphService.saveCuratedResources(curatedResources);
    
    response.json({ 
      message: `Discovered and saved ${resourceIds.length} resources`,
      resources: curatedResources
    });
  } catch (error) {
    console.error('Error discovering resources:', error);
    response.status(500).json({ error: 'Failed to discover resources' });
  }
});

/**
 * Get resource connections (graph edges)
 * @route GET /connections
 */
router.get('/connections', async (request: Request, response: Response) => {
  const resourceIdsParam = request.query.resourceIds as string;
  if (!resourceIdsParam) {
    return response.status(400).json({ error: 'resourceIds parameter is required' });
  }
  
  const resourceIds = resourceIdsParam.split(',').map(id => parseInt(id, 10));
  
  try {
    const connections = await resourceGraphService.getResourceConnections(resourceIds);
    response.json({ connections });
  } catch (error) {
    console.error('Error getting resource connections:', error);
    response.status(500).json({ error: 'Failed to get resource connections' });
  }
});

/**
 * Get resource graph for a set of concepts
 * @route GET /concepts
 */
router.get('/concepts', async (request: Request, response: Response) => {
  const conceptIdsParam = request.query.conceptIds as string;
  if (!conceptIdsParam) {
    return response.status(400).json({ error: 'conceptIds parameter is required' });
  }
  
  const conceptIds = conceptIdsParam.split(',').map(id => parseInt(id, 10));
  const limit = request.query.limit ? parseInt(request.query.limit as string, 10) : 5;
  
  try {
    // Get resources for each concept
    const resourcePromises = conceptIds.map(conceptId => 
      resourceGraphService.getCuratedResourcesForConcept(conceptId, limit)
    );
    
    const conceptResources = await Promise.all(resourcePromises);
    
    // Flatten and deduplicate resources
    const allResources = conceptResources.flat();
    const uniqueResources = Array.from(
      new Map(allResources.map(resource => [resource.id, resource])).values()
    );
    
    // Get connections between resources
    const resourceIds = uniqueResources.map(resource => resource.id);
    const connections = await resourceGraphService.getResourceConnections(resourceIds);
    
    response.json({ 
      resources: uniqueResources,
      connections
    });
  } catch (error) {
    console.error('Error getting resource graph:', error);
    response.status(500).json({ error: 'Failed to get resource graph' });
  }
});

export default router;
