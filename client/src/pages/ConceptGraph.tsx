import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import KnowledgeGraph from '@/components/KnowledgeGraph';
import ConceptDetailsPanel from '@/components/ConceptDetailsPanel';
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
          <KnowledgeGraph 
            onSelectConcept={handleSelectConcept}
            redirectToLearning={true}
          />
        </div>
      )}

      {/* Concept Detail View (when a concept is selected) */}
      {showConceptView && selectedConcept && (
        <div className="border rounded-lg p-6 bg-background">
          {/* No need for inline view as we're using the dialog */}
        </div>
      )}

      {/* Dialog for showing concept details */}
      <Dialog open={showConceptView} onOpenChange={setShowConceptView}>
        <DialogContent className="max-w-4xl p-6">
          {selectedConcept && (
            <>
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold">{selectedConcept.name}</h2>
                <Button variant="outline" size="sm" onClick={() => setShowConceptView(false)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              </div>
              
              <div className="tabs-header grid grid-cols-4 gap-1 mb-6">
                <div className="tab-item text-center py-2 border-b-2 border-primary font-medium">
                  Overview
                </div>
                <div className="tab-item text-center py-2 border-b-2 border-gray-200 text-gray-500">
                  Connections
                </div>
                <div className="tab-item text-center py-2 border-b-2 border-gray-200 text-gray-500">
                  Sources
                </div>
                <div className="tab-item text-center py-2 border-b-2 border-gray-200 text-gray-500">
                  Insights
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border p-6 rounded-lg">
                  <h3 className="text-lg font-bold mb-4">Concept Details</h3>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedConcept.tags?.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">Learning Progress</h4>
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Comprehension</span>
                        <span className="text-green-600">65%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: '65%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Practice</span>
                        <span className="text-blue-600">50%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: '50%' }}></div>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full mt-4" 
                    onClick={() => {
                      setShowConceptView(false);
                      navigate(`/learning?conceptId=${selectedConcept.id}`);
                    }}
                  >
                    Start Learning Session
                  </Button>
                </div>
                
                <div className="border p-6 rounded-lg">
                  <h3 className="text-lg font-bold mb-4">Connected Concepts</h3>
                  <div className="space-y-3">
                    {concepts && Array.isArray(concepts) && 
                      concepts
                        .filter((c: any) => c.id !== selectedConcept.id)
                        .slice(0, 3)
                        .map((concept: any) => (
                          <div 
                            key={concept.id}
                            className="flex items-center p-2 border rounded-lg cursor-pointer hover:bg-gray-50"
                            onClick={() => setSelectedConcept(concept)}
                          >
                            <div className="w-6 h-6 mr-3 flex items-center justify-center text-blue-500">
                              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 5v14M5 12h14"></path>
                              </svg>
                            </div>
                            <span className="flex-1">{concept.name}</span>
                            <ArrowLeft className="h-4 w-4 transform rotate-180" />
                          </div>
                        ))
                      }
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between mt-8">
                <Button 
                  variant="outline"
                  onClick={() => setShowConceptView(false)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Graph
                </Button>
                
                <Button 
                  onClick={() => {
                    setShowConceptView(false);
                    navigate(`/learning?conceptId=${selectedConcept.id}`);
                  }}
                >
                  Learn This Concept
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}