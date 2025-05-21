import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Network } from 'lucide-react';
import { Concept, LearningProgress } from '@shared/schema';

interface ConceptDetailsPanelProps {
  concept: Concept;
  onBack: () => void;
}

export default function ConceptDetailsPanel({ concept, onBack }: ConceptDetailsPanelProps) {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Fetch learning progress for this concept
  const { data: learningProgress } = useQuery<LearningProgress>({
    queryKey: ['/api/learning/concept', concept.id],
    enabled: !!concept,
  });
  
  // Fetch connected concepts
  const { data: relatedConcepts } = useQuery({
    queryKey: ['/api/concepts', concept.id, 'related'],
    enabled: !!concept,
  });
  
  // Fetch source documents
  const { data: sourceDocuments } = useQuery({
    queryKey: ['/api/concepts', concept.id, 'documents'],
    enabled: !!concept,
  });
  
  // Fetch insights for this concept
  const { data: conceptInsights } = useQuery({
    queryKey: ['/api/concepts', concept.id, 'insights'],
    enabled: !!concept,
  });
  
  // Start a learning session for this concept
  const handleStartLearning = () => {
    navigate(`/learning?conceptId=${concept.id}`);
  };
  
  // Learn this concept (redirect to learning page)
  const handleLearnConcept = () => {
    navigate(`/learning?conceptId=${concept.id}`);
  };
  
  return (
    <div className="animate-in fade-in duration-300">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <TabsContent value="overview" className="mt-0">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-2">Concept Details</h2>
                  <p className="text-muted-foreground mb-4">{concept.description}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {concept.tags?.map((tag, index) => (
                      <span 
                        key={index} 
                        className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Learning Progress</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>Comprehension</span>
                        <span>{learningProgress?.comprehension || 0}%</span>
                      </div>
                      <Progress value={learningProgress?.comprehension || 0} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>Practice</span>
                        <span>{learningProgress?.practice || 0}%</span>
                      </div>
                      <Progress value={learningProgress?.practice || 0} className="h-2" />
                    </div>
                  </div>
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={handleStartLearning}
                >
                  Start Learning Session
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="connections" className="mt-0">
              <h2 className="text-xl font-bold mb-4">Connected Concepts</h2>
              {Array.isArray(relatedConcepts) && relatedConcepts.length > 0 ? (
                <div className="space-y-2">
                  {relatedConcepts.map((related: any) => (
                    <div 
                      key={related.id} 
                      className="p-3 border rounded flex items-center gap-3 cursor-pointer hover:bg-secondary/30"
                    >
                      <Network className="h-4 w-4 text-blue-500" />
                      <span>{related.name || related.label}</span>
                      <ArrowLeft className="h-4 w-4 ml-auto transform rotate-180" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No connected concepts found.
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="sources" className="mt-0">
              <h2 className="text-xl font-bold mb-4">Source Documents</h2>
              {Array.isArray(sourceDocuments) && sourceDocuments.length > 0 ? (
                <div className="space-y-2">
                  {sourceDocuments.map((doc: any) => (
                    <div 
                      key={doc.id} 
                      className="p-3 border rounded flex items-center justify-between cursor-pointer hover:bg-secondary/30"
                    >
                      <span>{doc.title}</span>
                      <ArrowLeft className="h-4 w-4 transform rotate-180" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No source documents available.
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="insights" className="mt-0">
              <h2 className="text-xl font-bold mb-4">AI-Generated Insights</h2>
              {Array.isArray(conceptInsights) && conceptInsights.length > 0 ? (
                <div className="space-y-4">
                  {conceptInsights.map((insight: any, index: number) => (
                    <div key={index} className="p-3 border rounded bg-secondary/10">
                      <p className="text-sm">{insight.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No insights available for this concept.
                </div>
              )}
            </TabsContent>
          </div>
          
          <div>
            <h2 className="text-xl font-bold mb-4">Connected Concepts</h2>
            {Array.isArray(relatedConcepts) && relatedConcepts.length > 0 ? (
              <div className="space-y-3">
                {relatedConcepts.map((related: any) => (
                  <div key={related.id} className="p-3 border rounded flex items-center gap-3">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 1V15M1 8H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{related.name || related.label}</span>
                    <ArrowLeft className="h-4 w-4 ml-auto transform rotate-180" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-6 text-muted-foreground">
                <p>No connected concepts found</p>
              </div>
            )}
          </div>
        </div>
      </Tabs>
      
      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Graph
        </Button>
        
        <Button onClick={handleLearnConcept}>
          Learn This Concept
        </Button>
      </div>
    </div>
  );
}