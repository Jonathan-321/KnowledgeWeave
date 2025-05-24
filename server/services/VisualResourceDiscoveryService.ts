import axios from 'axios';
import * as cheerio from 'cheerio';
import { JSDOM } from 'jsdom';
import { ResourceQuality, DifficultyLevel } from '@shared/enhancedSchema';
import { EnhancedResource } from '@shared/enhancedSchemaTypes';
import { db } from '../db';
import { enhancedResources, resources, resourceConcepts } from '@shared/enhancedSchema';
import { eq } from 'drizzle-orm';

/**
 * Interface for scraper configuration targeting high-quality visual resources
 */
interface VisualResourceScraperConfig {
  name: string;
  baseUrl: string;
  resourceType: 'video' | 'article' | 'interactive' | 'course' | 'book';
  searchEndpoint?: string;
  searchParams: Record<string, string>;
  resultSelector: string;
  titleSelector: string;
  descriptionSelector: string;
  imageSelector?: string;
  authorSelector?: string;
  dateSelector?: string;
  contentSelector?: string;
  qualityIndicators: {
    authoritySelectors?: string[];  // For author credentials, publication reputation
    visualRichnessSelectors?: string[]; // For images, videos, diagrams
    interactivitySelectors?: string[]; // For interactive elements
    codeSelectors?: string[]; // For code snippets
    mathSelectors?: string[]; // For mathematical content
  };
  requiresAPI?: boolean;
  apiKey?: string;
}

/**
 * Represents a discovered resource with quality metrics
 */
export interface DiscoveredResource {
  url: string;
  title: string;
  description: string;
  sourceType: 'video' | 'article' | 'interactive' | 'course' | 'book';
  sourceQuality: ResourceQuality;
  visualRichness: number; // 0-100
  authorityScore: number; // 0-100
  engagementScore: number; // 0-100
  freshnessScore: number; // 0-100
  estimatedTimeMinutes: number;
  difficultyLevel: DifficultyLevel;
  author?: string;
  publishDate?: Date;
  imageUrl?: string;
  sourceName: string;
  learningStyleFit: {
    visual: number; // 0-100
    auditory: number; // 0-100
    reading: number; // 0-100
    kinesthetic: number; // 0-100
  };
}

/**
 * Enhanced service for discovering high-quality visual learning resources
 */
export class VisualResourceDiscoveryService {
  private scraperConfigs: VisualResourceScraperConfig[] = [
    // Visual-focused educational platforms
    {
      name: '3Blue1Brown',
      baseUrl: 'https://www.3blue1brown.com',
      resourceType: 'video',
      searchEndpoint: '/topics',
      searchParams: { q: '' },
      resultSelector: '.video-item',
      titleSelector: '.video-title',
      descriptionSelector: '.video-description',
      imageSelector: '.video-thumbnail img',
      authorSelector: '.video-author',
      dateSelector: '.video-date',
      qualityIndicators: {
        visualRichnessSelectors: ['.video-thumbnail'],
        mathSelectors: ['.has-math-content']
      }
    },
    {
      name: 'Observable',
      baseUrl: 'https://observablehq.com',
      resourceType: 'interactive',
      searchEndpoint: '/search',
      searchParams: { query: '' },
      resultSelector: '.notebook-item',
      titleSelector: '.notebook-title',
      descriptionSelector: '.notebook-description',
      imageSelector: '.notebook-thumbnail',
      authorSelector: '.notebook-author',
      dateSelector: '.notebook-date',
      qualityIndicators: {
        interactivitySelectors: ['.js-enabled', '.d3-visualization'],
        visualRichnessSelectors: ['.visualization-thumbnail'],
        codeSelectors: ['.code-block']
      }
    },
    {
      name: 'Distill',
      baseUrl: 'https://distill.pub',
      resourceType: 'article',
      resultSelector: '.post',
      titleSelector: '.post-title',
      descriptionSelector: '.post-excerpt',
      imageSelector: '.post-image',
      authorSelector: '.post-author',
      dateSelector: '.post-date',
      searchParams: { topic: '' },
      qualityIndicators: {
        visualRichnessSelectors: ['.post-visualization', '.d-figure'],
        authoritySelectors: ['.author-affiliation'],
        mathSelectors: ['.katex', 'mjx-container']
      }
    },
    {
      name: 'Khan Academy',
      baseUrl: 'https://www.khanacademy.org',
      resourceType: 'course',
      searchEndpoint: '/search',
      searchParams: { page_search_query: '' },
      resultSelector: '.result-container',
      titleSelector: '.result-title',
      descriptionSelector: '.result-description',
      imageSelector: '.result-thumbnail',
      qualityIndicators: {
        visualRichnessSelectors: ['.video-thumbnail', '.exercise-thumbnail'],
        interactivitySelectors: ['.interactive-content']
      }
    },
    {
      name: 'MIT OpenCourseWare',
      baseUrl: 'https://ocw.mit.edu',
      resourceType: 'course',
      searchEndpoint: '/search/',
      searchParams: { q: '' },
      resultSelector: '.search-result',
      titleSelector: '.course-title',
      descriptionSelector: '.course-description',
      imageSelector: '.course-thumbnail',
      authorSelector: '.course-instructor',
      qualityIndicators: {
        authoritySelectors: ['.mit-faculty'],
        visualRichnessSelectors: ['.has-video-lectures', '.has-visualizations']
      }
    },
    {
      name: 'YouTube Educational',
      baseUrl: 'https://www.googleapis.com/youtube/v3/search',
      resourceType: 'video',
      searchParams: {
        part: 'snippet',
        maxResults: '15',
        q: '',
        type: 'video',
        videoCategoryId: '27', // Education category
        relevanceLanguage: 'en'
      },
      resultSelector: 'items',
      titleSelector: 'snippet.title',
      descriptionSelector: 'snippet.description',
      imageSelector: 'snippet.thumbnails.high.url',
      dateSelector: 'snippet.publishedAt',
      qualityIndicators: {},
      requiresAPI: true,
      apiKey: process.env.YOUTUBE_API_KEY
    },
    {
      name: 'Towards Data Science',
      baseUrl: 'https://towardsdatascience.com',
      resourceType: 'article',
      searchEndpoint: '/search',
      searchParams: { q: '' },
      resultSelector: '.js-postListItem',
      titleSelector: '.graf--title',
      descriptionSelector: '.graf--subtitle',
      imageSelector: '.graf-image',
      authorSelector: '.ds-link',
      dateSelector: '.ui-caption',
      qualityIndicators: {
        visualRichnessSelectors: ['.graf--figure', '.graf--chart'],
        codeSelectors: ['.graf--pre', '.graf--code'],
        mathSelectors: ['.katex']
      }
    }
  ];

  /**
   * Discovers high-quality resources with a focus on visual content for a given concept
   * @param conceptName The concept to search for
   * @param limit Maximum number of results to return
   * @returns Array of discovered resources
   */
  async discoverVisualResourcesForConcept(conceptName: string, limit = 20): Promise<DiscoveredResource[]> {
    const allResults: DiscoveredResource[] = [];
    
    // Discover resources from each source
    const discoveryPromises = this.scraperConfigs.map(config => 
      this.discoverFromSource(config, conceptName)
        .catch(error => {
          console.error(`Error discovering resources from ${config.name}:`, error);
          return [];
        })
    );
    
    // Combine and filter results
    const sourceResults = await Promise.all(discoveryPromises);
    sourceResults.forEach(results => {
      allResults.push(...results);
    });
    
    // Sort by visual richness and quality, then limit
    return this.rankAndFilterResults(allResults, limit);
  }

  /**
   * Discovers resources from a specific source
   */
  private async discoverFromSource(config: VisualResourceScraperConfig, conceptName: string): Promise<DiscoveredResource[]> {
    if (config.requiresAPI) {
      return this.fetchFromAPI(config, conceptName);
    } else {
      return this.scrapeFromWebsite(config, conceptName);
    }
  }

  /**
   * Fetches resources from an API-based source
   */
  private async fetchFromAPI(config: VisualResourceScraperConfig, conceptName: string): Promise<DiscoveredResource[]> {
    // Prepare request parameters
    const params = { ...config.searchParams };
    
    // Set search query parameter
    Object.keys(params).forEach(key => {
      if (params[key] === '') {
        params[key] = conceptName;
      }
    });
    
    // Add API key if required
    if (config.apiKey) {
      params.key = config.apiKey;
    }
    
    // Make API request
    const response = await axios.get(config.baseUrl, { params });
    
    // Parse results based on source
    if (config.name === 'YouTube Educational') {
      return this.parseYouTubeResults(response.data, config, conceptName);
    }
    
    return [];
  }

  /**
   * Scrapes resources from a website
   */
  private async scrapeFromWebsite(config: VisualResourceScraperConfig, conceptName: string): Promise<DiscoveredResource[]> {
    // Build URL with search parameters
    const url = new URL(config.searchEndpoint ? `${config.baseUrl}${config.searchEndpoint}` : config.baseUrl);
    
    // Add search parameters
    Object.entries(config.searchParams).forEach(([key, value]) => {
      url.searchParams.append(key, value === '' ? conceptName : value);
    });
    
    // Make request with browser-like headers
    const response = await axios.get(url.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; KnowledgeWeaveBot/1.0; +https://knowledgeweave.org)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });
    
    // Parse HTML
    const $ = cheerio.load(response.data);
    const results: DiscoveredResource[] = [];
    
    // Extract results
    $(config.resultSelector).each((i, el) => {
      if (i >= 10) return; // Limit to first 10 results per source for efficiency
      
      try {
        const title = $(el).find(config.titleSelector).first().text().trim();
        const description = $(el).find(config.descriptionSelector).first().text().trim();
        
        // Skip if title or description is empty
        if (!title || !description) return;
        
        // Get URL - either from href attribute or by constructing it
        let url = '';
        const linkElement = $(el).find('a').first();
        if (linkElement.length > 0) {
          const href = linkElement.attr('href');
          if (href) {
            url = href.startsWith('http') ? href : `${config.baseUrl}${href.startsWith('/') ? '' : '/'}${href}`;
          }
        }
        
        if (!url) return;
        
        // Extract image URL if available
        let imageUrl: string | undefined;
        if (config.imageSelector) {
          const imgElement = $(el).find(config.imageSelector).first();
          const imgSrc = imgElement.attr('src');
          if (imgSrc) {
            imageUrl = imgSrc.startsWith('http') ? imgSrc : `${config.baseUrl}${imgSrc.startsWith('/') ? '' : '/'}${imgSrc}`;
          }
        }
        
        // Extract author if available
        let author: string | undefined;
        if (config.authorSelector) {
          author = $(el).find(config.authorSelector).first().text().trim() || undefined;
        }
        
        // Extract date if available
        let publishDate: Date | undefined;
        if (config.dateSelector) {
          const dateText = $(el).find(config.dateSelector).first().text().trim();
          if (dateText) {
            try {
              publishDate = new Date(dateText);
            } catch (e) {
              // Ignore date parsing errors
            }
          }
        }
        
        // Calculate quality metrics
        const visualRichness = this.calculateVisualRichness($, el, config);
        const authorityScore = this.calculateAuthorityScore($, el, config, author);
        const freshnessScore = this.calculateFreshnessScore(publishDate);
        
        // Create resource object
        const resource: DiscoveredResource = {
          url,
          title,
          description,
          sourceType: config.resourceType,
          sourceQuality: this.determineQuality(visualRichness, authorityScore),
          visualRichness,
          authorityScore,
          engagementScore: this.calculateEngagementScore(visualRichness, title, description),
          freshnessScore,
          estimatedTimeMinutes: this.estimateTimeToConsume(config.resourceType, description.length),
          difficultyLevel: this.estimateDifficultyLevel(description),
          author,
          publishDate,
          imageUrl,
          sourceName: config.name,
          learningStyleFit: this.calculateLearningStyleFit(config.resourceType, visualRichness)
        };
        
        results.push(resource);
      } catch (error) {
        console.error(`Error parsing result from ${config.name}:`, error);
      }
    });
    
    return results;
  }

  /**
   * Parses YouTube API results
   */
  private parseYouTubeResults(data: any, config: VisualResourceScraperConfig, conceptName: string): DiscoveredResource[] {
    if (!data.items || !Array.isArray(data.items)) {
      return [];
    }
    
    return data.items.map((item: any) => {
      // Calculate quality metrics
      const title = item.snippet.title;
      const description = item.snippet.description;
      
      // Check relevance to the concept
      const titleMatch = title.toLowerCase().includes(conceptName.toLowerCase()) ? 1 : 0;
      const descriptionMatch = description.toLowerCase().includes(conceptName.toLowerCase()) ? 0.5 : 0;
      const relevanceScore = (titleMatch + descriptionMatch) * 50;
      
      // Visual richness is high for YouTube videos
      const visualRichness = 85;
      
      // Authority based on channel metrics (would need additional API calls in production)
      const authorityScore = 70;
      
      // Calculate freshness based on publish date
      const publishDate = new Date(item.snippet.publishedAt);
      const freshnessScore = this.calculateFreshnessScore(publishDate);
      
      return {
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        title,
        description,
        sourceType: config.resourceType,
        sourceQuality: this.determineQuality(visualRichness, authorityScore),
        visualRichness,
        authorityScore,
        engagementScore: this.calculateEngagementScore(visualRichness, title, description),
        freshnessScore,
        estimatedTimeMinutes: 10, // Default for videos, would need additional API calls for actual duration
        difficultyLevel: this.estimateDifficultyLevel(description),
        author: item.snippet.channelTitle,
        publishDate,
        imageUrl: item.snippet.thumbnails.high?.url,
        sourceName: 'YouTube',
        learningStyleFit: {
          visual: 90,
          auditory: 85,
          reading: 30,
          kinesthetic: 40
        }
      };
    });
  }

  /**
   * Calculates visual richness score based on presence of visual elements
   */
  private calculateVisualRichness($: cheerio.CheerioAPI, element: cheerio.Element, config: VisualResourceScraperConfig): number {
    let score = 50; // Base score
    
    // Check for presence of visual elements
    const visualSelectors = config.qualityIndicators.visualRichnessSelectors || [];
    visualSelectors.forEach(selector => {
      if ($(element).find(selector).length > 0) {
        score += 10;
      }
    });
    
    // Check for interactive elements
    const interactiveSelectors = config.qualityIndicators.interactivitySelectors || [];
    interactiveSelectors.forEach(selector => {
      if ($(element).find(selector).length > 0) {
        score += 10;
      }
    });
    
    // Adjust based on resource type
    switch (config.resourceType) {
      case 'video':
        score += 20;
        break;
      case 'interactive':
        score += 25;
        break;
      case 'course':
        score += 10;
        break;
      case 'article':
        // No adjustment
        break;
    }
    
    // Ensure score is between 0 and 100
    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculates authority score based on source and author
   */
  private calculateAuthorityScore($: cheerio.CheerioAPI, element: cheerio.Element, config: VisualResourceScraperConfig, author?: string): number {
    let score = 60; // Base score
    
    // Adjust based on source
    switch (config.name) {
      case 'MIT OpenCourseWare':
      case 'Khan Academy':
      case 'Distill':
        score += 30;
        break;
      case '3Blue1Brown':
      case 'Observable':
        score += 25;
        break;
      case 'Towards Data Science':
        score += 15;
        break;
      default:
        // No adjustment
    }
    
    // Check for authority indicators
    const authoritySelectors = config.qualityIndicators.authoritySelectors || [];
    authoritySelectors.forEach(selector => {
      if ($(element).find(selector).length > 0) {
        score += 5;
      }
    });
    
    // Presence of author is a positive signal
    if (author) {
      score += 5;
    }
    
    // Ensure score is between 0 and 100
    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculates freshness score based on publish date
   */
  private calculateFreshnessScore(publishDate?: Date): number {
    if (!publishDate) return 50; // Default if no date
    
    const now = new Date();
    const ageInDays = (now.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24);
    
    // Fresher content gets higher score
    if (ageInDays < 30) return 100; // Last month
    if (ageInDays < 90) return 90; // Last quarter
    if (ageInDays < 180) return 80; // Last 6 months
    if (ageInDays < 365) return 70; // Last year
    if (ageInDays < 730) return 60; // Last 2 years
    if (ageInDays < 1095) return 50; // Last 3 years
    
    return Math.max(30, 100 - Math.floor(ageInDays / 100)); // Older content gradually loses freshness
  }

  /**
   * Calculates engagement score based on various factors
   */
  private calculateEngagementScore(visualRichness: number, title: string, description: string): number {
    let score = 0;
    
    // Visual content is engaging
    score += visualRichness * 0.5;
    
    // Title characteristics
    if (title.includes('?')) score += 5; // Questions engage users
    if (title.includes('How to') || title.includes('Guide') || title.includes('Tutorial')) score += 5;
    if (title.length > 10 && title.length < 70) score += 5; // Good title length
    
    // Description characteristics
    if (description.length > 100) score += 10; // Substantial description
    if (description.includes('interactive') || description.includes('hands-on')) score += 5;
    if (description.includes('learn') || description.includes('understand')) score += 5;
    
    // Ensure score is between 0 and 100
    return Math.min(100, Math.max(0, score));
  }

  /**
   * Estimates time to consume content
   */
  private estimateTimeToConsume(resourceType: string, descriptionLength: number): number {
    switch (resourceType) {
      case 'video':
        return 10; // Default for videos
      case 'article':
        // Rough estimate based on description length
        return Math.max(5, Math.min(30, Math.ceil(descriptionLength / 100)));
      case 'interactive':
        return 15; // Default for interactive content
      case 'course':
        return 60; // Default for courses (just one session)
      case 'book':
        return 240; // Default for books (estimated reading time)
      default:
        return 15;
    }
  }

  /**
   * Estimates difficulty level based on content description
   */
  private estimateDifficultyLevel(description: string): DifficultyLevel {
    const lowerDesc = description.toLowerCase();
    
    // Check for beginner indicators
    if (
      lowerDesc.includes('introduction') || 
      lowerDesc.includes('beginner') || 
      lowerDesc.includes('basic') || 
      lowerDesc.includes('start') || 
      lowerDesc.includes('fundamental')
    ) {
      return 'beginner';
    }
    
    // Check for advanced indicators
    if (
      lowerDesc.includes('advanced') || 
      lowerDesc.includes('expert') || 
      lowerDesc.includes('in-depth') || 
      lowerDesc.includes('deep dive') || 
      lowerDesc.includes('complex')
    ) {
      return 'advanced';
    }
    
    // Default to intermediate
    return 'intermediate';
  }

  /**
   * Determines overall quality based on various metrics
   */
  private determineQuality(visualRichness: number, authorityScore: number): ResourceQuality {
    const combinedScore = (visualRichness * 0.6) + (authorityScore * 0.4);
    
    if (combinedScore >= 80) return 'high';
    if (combinedScore >= 50) return 'medium';
    return 'low';
  }

  /**
   * Calculates learning style fit based on resource type and characteristics
   */
  private calculateLearningStyleFit(resourceType: string, visualRichness: number): { visual: number; auditory: number; reading: number; kinesthetic: number; } {
    switch (resourceType) {
      case 'video':
        return {
          visual: Math.min(100, visualRichness + 10),
          auditory: 85,
          reading: 40,
          kinesthetic: 30
        };
      case 'interactive':
        return {
          visual: 80,
          auditory: 40,
          reading: 60,
          kinesthetic: 90
        };
      case 'article':
        return {
          visual: visualRichness,
          auditory: 30,
          reading: 90,
          kinesthetic: 20
        };
      case 'course':
        return {
          visual: 70,
          auditory: 75,
          reading: 70,
          kinesthetic: 60
        };
      case 'book':
        return {
          visual: Math.min(80, visualRichness),
          auditory: 20,
          reading: 95,
          kinesthetic: 30
        };
      default:
        return {
          visual: 60,
          auditory: 60,
          reading: 60,
          kinesthetic: 60
        };
    }
  }

  /**
   * Ranks and filters results based on quality and relevance
   */
  private rankAndFilterResults(results: DiscoveredResource[], limit: number): DiscoveredResource[] {
    // Sort by quality metrics (emphasizing visual richness)
    return results
      .sort((a, b) => {
        // Calculate weighted score for ranking
        const scoreA = (
          (a.visualRichness * 0.4) + 
          (a.authorityScore * 0.3) + 
          (a.engagementScore * 0.2) + 
          (a.freshnessScore * 0.1)
        );
        
        const scoreB = (
          (b.visualRichness * 0.4) + 
          (b.authorityScore * 0.3) + 
          (b.engagementScore * 0.2) + 
          (b.freshnessScore * 0.1)
        );
        
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  /**
   * Saves discovered resources to the database
   */
  async saveDiscoveredResources(conceptId: number, discoveredResources: DiscoveredResource[]): Promise<number[]> {
    const savedResourceIds: number[] = [];
    
    for (const discovered of discoveredResources) {
      try {
        // First, create a base resource
        const [baseResource] = await db.insert(resources)
          .values({
            title: discovered.title,
            url: discovered.url,
            type: discovered.sourceType,
            userId: null, // System-generated
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning({ id: resources.id });
        
        if (!baseResource) continue;
        
        // Then create enhanced resource with detailed metadata
        const [enhancedResource] = await db.insert(enhancedResources)
          .values({
            resourceId: baseResource.id,
            title: discovered.title,
            url: discovered.url,
            description: discovered.description,
            type: discovered.sourceType,
            quality: discovered.sourceQuality,
            visualRichness: discovered.visualRichness,
            engagementScore: discovered.engagementScore,
            authorityScore: discovered.authorityScore,
            freshnessScore: discovered.freshnessScore,
            difficultyLevel: discovered.difficultyLevel,
            estimatedTimeMinutes: discovered.estimatedTimeMinutes,
            visualLearningFit: discovered.learningStyleFit.visual,
            auditoryLearningFit: discovered.learningStyleFit.auditory,
            readingLearningFit: discovered.learningStyleFit.reading,
            kinestheticLearningFit: discovered.learningStyleFit.kinesthetic,
            author: discovered.author,
            imageUrl: discovered.imageUrl,
            source: discovered.sourceName,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning({ id: enhancedResources.id });
        
        if (!enhancedResource) continue;
        
        // Create relationship between resource and concept
        await db.insert(resourceConcepts)
          .values({
            conceptId,
            resourceId: enhancedResource.id,
            relevance: 80, // Default high relevance since it was found for this concept
            createdAt: new Date(),
            updatedAt: new Date()
          });
        
        savedResourceIds.push(enhancedResource.id);
      } catch (error) {
        console.error('Error saving discovered resource:', error);
      }
    }
    
    return savedResourceIds;
  }
}

export const visualResourceDiscoveryService = new VisualResourceDiscoveryService();
