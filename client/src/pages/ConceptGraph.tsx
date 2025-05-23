import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import KnowledgeGraph from '@/components/KnowledgeGraph';
import InteractiveGraph from '@/components/InteractiveGraph';
import ConceptDetailsPanel from '@/components/ConceptDetailsPanel';
import ResourcesTabPanel from '@/components/ResourcesTabPanel';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Concept } from '@shared/schema';
import { ArrowLeft, Book, Link, Lightbulb, BarChart3 } from 'lucide-react';

export default function ConceptGraph() {
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const [showConceptView, setShowConceptView] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [, navigate] = useLocation();
  
  // For demo purposes, hardcoded user ID (in a real app, this would come from auth)
  const userId = 1;

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
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Knowledge Graph</h1>
          <p className="text-muted-foreground mt-2">
            Explore connections between concepts and discover learning paths
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => {
              fetch('/api/generate-quantum-concepts', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
              })
              .then(response => response.json())
              .then(data => {
                console.log('Generated quantum concepts:', data);
                
                // Refresh data
                setTimeout(() => {
                  window.location.reload();
                }, 500);
              })
              .catch(error => {
                console.error('Error generating concepts:', error);
                alert('Error creating sample concepts. Please try again.');
              });
            }}
          >
            Generate Sample Concepts
          </Button>
          <Button 
            variant="outline"
            onClick={() => {
              // Navigate to the first concept in the list
              if (concepts && Array.isArray(concepts) && concepts.length > 0) {
                window.location.href = `/learning?conceptId=${concepts[0].id}`;
              } else {
                alert('No concepts available. Please generate sample concepts first.');
              }
            }}
          >
            Test Concept Navigation
          </Button>
        </div>
      </div>

      {/* Knowledge Graph Visualization */}
      {!showConceptView && (
        <div className="border rounded-lg p-4 min-h-[500px] bg-background"
          onMouseDown={(e) => {
            // Add event listener for the custom conceptSelected event
            const handleConceptSelected = (event: any) => {
              if (event.detail) {
                setSelectedConcept(event.detail);
                setShowConceptView(true);
                console.log('Concept selected from graph:', event.detail);
              }
            };
            
            // Add the event listener
            e.currentTarget.addEventListener('conceptSelected', handleConceptSelected);
            
            // Cleanup function to remove the event listener
            setTimeout(() => {
              e.currentTarget.removeEventListener('conceptSelected', handleConceptSelected);
            }, 1000); // Remove after 1 second
          }}>
          <InteractiveGraph />
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
              
              <div className="tabs-header grid grid-cols-5 gap-1 mb-6">
                <div 
                  onClick={() => setActiveTab('overview')}
                  className={`tab-item text-center py-2 border-b-2 cursor-pointer flex flex-col items-center justify-center ${activeTab === 'overview' ? 'border-primary font-medium' : 'border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  <Book className="w-4 h-4 mb-1" />
                  Overview
                </div>
                <div 
                  onClick={() => setActiveTab('connections')}
                  className={`tab-item text-center py-2 border-b-2 cursor-pointer flex flex-col items-center justify-center ${activeTab === 'connections' ? 'border-primary font-medium' : 'border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  <Link className="w-4 h-4 mb-1" />
                  Connections
                </div>
                <div 
                  onClick={() => setActiveTab('resources')}
                  className={`tab-item text-center py-2 border-b-2 cursor-pointer flex flex-col items-center justify-center ${activeTab === 'resources' ? 'border-primary font-medium' : 'border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  <BarChart3 className="w-4 h-4 mb-1" />
                  Resources
                </div>
                <div 
                  onClick={() => setActiveTab('sources')}
                  className={`tab-item text-center py-2 border-b-2 cursor-pointer flex flex-col items-center justify-center ${activeTab === 'sources' ? 'border-primary font-medium' : 'border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  <Link className="w-4 h-4 mb-1" />
                  Sources
                </div>
                <div 
                  onClick={() => setActiveTab('insights')}
                  className={`tab-item text-center py-2 border-b-2 cursor-pointer flex flex-col items-center justify-center ${activeTab === 'insights' ? 'border-primary font-medium' : 'border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  <Lightbulb className="w-4 h-4 mb-1" />
                  Insights
                </div>
              </div>
              
              {activeTab === 'resources' && (
                <ResourcesTabPanel 
                  conceptId={selectedConcept.id} 
                  userId={userId}
                  conceptName={selectedConcept.name}
                />
              )}
              
              {activeTab === 'overview' && (
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
              )}
              
              {activeTab === 'connections' && (
                <div className="border p-6 rounded-lg">
                  <h3 className="text-lg font-bold mb-4">Concept Connections</h3>
                  <p className="text-gray-500 mb-4">Visualize how this concept connects to other concepts in the knowledge graph.</p>
                  
                  <div className="min-h-[300px] flex items-center justify-center bg-gray-50 rounded-lg">
                    <p className="text-gray-400">Connection visualization will be displayed here</p>
                  </div>
                </div>
              )}
              
              {activeTab === 'resources' && (
                <div className="border rounded-lg">
                  <ResourcesTabPanel conceptId={selectedConcept.id} userId={userId} />
                </div>
              )}
              
              {activeTab === 'sources' && (
                <div className="border p-6 rounded-lg">
                  <h3 className="text-lg font-bold mb-4">Source Documents</h3>
                  <p className="text-gray-500 mb-4">Original documents that mention this concept:</p>
                  
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Introduction to Neural Networks.pdf</h4>
                        <p className="text-sm text-gray-500">This concept appears on pages 12, 15, 23</p>
                      </div>
                      <Button variant="outline" size="sm">View</Button>
                    </div>
                    <div className="p-3 border rounded-lg flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Deep Learning Fundamentals.pdf</h4>
                        <p className="text-sm text-gray-500">This concept appears on pages 45, 47</p>
                      </div>
                      <Button variant="outline" size="sm">View</Button>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'insights' && (
                <div className="border p-6 rounded-lg">
                  <h3 className="text-lg font-bold mb-4">AI Insights</h3>
                  <p className="text-gray-500 mb-4">AI-generated insights about this concept:</p>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-700 mb-2">Learning Difficulty</h4>
                      <p className="text-sm">This concept is considered <strong>moderately difficult</strong> and typically requires understanding of prerequisite concepts like linear algebra and basic calculus.</p>
                    </div>
                    
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-medium text-purple-700 mb-2">Common Misconceptions</h4>
                      <p className="text-sm">Students often confuse the role of activation functions in neural networks. Remember that they introduce non-linearity, allowing the network to learn complex patterns.</p>
                    </div>
                    
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-700 mb-2">Learning Recommendation</h4>
                      <p className="text-sm">Based on your current understanding, we recommend focusing on practical implementation exercises to reinforce theoretical knowledge.</p>
                    </div>
                  </div>
                </div>
              )}
              
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