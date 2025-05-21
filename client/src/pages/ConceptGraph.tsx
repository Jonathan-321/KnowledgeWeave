import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import KnowledgeGraph from '@/components/KnowledgeGraph';
import ConceptView from '@/components/ConceptView';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Concept } from '@shared/schema';
import { ArrowLeft } from 'lucide-react';

export default function ConceptGraph() {
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const [showConceptView, setShowConceptView] = useState(false);
  const [, navigate] = useLocation();

  // Fetch all concepts
  const { data: concepts } = useQuery({
    queryKey: ['/api/concepts'],
  });

  // Handle clicking on a node in the knowledge graph
  const handleSelectConcept = (concept: Concept) => {
    setSelectedConcept(concept);
    setShowConceptView(true);
    console.log('Selected concept:', concept);
  };

  // Handle clicking the "Back to Graph" button
  const handleBackToGraph = () => {
    setShowConceptView(false);
  };

  // Handle clicking "Learn This Concept" button
  const handleLearnConcept = () => {
    if (selectedConcept) {
      navigate(`/learning?conceptId=${selectedConcept.id}`);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Knowledge Graph</h1>
        <p className="text-muted-foreground mt-2">
          Explore connections between concepts and discover learning paths
        </p>
      </div>

      {/* Knowledge Graph Visualization */}
      {!showConceptView && (
        <div className="border rounded-lg p-4 min-h-[500px] bg-background">
          <KnowledgeGraph onSelectConcept={handleSelectConcept} />
        </div>
      )}

      {/* Concept Detail View (when a concept is selected) */}
      {showConceptView && selectedConcept && (
        <div className="border rounded-lg p-6 bg-background">
          <ConceptView 
            concept={selectedConcept} 
            onBack={handleBackToGraph} 
          />
        </div>
      )}

      {/* Dialog for showing concept details */}
      <Dialog open={showConceptView} onOpenChange={setShowConceptView}>
        <DialogContent className="max-w-4xl p-0">
          {selectedConcept && (
            <div className="p-6">
              <div className="mb-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold">{selectedConcept.name}</h2>
                <Button variant="outline" size="sm" onClick={() => setShowConceptView(false)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              </div>
              
              <p className="text-muted-foreground mb-6">{selectedConcept.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Concept Details</h3>
                  <div className="space-y-4">
                    {/* Tags */}
                    <div>
                      <h4 className="text-sm font-medium mb-1">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedConcept.tags?.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* Learning Progress */}
                    <div>
                      <h4 className="text-sm font-medium mb-1">Learning Progress</h4>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-sm">
                            <span>Comprehension</span>
                            <span>65%</span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: '65%' }} />
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm">
                            <span>Practice</span>
                            <span>50%</span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: '50%' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button className="w-full mt-6" onClick={handleLearnConcept}>
                    Learn This Concept
                  </Button>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Connected Concepts</h3>
                  <div className="space-y-2">
                    {concepts && concepts
                      .filter((c: any) => c.id !== selectedConcept.id)
                      .slice(0, 3)
                      .map((concept: any) => (
                        <div 
                          key={concept.id} 
                          className="p-3 border rounded flex items-center gap-3 cursor-pointer hover:bg-secondary/30"
                          onClick={() => setSelectedConcept(concept)}
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 1V15M1 8H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span>{concept.name}</span>
                          <ArrowLeft className="h-4 w-4 ml-auto transform rotate-180" />
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}