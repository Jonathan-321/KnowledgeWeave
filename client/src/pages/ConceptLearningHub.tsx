import React, { useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ResourceGraph } from '@/components/ResourceGraph';
import { ResourceDetails } from '@/components/ResourceDetails';
import { ResourceGraphGuide } from '@/components/ResourceGraphGuide';
import { AdaptiveQuiz } from '@/components/AdaptiveQuiz';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  BookOpen, 
  Brain, 
  Network, 
  RefreshCw,
  Lightbulb,
  ArrowLeft,
  BarChart
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

interface CuratedResource {
  id: number;
  resourceId: number;
  url: string;
  title: string;
  description: string;
  sourceType: 'video' | 'article' | 'interactive' | 'course' | 'book' | 'tool';
  sourceQuality: 'high' | 'medium' | 'low';
  visualRichness: number;
  authorityScore: number;
  imageUrl?: string;
  sourceName: string;
  author?: string;
  publishDate?: string;
  estimatedTimeMinutes: number;
  difficultyLevel: 'basic' | 'intermediate' | 'advanced';
  conceptConnections: {
    conceptId: number;
    conceptName: string;
    relevanceScore: number;
    isCore: boolean;
  }[];
  learningStyleFit: {
    visual: number;
    auditory: number;
    reading: number;
    kinesthetic: number;
  };
  tags: string[];
  aiSummary?: string;
}

interface Concept {
  id: number;
  name: string;
  description: string;
  tags?: string[];
}

export function ConceptLearningHub({ conceptId }: { conceptId?: string }) {
  const [, setLocation] = useLocation();
  const conceptIdParam = conceptId ? parseInt(conceptId, 10) : undefined;
  const [activeTab, setActiveTab] = useState<string>('resources');
  const [selectedResource, setSelectedResource] = useState<CuratedResource | null>(null);
  const [isResourceDetailView, setIsResourceDetailView] = useState<boolean>(false);

  // Fetch concept details
  const { 
    data: concept, 
    isLoading: isLoadingConcept, 
    isError: isErrorConcept,
    error: conceptError
  } = useQuery({
    queryKey: ['/api/concepts', conceptIdParam],
    queryFn: async () => {
      const response = await fetch(`/api/concepts/${conceptIdParam}`);
      if (!response.ok) {
        throw new Error('Failed to fetch concept details');
      }
      return response.json();
    },
    enabled: !!conceptId,
  });

  // Fetch concept connections
  const { 
    data: connections, 
    isLoading: isLoadingConnections 
  } = useQuery({
    queryKey: ['/api/graph/connections', conceptIdParam],
    queryFn: async () => {
      const response = await fetch(`/api/graph/connections/${conceptIdParam}`);
      if (!response.ok) {
        throw new Error('Failed to fetch concept connections');
      }
      return response.json();
    },
    enabled: !!conceptId,
  });

  // Discover resources mutation
  const discoverResources = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/resource-graph/discover/${conceptIdParam}`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to discover resources');
      }
      return response.json();
    },
    onSuccess: () => {
      // Refetch resources after discovery
      window.location.reload();
    },
  });

  // Handle resource selection
  const handleResourceSelect = (resource: CuratedResource) => {
    setSelectedResource(resource);
    setIsResourceDetailView(true);
  };

  // Handle back to graph view
  const handleBackToGraph = () => {
    setIsResourceDetailView(false);
  };

  // Handle finding similar resources
  const handleFindSimilarResources = (conceptId: number) => {
    setLocation(`/concept/${conceptId}/learn`);
  };

  // Get related concept IDs from connections
  const relatedConceptIds = React.useMemo(() => {
    if (!connections || !connections.connections) return conceptIdParam ? [conceptIdParam] : [];
    
    // Get unique concept IDs from connections
    const ids = new Set<number>();
    if (conceptIdParam) ids.add(conceptIdParam);
    
    connections.connections.forEach((conn: any) => {
      if (conn.sourceId && conn.sourceId !== conceptIdParam) {
        ids.add(conn.sourceId);
      }
      if (conn.targetId && conn.targetId !== conceptIdParam) {
        ids.add(conn.targetId);
      }
    });
    
    // Convert to array and limit to 5 IDs maximum
    return Array.from(ids).slice(0, 5);
  }, [connections, conceptIdParam]);

  // Handle discover resources click
  const handleDiscoverResources = () => {
    discoverResources.mutate();
  };

  if (isLoadingConcept) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="h-12 w-1/3 mb-4" />
        <Skeleton className="h-6 w-full mb-8" />
        <Skeleton className="h-[600px] w-full rounded-md" />
      </div>
    );
  }

  if (isErrorConcept) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {conceptError instanceof Error ? conceptError.message : 'Failed to load concept'}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => setLocation('/concepts')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Concepts
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{concept.name}</h1>
            <p className="text-muted-foreground mt-2">{concept.description}</p>
          </div>
          <Button variant="outline" onClick={() => setLocation('/concepts')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Concepts
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4">
          {concept.tags && concept.tags.map((tag: string, index: number) => (
            <span key={index} className="px-2 py-1 bg-slate-100 text-slate-800 rounded-full text-xs">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="resources">
            <Network className="h-4 w-4 mr-2" />
            Resource Graph
          </TabsTrigger>
          <TabsTrigger value="quiz">
            <Brain className="h-4 w-4 mr-2" />
            Adaptive Quiz
          </TabsTrigger>
          <TabsTrigger value="progress">
            <BarChart className="h-4 w-4 mr-2" />
            Learning Progress
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resources" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <BookOpen className="h-5 w-5 mr-2" />
              Learning Resources
            </h2>
            <Button onClick={handleDiscoverResources} disabled={discoverResources.isPending}>
              {discoverResources.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Discovering...
                </>
              ) : (
                <>
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Discover New Resources
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={`${isResourceDetailView ? 'hidden lg:block' : ''} lg:col-span-2`}>
              <ResourceGraph 
                conceptIds={relatedConceptIds}
                width={800}
                height={600}
                onResourceSelect={handleResourceSelect}
              />
            </div>
            
            <div className={`${!isResourceDetailView ? 'hidden lg:block' : ''}`}>
              {selectedResource ? (
                <ResourceDetails 
                  resource={selectedResource}
                  onBack={handleBackToGraph}
                  onSimilarResources={handleFindSimilarResources}
                />
              ) : (
                <ResourceGraphGuide />
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="quiz" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="h-5 w-5 mr-2" />
                Adaptive Quiz
              </CardTitle>
              <CardDescription>
                Test your knowledge of {concept.name} with this adaptive quiz
              </CardDescription>
            </CardHeader>
            <CardContent>
              {conceptIdParam && <AdaptiveQuiz conceptId={conceptIdParam} />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart className="h-5 w-5 mr-2" />
                Learning Progress
              </CardTitle>
              <CardDescription>
                Track your progress in mastering {concept.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <p className="text-muted-foreground mb-4">Learning progress tracking is coming soon!</p>
                <p className="text-sm text-muted-foreground">
                  Complete quizzes and interact with resources to start building your learning profile.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
