import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Concept, LearningProgress } from '@shared/schema';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ConceptViewProps {
  concept: Concept;
  onBack: () => void;
}

export function ConceptView({ concept, onBack }: ConceptViewProps) {
  const [, navigate] = useLocation();
  
  // Fetch learning progress for this concept
  const { data: learningProgress } = useQuery<LearningProgress>({
    queryKey: ['/api/learning/concept', concept.id],
    enabled: !!concept,
  });
  
  // Fetch related concepts
  const { data: relatedConcepts } = useQuery({
    queryKey: ['/api/concepts', concept.id, 'related'],
    enabled: !!concept,
  });
  
  // Fetch sources (documents) for this concept
  const { data: sourceDocuments } = useQuery({
    queryKey: ['/api/concepts', concept.id, 'documents'],
    enabled: !!concept,
  });
  
  // Fetch insights for this concept
  const { data: conceptInsights } = useQuery({
    queryKey: ['/api/concepts', concept.id, 'insights'],
    enabled: !!concept,
  });
  
  // Start learning session for this concept
  const handleLearnConcept = () => {
    navigate(`/learning?conceptId=${concept.id}`);
  };
  
  return (
    <div className="animate-in fade-in duration-300">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-4">
            <TabsContent value="overview" className="space-y-4">
              <div>
                <h2 className="text-xl font-bold mb-2">Concept Details</h2>
                <p className="text-sm text-muted-foreground mb-4">{concept.description}</p>
                
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {concept.tags?.map((tag, i) => (
                      <Badge key={i} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Learning Progress</h3>
                {learningProgress ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Comprehension</span>
                        <span className="text-muted-foreground">{learningProgress.comprehension}%</span>
                      </div>
                      <Progress value={learningProgress.comprehension || 0} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Practice</span>
                        <span className="text-muted-foreground">{learningProgress.practice}%</span>
                      </div>
                      <Progress value={learningProgress.practice || 0} className="h-2" />
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No learning progress yet. Start your first session.
                  </div>
                )}
              </div>
              
              <Button 
                className="w-full" 
                onClick={() => handleLearnConcept()}
              >
                Start Learning Session
              </Button>
            </TabsContent>
            
            <TabsContent value="connections">
              <h2 className="text-xl font-bold mb-4">Connected Concepts</h2>
              {relatedConcepts && relatedConcepts.length > 0 ? (
                <div className="space-y-2">
                  {relatedConcepts.map((relatedConcept: any) => (
                    <div 
                      key={relatedConcept.id} 
                      className="p-2 border rounded flex items-center justify-between cursor-pointer hover:bg-secondary/30"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span>{relatedConcept.label || relatedConcept.name}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No connected concepts found for this concept.
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="sources">
              <h2 className="text-xl font-bold mb-4">Source Documents</h2>
              {sourceDocuments && sourceDocuments.length > 0 ? (
                <div className="space-y-2">
                  {sourceDocuments.map((doc: any) => (
                    <div 
                      key={doc.id} 
                      className="p-2 border rounded flex items-center justify-between cursor-pointer hover:bg-secondary/30"
                    >
                      <span>{doc.title}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No source documents found for this concept.
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="insights">
              <h2 className="text-xl font-bold mb-4">AI-Generated Insights</h2>
              {conceptInsights && conceptInsights.length > 0 ? (
                <div className="space-y-4">
                  {conceptInsights.map((insight: any, index: number) => (
                    <div key={index} className="p-3 border rounded bg-secondary/10">
                      <p className="text-sm">{insight.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No insights available for this concept yet.
                </div>
              )}
            </TabsContent>
          </Card>
          
          <Card className="p-4">
            <h2 className="text-xl font-bold mb-4">Connected Concepts</h2>
            
            {relatedConcepts && relatedConcepts.length > 0 ? (
              <div className="space-y-2">
                {relatedConcepts.map((related: any) => (
                  <div key={related.id} className="p-3 border rounded flex items-center gap-3">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 1V15M1 8H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{related.label || related.name}</span>
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                <p>No connected concepts found</p>
              </div>
            )}
          </Card>
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

export default ConceptView;