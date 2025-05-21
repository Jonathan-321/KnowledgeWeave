import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Concept, Document, GraphNode } from "@shared/schema";
import { Brain, Book, ArrowRight, ArrowLeft, Zap, Network } from "lucide-react";
import ProgressBar from "@/components/ProgressBar";

interface ConceptExplorerProps {
  conceptId: number;
  onClose: () => void;
  onNavigateToConcept: (conceptId: number) => void;
  onStartLearning: (conceptId: number) => void;
}

export default function ConceptExplorer({ 
  conceptId, 
  onClose, 
  onNavigateToConcept,
  onStartLearning
}: ConceptExplorerProps) {
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch the concept details
  const { data: concept } = useQuery<Concept>({
    queryKey: ["/api/concepts", conceptId],
    enabled: !!conceptId,
  });

  // Fetch related concepts (connected in the graph)
  const { data: relatedConcepts } = useQuery<GraphNode[]>({
    queryKey: ["/api/concepts", conceptId, "related"],
    enabled: !!conceptId,
  });

  // Fetch source documents for this concept
  const { data: documents } = useQuery<Document[]>({
    queryKey: ["/api/concepts", conceptId, "documents"],
    enabled: !!conceptId,
  });

  // Fetch learning progress
  const { data: progress } = useQuery({
    queryKey: ["/api/learning", conceptId],
    enabled: !!conceptId,
  });

  // Fetch insights related to this concept
  const { data: insights } = useQuery({
    queryKey: ["/api/concepts", conceptId, "insights"],
    enabled: !!conceptId,
  });

  if (!concept) {
    return null;
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center">
            <span className="text-primary">{concept.name}</span>
          </DialogTitle>
          <DialogDescription>
            {concept.description}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="mb-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="connections">Connections</TabsTrigger>
            <TabsTrigger value="sources">Sources</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Concept Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <h3 className="text-sm font-medium mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {concept.tags && concept.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <h3 className="text-sm font-medium mb-2">Learning Progress</h3>
                    {progress ? (
                      <div className="space-y-3 mb-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Comprehension</span>
                            <span className="text-green-600 dark:text-green-400 font-medium">
                              {progress.comprehension}%
                            </span>
                          </div>
                          <ProgressBar value={progress.comprehension} color="green" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Practice</span>
                            <span className="text-blue-600 dark:text-blue-400 font-medium">
                              {progress.practice}%
                            </span>
                          </div>
                          <ProgressBar value={progress.practice} color="blue" />
                        </div>

                        {progress.nextReviewDate && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            Next review: {new Date(progress.nextReviewDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        No learning progress recorded yet
                      </p>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end pt-0">
                  <Button 
                    variant="secondary" 
                    className="w-full" 
                    onClick={() => onStartLearning(concept.id)}
                  >
                    <Brain className="mr-2" size={16} />
                    <span>Start Learning Session</span>
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Connected Concepts</CardTitle>
                </CardHeader>
                <CardContent>
                  {relatedConcepts && relatedConcepts.length > 0 ? (
                    <div className="space-y-2">
                      {relatedConcepts.map((related) => (
                        <div 
                          key={related.id} 
                          className="p-2 border rounded-md flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                          onClick={() => onNavigateToConcept(related.id)}
                        >
                          <div className="flex items-center">
                            <Network size={16} className="mr-2 text-primary" />
                            <span className="font-medium">{related.label}</span>
                          </div>
                          <ArrowRight size={16} className="text-gray-400" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No connected concepts found
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Connections Tab */}
          <TabsContent value="connections">
            <Card>
              <CardHeader>
                <CardTitle>Concept Network</CardTitle>
                <CardDescription>
                  Explore how this concept connects to other concepts in the knowledge graph
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {relatedConcepts && relatedConcepts.length > 0 ? (
                    relatedConcepts.map((related) => (
                      <Card key={related.id} className="border dark:border-gray-700">
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-base flex justify-between items-center">
                            <span>{related.label}</span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => onNavigateToConcept(related.id)}
                              className="h-8 px-2"
                            >
                              <ArrowRight size={16} />
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Click to navigate to this concept and explore its connections
                          </p>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-2 text-center p-8">
                      <Network className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <h3 className="text-lg font-medium">No Connections Found</h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        This concept is not connected to any other concepts yet
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sources Tab */}
          <TabsContent value="sources">
            <Card>
              <CardHeader>
                <CardTitle>Source Documents</CardTitle>
                <CardDescription>
                  Documents that mention or explain this concept
                </CardDescription>
              </CardHeader>
              <CardContent>
                {documents && documents.length > 0 ? (
                  <div className="space-y-4">
                    {documents.map((doc) => (
                      <Card key={doc.id} className="border dark:border-gray-700">
                        <CardContent className="p-4">
                          <div className="flex items-start">
                            <Book className="mr-2 text-gray-400 shrink-0 mt-1" size={18} />
                            <div>
                              <h4 className="text-base font-medium">{doc.title}</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                {doc.summary || "No summary available"}
                              </p>
                              {doc.pageCount && (
                                <div className="text-xs text-gray-400 mt-1">
                                  {doc.pageCount} pages
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <Book className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <h3 className="text-lg font-medium">No Source Documents</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      No documents referencing this concept were found
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights">
            <Card>
              <CardHeader>
                <CardTitle>AI-Generated Insights</CardTitle>
                <CardDescription>
                  Insights generated by AI to help understand this concept better
                </CardDescription>
              </CardHeader>
              <CardContent>
                {insights && insights.length > 0 ? (
                  <div className="space-y-4">
                    {insights.map((insight, idx) => (
                      <Card key={idx} className="border dark:border-gray-700">
                        <CardContent className="p-4">
                          <div className="flex">
                            <Zap className="mr-2 text-yellow-500 shrink-0 mt-1" size={18} />
                            <div>
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                {insight.content}
                              </p>
                              {insight.relatedConceptIds && insight.relatedConceptIds.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {insight.relatedConceptIds.map((id, idx) => {
                                    const related = relatedConcepts?.find(c => c.id === id);
                                    return related ? (
                                      <Badge 
                                        key={idx} 
                                        variant="outline" 
                                        className="cursor-pointer hover:bg-primary/10"
                                        onClick={() => onNavigateToConcept(id)}
                                      >
                                        {related.label}
                                      </Badge>
                                    ) : null;
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <Zap className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <h3 className="text-lg font-medium">No Insights Available</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      No AI-generated insights for this concept yet
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex sm:justify-between gap-2">
          <Button variant="outline" onClick={onClose}>
            <ArrowLeft className="mr-2" size={16} />
            <span>Back to Graph</span>
          </Button>
          <Button onClick={() => onStartLearning(concept.id)}>
            <Brain className="mr-2" size={16} />
            <span>Learn This Concept</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}