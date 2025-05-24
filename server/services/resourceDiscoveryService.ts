import axios from 'axios';
import * as cheerio from 'cheerio';
import { Resource, ResourceType, ResourceQuality } from '@shared/schema';

interface DiscoverySource {
  name: string;
  type: 'search' | 'api' | 'academic';
  baseUrl: string;
  queryParams: Record<string, string>;
  apiKey?: string;
  resultSelector?: string;
  qualityIndicators?: string[];
}

interface DiscoveryResult {
  url: string;
  title: string;
  description: string;
  sourceType: ResourceType;
  qualityScore: number;
  visualContent: boolean;
  lastUpdated?: Date;
  estimatedTimeMinutes?: number;
  authorityScore?: number;
}

/**
 * Service for discovering high-quality learning resources across the web
 */
export class ResourceDiscoveryService {
  private sources: DiscoverySource[] = [
    {
      name: 'Google Scholar',
      type: 'academic',
      baseUrl: 'https://scholar.google.com/scholar',
      queryParams: {
        q: '',
        hl: 'en',
        as_sdt: '0,5'
      },
      resultSelector: '.gs_ri',
      qualityIndicators: ['.gs_fl a:nth-child(3)'] // Citation count
    },
    {
      name: 'YouTube Educational',
      type: 'api',
      baseUrl: 'https://www.googleapis.com/youtube/v3/search',
      queryParams: {
        part: 'snippet',
        maxResults: '15',
        q: '',
        type: 'video',
        videoCategoryId: '27', // Education category
        relevanceLanguage: 'en'
      },
      apiKey: process.env.YOUTUBE_API_KEY
    },
    {
      name: 'MIT OpenCourseWare',
      type: 'search',
      baseUrl: 'https://ocw.mit.edu/search/',
      queryParams: {
        q: ''
      },
      resultSelector: '.product-list-item',
      qualityIndicators: []
    },
    {
      name: 'Khan Academy',
      type: 'search',
      baseUrl: 'https://www.khanacademy.org/search',
      queryParams: {
        page_search_query: ''
      },
      resultSelector: '.result-container',
      qualityIndicators: []
    }
  ];
  
  /**
   * Discovers high-quality resources for a given concept
   * @param conceptName The concept to search for
   * @param limit Maximum number of results to return
   * @returns An array of discovered resources
   */
  async discoverResourcesForConcept(conceptName: string, limit = 20): Promise<DiscoveryResult[]> {
    const allResults: DiscoveryResult[] = [];
    
    // Discover resources from each source
    const discoveryPromises = this.sources.map(source => 
      this.discoverFromSource(source, conceptName)
    );
    
    // Combine and filter results
    const sourceResults = await Promise.all(discoveryPromises);
    sourceResults.forEach(results => {
      allResults.push(...results);
    });
    
    // Sort by quality score and limit
    return this.rankAndFilterResults(allResults, limit);
  }
  
  /**
   * Discovers resources from a specific source
   */
  private async discoverFromSource(source: DiscoverySource, conceptName: string): Promise<DiscoveryResult[]> {
    const results: DiscoveryResult[] = [];
    
    try {
      // Prepare request
      const params = { ...source.queryParams };
      if ('q' in params) {
        params.q = conceptName;
      } else if ('page_search_query' in params) {
        params.page_search_query = conceptName;
      }
      
      // Make request based on source type
      if (source.type === 'api') {
        return await this.fetchFromApi(source, params, conceptName);
      } else {
        return await this.scrapeFromWebsite(source, params, conceptName);
      }
    } catch (error) {
      console.error(`Error discovering resources from ${source.name}:`, error);
      return [];
    }
  }
  
  /**
   * Fetches resources from an API
   */
  private async fetchFromApi(source: DiscoverySource, params: Record<string, string>, conceptName: string): Promise<DiscoveryResult[]> {
    // Add API key if required
    if (source.apiKey) {
      params.key = source.apiKey;
    }
    
    // Make API request
    const response = await axios.get(source.baseUrl, { params });
    
    // Parse based on source name
    if (source.name === 'YouTube Educational') {
      return this.parseYouTubeResults(response.data, conceptName);
    }
    
    return [];
  }
  
  /**
   * Scrapes resources from a website
   */
  private async scrapeFromWebsite(source: DiscoverySource, params: Record<string, string>, conceptName: string): Promise<DiscoveryResult[]> {
    // Build URL with query parameters
    const url = new URL(source.baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    
    // Make request
    const response = await axios.get(url.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; KnowledgeWeave/1.0; +http://knowledgeweave.org)'
      }
    });
    
    // Parse HTML using cheerio
    const $ = cheerio.load(response.data);
    const results: DiscoveryResult[] = [];
    
    // Extract results based on source
    if (source.resultSelector) {
      $(source.resultSelector).each((i, el) => {
        const result = this.parseHtmlResult(source, $, el, conceptName);
        if (result) {
          results.push(result);
        }
      });
    }
    
    return results;
  }
  
  /**
   * Parses YouTube API results
   */
  private parseYouTubeResults(data: any, conceptName: string): DiscoveryResult[] {
    if (!data.items || !Array.isArray(data.items)) {
      return [];
    }
    
    return data.items.map(item => {
      // Calculate quality score based on relevance to concept
      const titleMatch = item.snippet.title.toLowerCase().includes(conceptName.toLowerCase()) ? 1 : 0;
      const descriptionMatch = item.snippet.description.toLowerCase().includes(conceptName.toLowerCase()) ? 0.5 : 0;
      const qualityScore = Math.min(10, (titleMatch + descriptionMatch) * 10);
      
      return {
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        title: item.snippet.title,
        description: item.snippet.description,
        sourceType: 'video',
        qualityScore,
        visualContent: true,
        lastUpdated: new Date(item.snippet.publishedAt),
        estimatedTimeMinutes: 10 // Default, would be replaced with actual video duration
      };
    });
  }
  
  /**
   * Parses HTML result
   */
  private parseHtmlResult(source: DiscoverySource, $: cheerio.CheerioAPI, element: cheerio.Element, conceptName: string): DiscoveryResult | null {
    let title = '';
    let url = '';
    let description = '';
    let qualityScore = 5; // Default score
    
    // Extract data based on source
    if (source.name === 'Google Scholar') {
      const titleEl = $(element).find('h3 a');
      title = titleEl.text().trim();
      url = titleEl.attr('href') || '';
      description = $(element).find('.gs_rs').text().trim();
      
      // Extract citation count for quality
      const citationText = $(element).find('.gs_fl a:nth-child(3)').text();
      const citationMatch = citationText.match(/Cited by (\d+)/);
      const citations = citationMatch ? parseInt(citationMatch[1]) : 0;
      qualityScore = Math.min(10, Math.log10(citations + 1) * 3);
    } else if (source.name === 'MIT OpenCourseWare') {
      const titleEl = $(element).find('.product-title a');
      title = titleEl.text().trim();
      url = titleEl.attr('href') || '';
      if (url && !url.startsWith('http')) {
        url = `https://ocw.mit.edu${url}`;
      }
      description = $(element).find('.product-description').text().trim();
      qualityScore = 8; // MIT content is generally high quality
    } else if (source.name === 'Khan Academy') {
      const titleEl = $(element).find('.result-title a');
      title = titleEl.text().trim();
      url = titleEl.attr('href') || '';
      if (url && !url.startsWith('http')) {
        url = `https://www.khanacademy.org${url}`;
      }
      description = $(element).find('.result-description').text().trim();
      qualityScore = 7; // Khan Academy content is generally good quality
    }
    
    if (!title || !url) {
      return null;
    }
    
    // Determine if content has visuals
    const visualContent = source.name === 'YouTube Educational' || 
                         source.name === 'Khan Academy' ||
                         url.includes('video') || 
                         url.includes('course');
    
    // Determine resource type
    const sourceType = this.determineResourceType(url, source.name);
    
    // Increase quality score if title contains concept name
    if (title.toLowerCase().includes(conceptName.toLowerCase())) {
      qualityScore += 1;
    }
    
    return {
      url,
      title,
      description,
      sourceType,
      qualityScore,
      visualContent,
      authorityScore: this.calculateAuthorityScore(url)
    };
  }
  
  /**
   * Determines the type of resource based on URL and source
   */
  private determineResourceType(url: string, sourceName: string): ResourceType {
    if (sourceName === 'YouTube Educational' || url.includes('youtube.com') || url.includes('vimeo.com')) {
      return 'video';
    }
    
    if (sourceName === 'Khan Academy' || url.includes('interactive') || url.includes('exercise') || url.includes('practice')) {
      return 'interactive';
    }
    
    if (url.includes('course') || url.includes('class') || url.includes('ocw.mit.edu')) {
      return 'course';
    }
    
    return 'article';
  }
  
  /**
   * Calculates an authority score based on domain reputation
   */
  private calculateAuthorityScore(url: string): number {
    const highAuthorityDomains = [
      'edu', 'mit.edu', 'stanford.edu', 'harvard.edu',
      'berkeley.edu', 'khanacademy.org', 'coursera.org',
      'edx.org', 'nature.com', 'science.org', 'acm.org'
    ];
    
    const mediumAuthorityDomains = [
      'wikipedia.org', 'github.com', 'youtube.com',
      'medium.com', 'dev.to', 'stackexchange.com'
    ];
    
    try {
      const domain = new URL(url).hostname;
      
      // Check if domain or its parts match high authority domains
      for (const authDomain of highAuthorityDomains) {
        if (domain.endsWith(authDomain)) {
          return 10;
        }
      }
      
      // Check medium authority domains
      for (const authDomain of mediumAuthorityDomains) {
        if (domain.endsWith(authDomain)) {
          return 7;
        }
      }
      
      // Default score
      return 5;
    } catch {
      return 3; // Invalid URL
    }
  }
  
  /**
   * Ranks and filters results based on quality and diversity
   */
  private rankAndFilterResults(results: DiscoveryResult[], limit: number): DiscoveryResult[] {
    // First sort by quality score
    results.sort((a, b) => b.qualityScore - a.qualityScore);
    
    // Ensure diversity of resource types
    const typeCountTarget = {
      video: Math.ceil(limit * 0.3),
      interactive: Math.ceil(limit * 0.2),
      article: Math.ceil(limit * 0.3),
      course: Math.ceil(limit * 0.2)
    };
    
    const selectedByType: Record<string, DiscoveryResult[]> = {
      video: [],
      interactive: [],
      article: [],
      course: []
    };
    
    // First pass: select highest quality for each type up to target
    for (const result of results) {
      const type = result.sourceType as string;
      if (selectedByType[type].length < typeCountTarget[type as keyof typeof typeCountTarget]) {
        selectedByType[type].push(result);
      }
    }
    
    // Combine and flatten
    let selectedResults = Object.values(selectedByType).flat();
    
    // If we don't have enough, fill remaining slots with highest quality regardless of type
    if (selectedResults.length < limit) {
      const remaining = limit - selectedResults.length;
      const selectedUrls = new Set(selectedResults.map(r => r.url));
      
      // Add remaining results, avoiding duplicates
      for (const result of results) {
        if (!selectedUrls.has(result.url)) {
          selectedResults.push(result);
          selectedUrls.add(result.url);
          
          if (selectedResults.length >= limit) {
            break;
          }
        }
      }
    }
    
    // Final sort by quality
    return selectedResults.sort((a, b) => b.qualityScore - a.qualityScore).slice(0, limit);
  }
  
  /**
   * Converts discovery results to Resource objects for storage
   */
  async convertToResources(results: DiscoveryResult[], conceptId: number): Promise<Resource[]> {
    return results.map((result, index) => ({
      id: 0, // Will be assigned by database
      title: result.title,
      url: result.url,
      description: result.description,
      type: result.sourceType,
      conceptId,
      quality: this.mapQualityScore(result.qualityScore),
      hasVisualContent: result.visualContent,
      estimatedTimeMinutes: result.estimatedTimeMinutes || this.estimateTimeRequired(result),
      dateAdded: new Date(),
      dateUpdated: result.lastUpdated || new Date(),
      viewCount: 0,
      completionCount: 0,
      averageRating: 0,
      ratingCount: 0,
      position: index // Initial position in learning path
    }));
  }
  
  /**
   * Maps quality score to ResourceQuality enum
   */
  private mapQualityScore(score: number): ResourceQuality {
    if (score >= 8) return 'high';
    if (score >= 5) return 'medium';
    return 'low';
  }
  
  /**
   * Estimates time required to consume a resource based on type and other factors
   */
  private estimateTimeRequired(result: DiscoveryResult): number {
    switch (result.sourceType) {
      case 'video':
        return 15; // Default for videos without known duration
      case 'interactive':
        return 30; // Interactive content typically takes more time
      case 'course':
        return 180; // Courses are longer-form content
      case 'article':
      default:
        // Estimate based on description length
        const wordCount = result.description.split(/\s+/).length;
        // Average reading speed is ~250 words per minute
        return Math.max(5, Math.ceil(wordCount / 50));
    }
  }
}

export const resourceDiscoveryService = new ResourceDiscoveryService();
