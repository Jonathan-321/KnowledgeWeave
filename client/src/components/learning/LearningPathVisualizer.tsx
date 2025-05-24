import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowRight, BookOpen, Brain, Check, Clock, Route, School, 
  Star, BarChart3, BookMarked, Network, ExternalLink,
  Play, FileText, Zap
} from 'lucide-react';
import ResourceCard from '@/components/resource/ResourceCard';
import axios from 'axios';

interface LearningPathItem {
  concept: {
    id: number;
    label: string;
    description?: string;
    importance?: number;
    mastery?: number;
  };
  mastery: number;
  estimatedTimeToMastery: number;
  order: string;
  resources: Array<any>;
}

interface LearningPathVisualizerProps {
  conceptId: number;
  conceptName?: string;
  compact?: boolean;
  onSelectConcept?: (conceptId: number) => void;
}

const LearningPathVisualizer: React.FC<LearningPathVisualizerProps> = ({
  conceptId,
  conceptName,
  compact = false,
  onSelectConcept
}) => {
  const [activeTab, setActiveTab] = useState<string>('path');
  const [selectedResourceType, setSelectedResourceType] = useState<string>('all');
  
  // Fetch learning path with resources
  const { data: learningPath, isLoading, error } = useQuery<LearningPathItem[]>({
    queryKey: ['learningPath', conceptId],
    queryFn: async () => {
      try {
        const response = await axios.get(`/api/visual-resources/learning-path/${conceptId}`);
        return response.data;
      } catch (error) {
        console.error('Error fetching learning path:', error);
        throw error;
      }
    }
  });
  
  // Get mastery color based on percentage
  const getMasteryColor = (mastery: number) => {
    if (mastery >= 80) return 'bg-green-500';
    if (mastery >= 60) return 'bg-blue-500';
    if (mastery >= 40) return 'bg-amber-500';
    if (mastery >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };
  
  // Calculate total learning time
  const getTotalLearningTime = () => {
    if (!learningPath) return 0;
    return learningPath.reduce((total, item) => total + item.estimatedTimeToMastery, 0);
  };
  
  // Get all resources across the learning path
  const getAllResources = () => {
    if (!learningPath) return [];
    
    const allResources = learningPath.flatMap(item => item.resources);
    
    // Filter by type if needed
    if (selectedResourceType !== 'all') {
      return allResources.filter(r => r.sourceType === selectedResourceType);
    }
    
    return allResources;
  };
  
  // Get resource count by type
  const getResourceCountByType = (type: string) => {
    const resources = getAllResources();
    
    if (type === 'all') return resources.length;
    return resources.filter(r => r.sourceType === type).length;
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin mb-4">
              <Route className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-muted-foreground">Generating learning path...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="flex flex-col items-center justify-center">
            <p className="text-red-500 mb-2">Failed to load learning path</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!learningPath || learningPath.length === 0) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="flex flex-col items-center justify-center">
            <p className="text-muted-foreground mb-2">No learning path available for this concept</p>
            <p className="text-sm text-muted-foreground">This concept may not have prerequisites</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Route className="h-5 w-5 mr-2 text-blue-500" />
              {conceptName ? `Learning Path: ${conceptName}` : 'Learning Path'}
            </CardTitle>
            <CardDescription>
              Recommended learning sequence with visual resources
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {getTotalLearningTime()} mins
            </Badge>
            
            <Badge variant="outline" className="flex items-center">
              <School className="h-3 w-3 mr-1" />
              {learningPath.length} concepts
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <Tabs defaultValue="path" value={activeTab} onValueChange={setActiveTab}>
        <div className="px-4">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="path">
              <Route className="h-4 w-4 mr-2" />
              Learning Path
            </TabsTrigger>
            <TabsTrigger value="resources">
              <BookOpen className="h-4 w-4 mr-2" />
              Resources
              <Badge className="ml-2" variant="secondary">
                {getAllResources().length}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="pt-4">
          <TabsContent value="path" className="mt-0">
            <div className="space-y-6">
              {learningPath.map((item, index) => (
                <div key={item.concept.id} className="relative">
                  {/* Connector line */}
                  {index < learningPath.length - 1 && (
                    <div className="absolute left-[19px] top-[40px] bottom-0 w-[2px] bg-slate-200 z-0"></div>
                  )}
                  
                  <div className="flex gap-4">
                    {/* Node icon */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${item.order === 'target' ? 'bg-blue-100 text-blue-600 border-2 border-blue-300' : 'bg-slate-100'}`}>
                      {item.order === 'target' ? (
                        <BookMarked className="h-5 w-5" />
                      ) : (
                        <Brain className="h-5 w-5 text-slate-600" />
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-base flex items-center">
                            {item.concept.label}
                            {item.order === 'target' && (
                              <Badge className="ml-2" variant="secondary">Target</Badge>
                            )}
                            {item.order === 'prerequisite' && (
                              <Badge className="ml-2" variant="outline">Prerequisite</Badge>
                            )}
                          </h3>
                          
                          {item.concept.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.concept.description}
                            </p>
                          )}
                        </div>
                        
                        {onSelectConcept && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8" 
                            onClick={() => onSelectConcept(item.concept.id)}
                          >
                            <Network className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        )}
                      </div>
                      
                      {/* Mastery progress */}
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Current mastery</span>
                          <span className="font-medium">{item.mastery}%</span>
                        </div>
                        <Progress 
                          value={item.mastery} 
                          className="h-2" 
                          indicatorClassName={getMasteryColor(item.mastery)}
                        />
                      </div>
                      
                      {/* Estimated time */}
                      <div className="mt-2 flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>Est. time to mastery: {item.estimatedTimeToMastery} minutes</span>
                      </div>
                      
                      {/* Resources preview */}
                      {item.resources && item.resources.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium flex items-center">
                              <BookOpen className="h-4 w-4 mr-1 text-blue-500" />
                              Top Resources
                            </h4>
                            
                            {item.resources.length > 2 && (
                              <Button 
                                variant="link" 
                                size="sm" 
                                className="h-6 p-0" 
                                onClick={() => {
                                  setActiveTab('resources');
                                  setSelectedResourceType('all');
                                }}
                              >
                                View all
                              </Button>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {item.resources.slice(0, 2).map((resource, i) => (
                              <div 
                                key={i} 
                                className="bg-slate-50 rounded-md p-2 flex items-center gap-2 text-sm hover:bg-slate-100 transition-colors cursor-pointer"
                                onClick={() => window.open(resource.url, '_blank')}
                              >
                                {resource.sourceType === 'video' && <Play className="h-4 w-4 text-blue-500" />}
                                {resource.sourceType === 'article' && <FileText className="h-4 w-4 text-green-500" />}
                                {resource.sourceType === 'interactive' && <Zap className="h-4 w-4 text-purple-500" />}
                                {resource.sourceType === 'course' && <BookOpen className="h-4 w-4 text-amber-500" />}
                                
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">{resource.title}</div>
                                  <div className="flex items-center text-xs text-muted-foreground">
                                    <Badge 
                                      variant={resource.sourceQuality === 'high' ? 'default' : 'outline'}
                                      className="mr-1 text-[10px] px-1 h-4"
                                    >
                                      {resource.sourceQuality}
                                    </Badge>
                                    <span>{resource.estimatedTimeMinutes}min</span>
                                  </div>
                                </div>
                                
                                <ExternalLink className="h-3 w-3 text-muted-foreground" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="resources" className="mt-0">
            <div className="space-y-4">
              <div className="flex overflow-x-auto pb-2 no-scrollbar">
                <TabsList className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
                  <TabsTrigger 
                    value="all" 
                    className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow"
                    onClick={() => setSelectedResourceType('all')}
                    data-state={selectedResourceType === 'all' ? 'active' : 'inactive'}
                  >
                    All
                    <Badge variant="secondary" className="ml-1">
                      {getResourceCountByType('all')}
                    </Badge>
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="video" 
                    className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow"
                    onClick={() => setSelectedResourceType('video')}
                    data-state={selectedResourceType === 'video' ? 'active' : 'inactive'}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Videos
                    <Badge variant="secondary" className="ml-1">
                      {getResourceCountByType('video')}
                    </Badge>
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="article" 
                    className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow"
                    onClick={() => setSelectedResourceType('article')}
                    data-state={selectedResourceType === 'article' ? 'active' : 'inactive'}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Articles
                    <Badge variant="secondary" className="ml-1">
                      {getResourceCountByType('article')}
                    </Badge>
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="interactive" 
                    className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow"
                    onClick={() => setSelectedResourceType('interactive')}
                    data-state={selectedResourceType === 'interactive' ? 'active' : 'inactive'}
                  >
                    <Zap className="h-4 w-4 mr-1" />
                    Interactive
                    <Badge variant="secondary" className="ml-1">
                      {getResourceCountByType('interactive')}
                    </Badge>
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="course" 
                    className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow"
                    onClick={() => setSelectedResourceType('course')}
                    data-state={selectedResourceType === 'course' ? 'active' : 'inactive'}
                  >
                    <BookOpen className="h-4 w-4 mr-1" />
                    Courses
                    <Badge variant="secondary" className="ml-1">
                      {getResourceCountByType('course')}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getAllResources().map((resource, index) => (
                  <ResourceCard 
                    key={index} 
                    resource={{
                      id: index,
                      resourceId: index,
                      title: resource.title,
                      url: resource.url,
                      description: resource.description,
                      type: resource.sourceType,
                      quality: resource.sourceQuality,
                      visualRichness: resource.visualRichness,
                      authorityScore: resource.authorityScore,
                      engagementScore: resource.engagementScore,
                      difficulty: resource.difficultyLevel,
                      estimatedTimeMinutes: resource.estimatedTimeMinutes,
                      learningStyleFit: resource.learningStyleFit,
                      author: resource.author,
                      imageUrl: resource.imageUrl
                    }}
                    compact={true}
                  />
                ))}
              </div>
              
              {getAllResources().length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No resources available for the selected type
                </div>
              )}
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
      
      <CardFooter className="flex justify-between pt-2">
        <div className="text-sm text-muted-foreground">
          Resources are prioritized by visual content and learning style fit
        </div>
        
        <Button variant="outline" size="sm" onClick={() => setActiveTab('path')}>
          <Route className="h-4 w-4 mr-2" />
          Back to Path
        </Button>
      </CardFooter>
    </Card>
  );
};

export default LearningPathVisualizer;
