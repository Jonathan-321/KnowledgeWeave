import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import EnhancedKnowledgeGraph from '@/components/EnhancedKnowledgeGraph';
import LearningPathVisualizer from '@/components/learning/LearningPathVisualizer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RotateCw, Layout, Info, Network, BookOpen, User, Brain, Route, Map, Lightbulb, Search } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useMediaQuery } from '@/hooks/use-media-query';

const KnowledgeGraphPage: React.FC = () => {
  const { conceptId } = useParams<{ conceptId?: string }>();
  const navigate = useNavigate();
  const [graphMode, setGraphMode] = useState<'complete' | 'personalized' | 'neighborhood'>('personalized');
  const [activeView, setActiveView] = useState<'graph' | 'path' | 'resources'>('graph');
  const [selectedConceptId, setSelectedConceptId] = useState<number | undefined>(conceptId ? parseInt(conceptId) : undefined);
  const [selectedConceptName, setSelectedConceptName] = useState<string>('');
  
  // Media query for responsive layout
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  
  // Get user ID (in a real app, this would come from auth context)
  const userId = 1;
  
  // Fetch the appropriate graph data based on selected mode
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['graph', graphMode, conceptId],
    queryFn: async () => {
      let url = `/api/graph/${graphMode}`;
      
      if (graphMode === 'neighborhood' && conceptId) {
        url = `${url}/${conceptId}`;
      }
      
      const response = await axios.get(url);
      
      // Update concept name if we have a selected concept
      if (selectedConceptId) {
        const selectedNode = response.data.nodes.find((node: any) => node.id === selectedConceptId);
        if (selectedNode) {
          setSelectedConceptName(selectedNode.label);
        }
      }
      
      return response.data;
    },
    enabled: true
  });
  
  // Calculate graph dimensions based on window size and active view
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth - 80, // Allow for padding and sidebar
    height: window.innerHeight - 280 // Allow for header, footer, and tabs
  });
  
  // Update dimensions on window resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth - 80,
        height: window.innerHeight - 280
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle selecting a concept from the graph
  const handleConceptSelect = (id: number) => {
    setSelectedConceptId(id);
    
    // If we're in neighborhood mode and the selected concept changes, update the URL
    if (graphMode === 'neighborhood' && id !== parseInt(conceptId || '0')) {
      navigate(`/knowledge-graph/${id}`);
    }
    
    // Find the concept name
    if (data?.nodes) {
      const selectedNode = data.nodes.find((node: any) => node.id === id);
      if (selectedNode) {
        setSelectedConceptName(selectedNode.label);
      }
    }
  };
  
  // Effect to sync the URL parameter with our state
  useEffect(() => {
    if (conceptId) {
      const numericId = parseInt(conceptId);
      setSelectedConceptId(numericId);
      // Also switch to neighborhood mode if we have a concept ID
      if (graphMode !== 'neighborhood') {
        setGraphMode('neighborhood');
      }
    }
  }, [conceptId]);
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Knowledge Graph</h1>
          <p className="text-muted-foreground">
            Explore relationships between concepts and discover visual learning resources
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)} className="w-full sm:w-auto">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="graph">
                <Network className="h-4 w-4 mr-2" />
                Graph
              </TabsTrigger>
              <TabsTrigger value="path" disabled={!selectedConceptId}>
                <Route className="h-4 w-4 mr-2" />
                Learning Path
              </TabsTrigger>
              <TabsTrigger value="resources" disabled={!selectedConceptId}>
                <BookOpen className="h-4 w-4 mr-2" />
                Resources
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex items-center gap-2">
            <ToggleGroup type="single" value={graphMode} onValueChange={(value) => value && setGraphMode(value as any)} className="hidden md:flex">
              <ToggleGroupItem value="personalized" aria-label="Personalized View" size="sm">
                <User className="h-4 w-4 mr-1" />
                Personalized
              </ToggleGroupItem>
              <ToggleGroupItem value="complete" aria-label="Complete View" size="sm">
                <Network className="h-4 w-4 mr-1" />
                Complete
              </ToggleGroupItem>
              <ToggleGroupItem value="neighborhood" aria-label="Neighborhood View" disabled={!selectedConceptId} size="sm">
                <Layout className="h-4 w-4 mr-1" />
                Focus
              </ToggleGroupItem>
            </ToggleGroup>
            
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Display error message if data fetch fails */}
      {error && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-500">Error Loading Content</CardTitle>
            <CardDescription>
              There was a problem loading the requested data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {(error as any).message || 'Please try again later.'}
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => refetch()}>Retry</Button>
          </CardFooter>
        </Card>
      )}
      
      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center">
            <div className="animate-spin mb-4">
              {activeView === 'graph' && <Network className="h-16 w-16 text-blue-500" />}
              {activeView === 'path' && <Route className="h-16 w-16 text-blue-500" />}
              {activeView === 'resources' && <BookOpen className="h-16 w-16 text-blue-500" />}
            </div>
            <p className="text-muted-foreground">Loading {activeView === 'graph' ? 'knowledge graph' : activeView === 'path' ? 'learning path' : 'resources'}...</p>
          </div>
        </div>
      )}
      
      {/* Show appropriate view based on active tab */}
      {!isLoading && data && (
        <Tabs value={activeView} className="flex-1 flex flex-col">
          {/* Graph View */}
          <TabsContent value="graph" className="flex-1 data-[state=active]:flex flex-col mt-0">
            <div className="flex-1 bg-slate-50 rounded-lg border shadow-sm overflow-hidden">
              <EnhancedKnowledgeGraph 
                userId={userId}
                data={data}
                initialConceptId={selectedConceptId}
                width={dimensions.width}
                height={dimensions.height}
                onSelectConcept={handleConceptSelect}
              />
            </div>
            
            {selectedConceptId && (
              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setActiveView('path')}
                  className="mr-2"
                >
                  <Route className="h-4 w-4 mr-2" />
                  View Learning Path
                </Button>
                <Button
                  onClick={() => setActiveView('resources')}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Explore Visual Resources
                </Button>
              </div>
            )}
          </TabsContent>
          
          {/* Learning Path View */}
          <TabsContent value="path" className="flex-1 data-[state=active]:flex flex-col mt-0">
            {selectedConceptId && (
              <div className="flex-1 flex flex-col">
                <div className="mb-4 flex items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveView('graph')}
                    className="mr-2"
                  >
                    <Network className="h-4 w-4 mr-2" />
                    Back to Graph
                  </Button>
                  
                  <div className="flex-1" />
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveView('resources')}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    View All Resources
                  </Button>
                </div>
                
                <LearningPathVisualizer 
                  conceptId={selectedConceptId}
                  conceptName={selectedConceptName}
                  onSelectConcept={(id) => {
                    handleConceptSelect(id);
                    setActiveView('graph');
                  }}
                />
              </div>
            )}
          </TabsContent>
          
          {/* Resources View */}
          <TabsContent value="resources" className="flex-1 data-[state=active]:flex flex-col mt-0">
            {selectedConceptId && (
              <div className="flex-1 flex flex-col">
                <div className="mb-4 flex items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveView('graph')}
                    className="mr-2"
                  >
                    <Network className="h-4 w-4 mr-2" />
                    Back to Graph
                  </Button>
                  
                  <div className="flex-1" />
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveView('path')}
                  >
                    <Route className="h-4 w-4 mr-2" />
                    View Learning Path
                  </Button>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BookOpen className="h-5 w-5 mr-2 text-blue-500" />
                      Visual Resources for {selectedConceptName}
                    </CardTitle>
                    <CardDescription>
                      High-quality visual learning resources curated for your learning style
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Will be populated by the Visual Resource Gallery component in the future */}
                      <Card className="flex items-center justify-center h-48 bg-blue-50 border-dashed border-blue-200">
                        <div className="text-center p-4">
                          <Search className="h-8 w-8 mx-auto mb-2 text-blue-500 opacity-70" />
                          <p className="font-medium">Discovering resources...</p>
                          <p className="text-sm text-muted-foreground mt-1">Looking for high-quality visual materials</p>
                        </div>
                      </Card>
                      
                      <Card className="flex items-center justify-center h-48 bg-green-50 border-dashed border-green-200">
                        <div className="text-center p-4">
                          <Lightbulb className="h-8 w-8 mx-auto mb-2 text-green-500 opacity-70" />
                          <p className="font-medium">Interactive demonstrations</p>
                          <p className="text-sm text-muted-foreground mt-1">Hands-on examples to reinforce learning</p>
                        </div>
                      </Card>
                      
                      <Card className="flex items-center justify-center h-48 bg-purple-50 border-dashed border-purple-200">
                        <div className="text-center p-4">
                          <Map className="h-8 w-8 mx-auto mb-2 text-purple-500 opacity-70" />
                          <p className="font-medium">Visual concept maps</p>
                          <p className="text-sm text-muted-foreground mt-1">Clear diagrams showing concept relationships</p>
                        </div>
                      </Card>
                      
                      <Card className="flex items-center justify-center h-48 bg-amber-50 border-dashed border-amber-200">
                        <div className="text-center p-4">
                          <Brain className="h-8 w-8 mx-auto mb-2 text-amber-500 opacity-70" />
                          <p className="font-medium">Expert video explanations</p>
                          <p className="text-sm text-muted-foreground mt-1">Curated tutorials from top educators</p>
                        </div>
                      </Card>
                    </div>
                  </CardContent>
                  
                  <CardFooter>
                    <p className="text-sm text-muted-foreground">
                      Resources are prioritized by visual clarity and your learning style preferences
                    </p>
                  </CardFooter>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default KnowledgeGraphPage;
