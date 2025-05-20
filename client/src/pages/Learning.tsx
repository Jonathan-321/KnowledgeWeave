import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, ChevronRight, Award, Clock, RotateCcw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProgressBar from "@/components/ProgressBar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ConceptDetails from "@/components/ConceptDetails";
import { Concept } from "@shared/schema";

export default function Learning() {
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: concepts = [] } = useQuery({
    queryKey: ["/api/concepts"],
  });

  const { data: learningProgress = [] } = useQuery({
    queryKey: ["/api/learning"],
  });

  const startLearningSession = useMutation({
    mutationFn: async (conceptId: number) => {
      const response = await apiRequest(
        "GET",
        `/api/quiz/${conceptId}`
      );
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Learning session started",
        description: "Quiz questions have been generated",
      });
      setQuizOpen(true);
    },
    onError: (error) => {
      toast({
        title: "Failed to start learning session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateProgress = useMutation({
    mutationFn: async ({ conceptId, data }: { conceptId: number; data: { comprehension: number; practice: number } }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/learning/${conceptId}`,
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/learning"] });
      toast({
        title: "Progress updated",
        description: "Your learning progress has been updated",
      });
    },
  });

  const getDueForReview = () => {
    if (!learningProgress) return [];
    
    const now = new Date();
    return learningProgress.filter((progress: any) => {
      return new Date(progress.nextReviewDate) <= now;
    });
  };

  const dueForReview = getDueForReview();

  const getConceptName = (conceptId: number) => {
    const concept = concepts.find((c: any) => c.id === conceptId);
    return concept ? concept.name : "Unknown concept";
  };

  const handleStartSession = (conceptId: number) => {
    const concept = concepts.find((c: any) => c.id === conceptId);
    if (concept) {
      setSelectedConcept(concept);
      startLearningSession.mutate(conceptId);
    }
  };

  return (
    <div className="flex-1 p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Learning Dashboard</CardTitle>
          <CardDescription>Track your learning progress and review concepts using spaced repetition</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="progress">
            <TabsList className="mb-4">
              <TabsTrigger value="progress">Learning Progress</TabsTrigger>
              <TabsTrigger value="due">Due for Review ({dueForReview.length})</TabsTrigger>
              <TabsTrigger value="all">All Concepts</TabsTrigger>
            </TabsList>
            
            <TabsContent value="progress">
              {learningProgress && learningProgress.length > 0 ? (
                <div className="space-y-4">
                  {learningProgress.map((progress: any) => (
                    <Card key={progress.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-base font-medium">{getConceptName(progress.conceptId)}</h3>
                          <Button variant="ghost" size="sm" onClick={() => handleStartSession(progress.conceptId)}>
                            <Brain className="mr-1" size={16} />
                            <span>Practice</span>
                          </Button>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Comprehension</span>
                              <span className="text-green-600 dark:text-green-400 font-medium">{progress.comprehension}%</span>
                            </div>
                            <ProgressBar value={progress.comprehension} color="green" />
                          </div>
                          
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Practice</span>
                              <span className="text-blue-600 dark:text-blue-400 font-medium">{progress.practice}%</span>
                            </div>
                            <ProgressBar value={progress.practice} color="blue" />
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center mt-3 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center">
                            <Clock size={14} className="mr-1" />
                            <span>Last reviewed: {new Date(progress.lastReviewed).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center">
                            <RotateCcw size={14} className="mr-1" />
                            <span>Next review: {new Date(progress.nextReviewDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 border border-dashed rounded-lg">
                  <div className="mb-2">
                    <Award className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <h3 className="text-lg font-medium">No Learning Progress Yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Start learning concepts to track your progress over time
                    </p>
                    <Button>Start Learning</Button>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="due">
              {dueForReview.length > 0 ? (
                <div className="space-y-4">
                  {dueForReview.map((progress: any) => (
                    <Card key={progress.id} className="border-l-4 border-l-yellow-500">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-base font-medium">{getConceptName(progress.conceptId)}</h3>
                            <p className="text-sm text-yellow-600 dark:text-yellow-400">Due for review today</p>
                          </div>
                          <Button onClick={() => handleStartSession(progress.conceptId)}>
                            Start Review
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 border border-dashed rounded-lg">
                  <div>
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <h3 className="text-lg font-medium">No Concepts Due for Review</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      You're all caught up with your learning schedule!
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="all">
              {concepts && concepts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {concepts.map((concept: any) => (
                    <Card key={concept.id}>
                      <CardContent className="p-4">
                        <h3 className="text-base font-medium mb-1">{concept.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                          {concept.description}
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => handleStartSession(concept.id)}
                        >
                          <Brain className="mr-1" size={16} />
                          <span>Learn This Concept</span>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 border border-dashed rounded-lg">
                  <div>
                    <Brain className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <h3 className="text-lg font-medium">No Concepts Available</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Upload documents to automatically extract concepts
                    </p>
                    <Button>Upload Document</Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Learning Strategy</CardTitle>
          <CardDescription>Understanding the spaced repetition system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg bg-neutral-100 dark:bg-gray-800 p-4">
              <h3 className="font-medium text-base mb-2">Spaced Repetition</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                NexusLearn uses a spaced repetition algorithm to help you learn more effectively.
                Concepts are reviewed at increasing intervals to maximize long-term retention.
              </p>
            </div>
            
            <div className="rounded-lg bg-neutral-100 dark:bg-gray-800 p-4">
              <h3 className="font-medium text-base mb-2">Progress Tracking</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Your learning progress is tracked across two dimensions:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 mt-2 space-y-1">
                <li><span className="font-medium text-green-600 dark:text-green-400">Comprehension</span> - How well you understand the concept</li>
                <li><span className="font-medium text-blue-600 dark:text-blue-400">Practice</span> - How much you've practiced applying the concept</li>
              </ul>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full">
            <span>Learn More About Effective Learning</span>
            <ChevronRight size={16} className="ml-1" />
          </Button>
        </CardFooter>
      </Card>
      
      {quizOpen && selectedConcept && (
        <ConceptDetails 
          concept={selectedConcept}
          onClose={() => setQuizOpen(false)}
          updateProgress={(data) => {
            updateProgress.mutate({ conceptId: selectedConcept.id, data });
          }}
        />
      )}
    </div>
  );
}
