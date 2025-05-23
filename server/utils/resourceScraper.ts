/**
 * Resource Scraper Utility
 * 
 * This utility provides functions to discover, validate, and analyze learning resources
 * from various sources on the web. It supports searching for resources, evaluating their
 * quality, and extracting metadata.
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { ResourceType } from '@shared/schema';

// OpenGraph metadata interface
interface OpenGraphMetadata {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  site_name?: string;
}

// Interface for discovered resources
export interface DiscoveredResource {
  title: string;
  url: string;
  description: string;
  type: ResourceType;
  sourceAuthority: number;
  visualRichness: number;
  interactivity: number;
  qualityScore: number;
  imageUrl?: string;
  tags: string[];
}

// Configuration for different search providers
const searchProviders = {
  youtube: {
    name: 'YouTube',
    searchUrl: 'https://www.youtube.com/results?search_query=',
    urlPattern: /youtube\.com|youtu\.be/,
    type: 'video' as ResourceType,
    sourceAuthority: 85,
    defaultVisualRichness: 85,
    defaultInteractivity: 20
  },
  wikipedia: {
    name: 'Wikipedia',
    searchUrl: 'https://en.wikipedia.org/wiki/Special:Search?search=',
    urlPattern: /wikipedia\.org/,
    type: 'article' as ResourceType,
    sourceAuthority: 90,
    defaultVisualRichness: 60,
    defaultInteractivity: 30
  },
  khan: {
    name: 'Khan Academy',
    searchUrl: 'https://www.khanacademy.org/search?referer=%2F&page_search_query=',
    urlPattern: /khanacademy\.org/,
    type: 'course' as ResourceType,
    sourceAuthority: 92,
    defaultVisualRichness: 75,
    defaultInteractivity: 70
  },
  coursera: {
    name: 'Coursera',
    searchUrl: 'https://www.coursera.org/search?query=',
    urlPattern: /coursera\.org/,
    type: 'course' as ResourceType,
    sourceAuthority: 93,
    defaultVisualRichness: 75,
    defaultInteractivity: 80
  },
  medium: {
    name: 'Medium',
    searchUrl: 'https://medium.com/search?q=',
    urlPattern: /medium\.com/,
    type: 'article' as ResourceType,
    sourceAuthority: 80,
    defaultVisualRichness: 70,
    defaultInteractivity: 40
  },
  github: {
    name: 'GitHub',
    searchUrl: 'https://github.com/search?q=',
    urlPattern: /github\.com/,
    type: 'tutorial' as ResourceType,
    sourceAuthority: 85,
    defaultVisualRichness: 60,
    defaultInteractivity: 60
  }
};

/**
 * Detect the resource type based on URL patterns
 */
export function detectResourceType(url: string): ResourceType {
  if (url.match(/youtube\.com|youtu\.be|vimeo\.com/i)) {
    return 'video';
  } else if (url.match(/coursera\.org|udemy\.com|edx\.org|khanacademy\.org/i)) {
    return 'course';
  } else if (url.match(/github\.io|playground|visualizer|interactive|demo/i)) {
    return 'interactive';
  } else if (url.match(/github\.com|stack\s*overflow|tutorial|\.dev|\.io/i)) {
    return 'tutorial';
  } else if (url.match(/wikipedia\.org|medium\.com|\.edu|books|pdf/i)) {
    return 'article';
  } else {
    return 'article'; // Default type
  }
}

/**
 * Extract OpenGraph metadata from HTML
 */
function extractOpenGraphMetadata(html: string): OpenGraphMetadata {
  const $ = cheerio.load(html);
  const metadata: OpenGraphMetadata = {};

  // Extract Open Graph metadata
  $('meta[property^="og:"]').each((_, element) => {
    const property = $(element).attr('property')?.replace('og:', '');
    const content = $(element).attr('content');
    
    if (property && content) {
      metadata[property as keyof OpenGraphMetadata] = content;
    }
  });

  // If og:title is not available, try the page title
  if (!metadata.title) {
    metadata.title = $('title').text();
  }

  // If og:description is not available, try the meta description
  if (!metadata.description) {
    metadata.description = $('meta[name="description"]').attr('content') || '';
  }

  return metadata;
}

/**
 * Calculate a quality score for a resource based on various factors
 */
function calculateQualityScore(resource: Partial<DiscoveredResource>): number {
  // Default values if missing
  const sourceAuthority = resource.sourceAuthority || 70;
  const visualRichness = resource.visualRichness || 60;
  const interactivity = resource.interactivity || 40;
  
  // Weighted scoring
  const score = (sourceAuthority * 0.4) + 
                (visualRichness * 0.3) + 
                (interactivity * 0.3);
  
  // Clamp between 0-100
  return Math.min(Math.max(Math.round(score), 0), 100);
}

/**
 * Analyze a URL to extract metadata and evaluate the resource
 */
export async function analyzeResourceUrl(url: string): Promise<DiscoveredResource | null> {
  try {
    // Fetch the URL content
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 5000
    });

    // Extract metadata
    const metadata = extractOpenGraphMetadata(response.data);
    
    // Determine resource type
    const type = detectResourceType(url);
    
    // Initialize resource with extracted data
    const resource: DiscoveredResource = {
      title: metadata.title || 'Untitled Resource',
      url: url,
      description: metadata.description || 'No description available',
      type: type,
      sourceAuthority: 75, // Default authority score
      visualRichness: 70, // Default visual richness
      interactivity: type === 'interactive' ? 90 : (type === 'video' ? 70 : 40), // Estimate interactivity based on type
      qualityScore: 0, // Will be calculated
      imageUrl: metadata.image,
      tags: []
    };
    
    // Update source authority based on domain reputation
    const domain = new URL(url).hostname;
    
    // Adjust source authority based on domain
    if (domain.includes('edu') || domain.includes('gov')) {
      resource.sourceAuthority = 90;
    } else if (
      domain.includes('youtube.com') || 
      domain.includes('coursera.org') || 
      domain.includes('khanacademy.org') ||
      domain.includes('wikipedia.org')
    ) {
      resource.sourceAuthority = 85;
    }
    
    // Generate tags from title and description
    const combinedText = `${resource.title} ${resource.description}`.toLowerCase();
    const potentialTags = [
      'machine learning', 'deep learning', 'neural networks', 'ai', 
      'python', 'tensorflow', 'pytorch', 'javascript', 'react', 
      'tutorial', 'course', 'beginners', 'advanced', 'interactive',
      'visualization', 'data science', 'statistics', 'mathematics',
      'programming', 'computer science', 'algorithm', 'database'
    ];
    
    resource.tags = potentialTags.filter(tag => combinedText.includes(tag));
    
    // Calculate overall quality score
    resource.qualityScore = calculateQualityScore(resource);
    
    return resource;
    
  } catch (error) {
    console.error(`Error analyzing resource URL ${url}:`, error);
    return null;
  }
}

/**
 * Search for learning resources based on keywords
 */
export async function searchResources(keyword: string, limit: number = 5): Promise<DiscoveredResource[]> {
  const resources: DiscoveredResource[] = [];
  const searchQuery = encodeURIComponent(keyword);
  
  try {
    // Use a search API or service here
    // For now, we'll simulate results with some educational resources related to the keyword
    
    // This would be replaced with actual API calls in production
    const simulatedUrls = [
      `https://www.youtube.com/results?search_query=${searchQuery}`,
      `https://en.wikipedia.org/wiki/Special:Search?search=${searchQuery}`,
      `https://www.khanacademy.org/search?referer=%2F&page_search_query=${searchQuery}`,
      `https://github.com/search?q=${searchQuery}`,
      `https://medium.com/search?q=${searchQuery}`
    ];
    
    // In a real implementation, you would parse these search results
    // and extract the actual resource URLs
    
    // Since we can't actually scrape search results here, we'll return some predefined resources
    // based on common topics in machine learning and programming
    
    const predefinedResources: DiscoveredResource[] = [
      {
        title: `${keyword} - YouTube Tutorial`,
        url: `https://www.youtube.com/watch?v=example-${keyword.replace(/\s+/g, '-')}`,
        description: `Learn about ${keyword} in this comprehensive video tutorial.`,
        type: 'video',
        sourceAuthority: 85,
        visualRichness: 85,
        interactivity: 20,
        qualityScore: 83,
        imageUrl: 'https://example.com/thumbnail.jpg',
        tags: [keyword.toLowerCase(), 'tutorial', 'video']
      },
      {
        title: `${keyword} Interactive Tutorial`,
        url: `https://interactive.example.com/${keyword.replace(/\s+/g, '-')}`,
        description: `An interactive learning experience for mastering ${keyword} concepts.`,
        type: 'interactive',
        sourceAuthority: 80,
        visualRichness: 90,
        interactivity: 95,
        qualityScore: 88,
        imageUrl: 'https://example.com/interactive.jpg',
        tags: [keyword.toLowerCase(), 'interactive', 'tutorial']
      },
      {
        title: `${keyword} Comprehensive Guide`,
        url: `https://guide.example.com/${keyword.replace(/\s+/g, '-')}`,
        description: `A detailed article covering all aspects of ${keyword} with examples and code snippets.`,
        type: 'article',
        sourceAuthority: 85,
        visualRichness: 70,
        interactivity: 40,
        qualityScore: 82,
        imageUrl: 'https://example.com/article.jpg',
        tags: [keyword.toLowerCase(), 'guide', 'article', 'comprehensive']
      },
      {
        title: `${keyword} Course for Beginners`,
        url: `https://courses.example.com/${keyword.replace(/\s+/g, '-')}`,
        description: `A structured course to take you from beginner to expert in ${keyword}.`,
        type: 'course',
        sourceAuthority: 90,
        visualRichness: 80,
        interactivity: 75,
        qualityScore: 86,
        imageUrl: 'https://example.com/course.jpg',
        tags: [keyword.toLowerCase(), 'course', 'beginners']
      },
      {
        title: `Practical ${keyword} Projects`,
        url: `https://github.com/example/${keyword.replace(/\s+/g, '-')}-projects`,
        description: `Hands-on projects to apply your knowledge of ${keyword} in real-world scenarios.`,
        type: 'tutorial',
        sourceAuthority: 85,
        visualRichness: 60,
        interactivity: 70,
        qualityScore: 80,
        imageUrl: 'https://example.com/projects.jpg',
        tags: [keyword.toLowerCase(), 'projects', 'practical', 'github']
      }
    ];
    
    return predefinedResources.slice(0, limit);
    
  } catch (error) {
    console.error(`Error searching resources for ${keyword}:`, error);
    return [];
  }
}

/**
 * Evaluate a list of resources and rank them by quality
 */
export function rankResources(resources: DiscoveredResource[]): DiscoveredResource[] {
  return [...resources].sort((a, b) => b.qualityScore - a.qualityScore);
}

/**
 * Discover and analyze resources for a given concept
 */
export async function discoverResourcesForConcept(
  conceptName: string, 
  limit: number = 5
): Promise<DiscoveredResource[]> {
  try {
    const resources = await searchResources(conceptName, limit);
    return rankResources(resources);
  } catch (error) {
    console.error(`Error discovering resources for concept ${conceptName}:`, error);
    return [];
  }
}
