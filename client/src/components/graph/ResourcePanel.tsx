import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { EnhancedGraphNode } from '@shared/enhancedSchema';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExternalLink, ThumbsUp, ThumbsDown, Clock, Star, BookOpen, Play, CheckCircle, ArrowRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ResourcePanelProps {
  node: EnhancedGraphNode | null;
  onClose?: () => void;
  userId?: number;
}

interface Resource {
  id: number;
  title: string;
  url: string;
  description: string;
  type: 'video' | 'article' | 'interactive' | 'course';
  quality: 'high' | 'medium' | 'low';
  visualRichness: number;
  estimatedTimeMinutes: number;
  authorityScore: number;
  engagementScore: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  averageRating: number;
  viewCount: number;
  completionCount: number;
  learningStyleFit: {
    visual: number;
    auditory: number;
    reading: number;
    kinesthetic: number;
  };
  imageUrl?: string;
  author?: string;
}

interface UserLearningStyle {
  visualScore: number;
  auditoryScore: number;
  readWriteScore: number;
  kinestheticScore: number;
}

const ResourcePanel: React.FC<ResourcePanelProps> = ({ node, onClose, userId }) => {
  const [activeTab, setActiveTab] = useState('recommended');
  
  // Fetch resources for the selected concept
  const { data: resources, isLoading } = useQuery<Resource[]>({
    queryKey: ['resources', node?.id],
    queryFn: async () => {
      // In a real implementation, this would be an API call
      // For now, return mock data
      if (!node) return [];
      
      return [
        {
          id: 1,
          title: `Understanding ${node.label}`,
          url: `https://example.com/${node.label.toLowerCase().replace(/\s+/g, '-')}`,
          description: `A comprehensive introduction to ${node.label} with examples and practical applications.`,
          type: 'article',
          quality: 'high',
          visualRichness: 70,
          estimatedTimeMinutes: 15,
          authorityScore: 85,
          engagementScore: 75,
          difficulty: 'beginner',
          averageRating: 4.7,
          viewCount: 1243,
          completionCount: 892,
          learningStyleFit: {
            visual: 60,
            auditory: 30,
            reading: 90,
            kinesthetic: 40
          },
          imageUrl: 'https://placehold.co/600x400',
          author: 'Dr. Jane Smith'
        },
        {
          id: 2,
          title: `${node.label} Explained Visually`,
          url: `https://youtube.com/watch?v=${node.id}`,
          description: `A visual explanation of ${node.label} using animations and real-world examples.`,
          type: 'video',
          quality: 'high',
          visualRichness: 95,
          estimatedTimeMinutes: 12,
          authorityScore: 80,
          engagementScore: 90,
          difficulty: 'beginner',
          averageRating: 4.9,
          viewCount: 8721,
          completionCount: 6532,
          learningStyleFit: {
            visual: 95,
            auditory: 85,
            reading: 30,
            kinesthetic: 50
          },
          imageUrl: 'https://placehold.co/600x400/png?text=Video+Thumbnail',
          author: 'Educational Visuals'
        },
        {
          id: 3,
          title: `Interactive ${node.label} Tutorial`,
          url: `https://interactive.edu/${node.label.toLowerCase()}`,
          description: `Learn ${node.label} by doing. This interactive tutorial guides you through the concepts with hands-on exercises.`,
          type: 'interactive',
          quality: 'high',
          visualRichness: 85,
          estimatedTimeMinutes: 25,
          authorityScore: 75,
          engagementScore: 95,
          difficulty: 'intermediate',
          averageRating: 4.8,
          viewCount: 3245,
          completionCount: 2187,
          learningStyleFit: {
            visual: 80,
            auditory: 50,
            reading: 60,
            kinesthetic: 95
          },
          imageUrl: 'https://placehold.co/600x400/png?text=Interactive',
          author: 'Interactive Learning Inc.'
        },
        {
          id: 4,
          title: `Advanced ${node.label}: Deep Dive`,
          url: `https://courses.example.edu/${node.id}/advanced`,
          description: `An in-depth exploration of ${node.label} covering advanced topics and current research.`,
          type: 'course',
          quality: 'high',
          visualRichness: 75,
          estimatedTimeMinutes: 120,
          authorityScore: 95,
          engagementScore: 80,
          difficulty: 'advanced',
          averageRating: 4.6,
          viewCount: 1876,
          completionCount: 843,
          learningStyleFit: {
            visual: 70,
            auditory: 75,
            reading: 85,
            kinesthetic: 65
          },
          imageUrl: 'https://placehold.co/600x400/png?text=Course',
          author: 'Prof. Robert Chen, PhD'
        }
      ];
    },
    enabled: !!node
  });
  
  // Fetch user's learning style
  const { data: learningStyle } = useQuery<UserLearningStyle>({
    queryKey: ['learningStyle', userId],
    queryFn: async () => {
      // In a real implementation, this would be an API call
      // For now, return mock data
      return {
        visualScore: 75,
        auditoryScore: 60,
        readWriteScore: 80,
        kinestheticScore: 55
      };
    },
    enabled: !!userId
  });
  
  // Calculate resource fit with user's learning style
  const getStyleMatchScore = (resource: Resource): number => {
    if (!learningStyle) return 50; // Default match score
    
    // Calculate weighted average based on user's learning style preferences
    const totalWeight = 
      learningStyle.visualScore + 
      learningStyle.auditoryScore + 
      learningStyle.readWriteScore + 
      learningStyle.kinestheticScore;
    
    const weightedScore = (
      (resource.learningStyleFit.visual * learningStyle.visualScore) +
      (resource.learningStyleFit.auditory * learningStyle.auditoryScore) +
      (resource.learningStyleFit.reading * learningStyle.readWriteScore) +
      (resource.learningStyleFit.kinesthetic * learningStyle.kinestheticScore)
    ) / totalWeight;
    
    return Math.round(weightedScore);
  };
  
  // Sort resources by recommended order
  const getRecommendedResources = () => {
    if (!resources) return [];
    
    return [...resources].sort((a, b) => {
      // Calculate a weighted score based on multiple factors
      const aScore = 
        getStyleMatchScore(a) * 0.3 + // Learning style match
        a.quality === 'high' ? 30 : a.quality === 'medium' ? 15 : 0 + // Quality
        a.authorityScore * 0.2 + // Authority
        a.engagementScore * 0.2 + // Engagement
        (a.averageRating * 20) * 0.1; // User ratings
        
      const bScore = 
        getStyleMatchScore(b) * 0.3 +
        b.quality === 'high' ? 30 : b.quality === 'medium' ? 15 : 0 +
        b.authorityScore * 0.2 +
        b.engagementScore * 0.2 +
        (b.averageRating * 20) * 0.1;
        
      return bScore - aScore;
    });
  };
  
  // Filter resources by type
  const getResourcesByType = (type: string) => {
    if (!resources) return [];
    return resources.filter(r => r.type === type);
  };
  
  // Get style match description
  const getStyleMatchDescription = (score: number) => {
    if (score >= 80) return 'Excellent match';
    if (score >= 60) return 'Good match';
    if (score >= 40) return 'Fair match';
    return 'Poor match';
  };
  
  // Get resource type icon
  const getResourceTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Play className="h-4 w-4 text-blue-500" />;
      case 'article':
        return <BookOpen className="h-4 w-4 text-green-500" />;
      case 'interactive':
        return <ArrowRight className="h-4 w-4 text-purple-500" />;
      case 'course':
        return <CheckCircle className="h-4 w-4 text-amber-500" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };
  
  // Get quality color
  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'high':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-amber-100 text-amber-800';
      case 'low':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  if (!node) {
    return (
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>Resource Panel</CardTitle>
          <CardDescription>Select a concept to view resources</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Click on any node in the knowledge graph to view associated learning resources
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{node.label}</CardTitle>
            <CardDescription>{node.descriptionShort || 'Learning resources'}</CardDescription>
          </div>
          <Badge variant="outline" className="ml-2">
            {resources?.length || 0} resources
          </Badge>
        </div>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="px-6 w-full grid grid-cols-3">
          <TabsTrigger value="recommended">Recommended</TabsTrigger>
          <TabsTrigger value="byType">By Type</TabsTrigger>
          <TabsTrigger value="learning-path">Learning Path</TabsTrigger>
        </TabsList>
        
        <CardContent className="pt-4 px-6">
          <TabsContent value="recommended" className="mt-0">
            {isLoading ? (
              <div className="py-4 text-center">Loading resources...</div>
            ) : (
              <div className="space-y-4">
                {getRecommendedResources().map(resource => (
                  <div key={resource.id} className="border rounded-md p-3 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getResourceTypeIcon(resource.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm truncate">{resource.title}</h4>
                          <Badge className={`text-xs ${getQualityColor(resource.quality)}`}>
                            {resource.quality}
                          </Badge>
                        </div>
                        
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {resource.description}
                        </p>
                        
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>{resource.estimatedTimeMinutes} min</span>
                          </div>
                          <div className="flex items-center">
                            <Star className="h-3 w-3 mr-1 text-amber-500" />
                            <span>{resource.averageRating.toFixed(1)}</span>
                          </div>
                          {learningStyle && (
                            <div className="flex items-center ml-auto">
                              <span className="text-xs">
                                Match: 
                                <span className={`ml-1 font-medium ${getStyleMatchScore(resource) >= 70 ? 'text-green-600' : getStyleMatchScore(resource) >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                  {getStyleMatchDescription(getStyleMatchScore(resource))}
                                </span>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex justify-end">
                      <Button variant="outline" size="sm" className="text-xs h-7" asChild>
                        <a href={resource.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Open Resource
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="byType" className="mt-0">
            <div className="space-y-6">
              {['video', 'article', 'interactive', 'course'].map(type => {
                const typeResources = getResourcesByType(type);
                if (typeResources.length === 0) return null;
                
                return (
                  <div key={type} className="space-y-2">
                    <h3 className="font-medium text-sm capitalize flex items-center">
                      {getResourceTypeIcon(type)}
                      <span className="ml-2">{type}s</span>
                      <Badge variant="outline" className="ml-2">{typeResources.length}</Badge>
                    </h3>
                    
                    <div className="space-y-2">
                      {typeResources.map(resource => (
                        <div key={resource.id} className="border rounded-md p-3 hover:bg-slate-50 transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-sm">{resource.title}</h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                {resource.estimatedTimeMinutes} min • {resource.difficulty}
                              </p>
                            </div>
                            <Button variant="outline" size="sm" className="text-xs h-7" asChild>
                              <a href={resource.url} target="_blank" rel="noopener noreferrer">
                                Open
                              </a>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
          
          <TabsContent value="learning-path" className="mt-0">
            <div className="border rounded-md p-4 bg-slate-50">
              <h3 className="font-medium text-sm">Recommended Learning Path</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Follow this sequence for optimal learning of {node.label}
              </p>
              
              <div className="mt-4 space-y-4">
                {getRecommendedResources().slice(0, 3).map((resource, index) => (
                  <div key={resource.id} className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    
                    <div className="ml-3 bg-white p-3 rounded-md border flex-1">
                      <h4 className="font-medium text-sm flex items-center">
                        {getResourceTypeIcon(resource.type)}
                        <span className="ml-2">{resource.title}</span>
                      </h4>
                      
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{resource.estimatedTimeMinutes} min</span>
                        </div>
                        <Badge className={`text-xs ${getQualityColor(resource.quality)}`}>
                          {resource.quality}
                        </Badge>
                      </div>
                      
                      <Button variant="outline" size="sm" className="text-xs h-7 mt-2" asChild>
                        <a href={resource.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Start Learning
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
                
                {node.prerequisites && node.prerequisites.length > 0 && (
                  <div className="mt-6 pt-4 border-t">
                    <h4 className="text-xs font-medium">Prerequisites</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      It's recommended to learn these concepts first
                    </p>
                    
                    <div className="mt-2 flex flex-wrap gap-2">
                      {node.prerequisites.map(id => (
                        <Badge key={id} variant="outline" className="text-xs">
                          {/* In a real implementation, we would fetch the prerequisite concept name */}
                          Prerequisite Concept {id}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
      
      <CardFooter className="flex justify-between border-t pt-4 pb-3 px-6">
        <div className="text-xs text-muted-foreground">
          Resources curated based on quality and relevance
        </div>
        
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ResourcePanel;
