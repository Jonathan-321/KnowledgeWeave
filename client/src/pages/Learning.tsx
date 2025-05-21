import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdaptiveQuiz } from '@/components/AdaptiveQuiz';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Calendar, BookOpen, BarChart, ArrowLeft } from 'lucide-react';

export default function Learning() {
  const [selectedConceptId, setSelectedConceptId] = useState<number | null>(null);
  const [location, navigate] = useLocation();
  
  // Check URL parameters for conceptId on component mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const conceptId = params.get('conceptId');
    
    if (conceptId && !isNaN(parseInt(conceptId))) {
      setSelectedConceptId(parseInt(conceptId));
    }
  }, []);
  
  // Fetch all concepts
  const { data: concepts, isLoading: isLoadingConcepts } = useQuery({
    queryKey: ['/api/concepts'],
  });
  
  // Fetch learning progress data
  const { data: learningProgress, isLoading: isLoadingProgress } = useQuery({
    queryKey: ['/api/learning'],
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  // Get learning status and due date
  const getLearningStatus = (conceptId: number) => {
    if (!learningProgress) return { status: 'Not Started', dueDate: 'Start now' };
    
    const progress = learningProgress.find((p: any) => p.conceptId === conceptId);
    if (!progress) return { status: 'Not Started', dueDate: 'Start now' };
    
    const now = new Date();
    const nextReview = progress.nextReviewDate ? new Date(progress.nextReviewDate) : null;
    
    if (!nextReview) return { status: 'Not Scheduled', dueDate: 'Review now' };
    
    if (nextReview < now) {
      return { 
        status: 'Due', 
        dueDate: `Due ${formatDate(progress.nextReviewDate)}`,
        progress
      };
    }
    
    return { 
      status: 'Scheduled', 
      dueDate: `Next: ${formatDate(progress.nextReviewDate)}`,
      progress
    };
  };
  
  // If in quiz mode, show the adaptive quiz
  if (selectedConceptId) {
    return (
      <div className="container mx-auto py-6 max-w-5xl">
        <Button 
          className="mb-6" 
          variant="outline" 
          onClick={() => setSelectedConceptId(null)}
        >
          ← Back to Concepts
        </Button>
        
        <AdaptiveQuiz conceptId={selectedConceptId} />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Adaptive Learning</h1>
        <p className="text-muted-foreground mt-2">
          Practice concepts using AI-powered spaced repetition for efficient learning
        </p>
      </div>
      
      <Tabs defaultValue="learning">
        <TabsList className="mb-4">
          <TabsTrigger value="learning">
            <Brain className="h-4 w-4 mr-2" />
            Learning
          </TabsTrigger>
          <TabsTrigger value="schedule">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="progress">
            <BarChart className="h-4 w-4 mr-2" />
            Progress
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="learning" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoadingConcepts ? (
              <p>Loading concepts...</p>
            ) : (
              concepts?.map((concept: any) => {
                const { status, dueDate, progress } = getLearningStatus(concept.id);
                return (
                  <Card key={concept.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{concept.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                          <div>
                            <span className={
                              status === 'Due' 
                                ? 'text-red-500 font-medium'
                                : status === 'Scheduled'
                                  ? 'text-blue-500 font-medium'
                                  : 'text-muted-foreground'
                            }>
                              {status}
                            </span>
                          </div>
                          <div>{dueDate}</div>
                        </div>
                        
                        {progress && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Comprehension</span>
                              <span>{progress.comprehension}%</span>
                            </div>
                            <Progress value={progress.comprehension} className="h-2" />
                            
                            <div className="flex justify-between text-sm mt-2">
                              <span>Practice</span>
                              <span>{progress.practice}%</span>
                            </div>
                            <Progress value={progress.practice} className="h-2" />
                            
                            <div className="flex justify-between text-sm text-muted-foreground mt-1">
                              <span>Review count: {progress.reviewCount || 0}</span>
                              <span>Interval: {progress.interval || 0} days</span>
                            </div>
                          </div>
                        )}
                        
                        <Button 
                          className="w-full mt-2"
                          onClick={() => setSelectedConceptId(concept.id)}
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          {status === 'Not Started' ? 'Start Learning' : 'Practice Now'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Study Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Your personalized study schedule based on spaced repetition algorithm.
                Review concepts when they're due to maximize long-term retention.
              </p>
              
              <div className="mt-4 space-y-4">
                {isLoadingProgress ? (
                  <p>Loading schedule...</p>
                ) : learningProgress?.length > 0 ? (
                  learningProgress
                    .filter((p: any) => p.nextReviewDate)
                    .sort((a: any, b: any) => new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime())
                    .map((progress: any) => {
                      const concept = concepts?.find((c: any) => c.id === progress.conceptId);
                      const now = new Date();
                      const nextReview = new Date(progress.nextReviewDate);
                      const isDue = nextReview < now;
                      
                      return (
                        <div key={progress.id} className="flex justify-between items-center p-3 border rounded">
                          <div>
                            <div className="font-medium">{concept?.name || `Concept #${progress.conceptId}`}</div>
                            <div className="text-sm text-muted-foreground">
                              {isDue ? 'Due: ' : 'Next review: '}
                              {formatDate(progress.nextReviewDate)}
                            </div>
                          </div>
                          <Button 
                            variant={isDue ? "default" : "outline"} 
                            onClick={() => setSelectedConceptId(progress.conceptId)}
                          >
                            {isDue ? 'Review Now' : 'Practice'}
                          </Button>
                        </div>
                      );
                    })
                ) : (
                  <p>No scheduled reviews yet. Start learning concepts to build your schedule.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle>Learning Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Track your progress across all concepts with detailed statistics.
              </p>
              
              {isLoadingProgress || isLoadingConcepts ? (
                <p>Loading progress data...</p>
              ) : (
                <div className="space-y-6">
                  {concepts?.map((concept: any) => {
                    const progress = learningProgress?.find((p: any) => p.conceptId === concept.id);
                    if (!progress) return null;
                    
                    return (
                      <div key={concept.id} className="space-y-2">
                        <div className="font-medium">{concept.name}</div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="flex justify-between text-sm">
                              <span>Comprehension</span>
                              <span>{progress.comprehension}%</span>
                            </div>
                            <Progress value={progress.comprehension} className="h-2" />
                          </div>
                          
                          <div>
                            <div className="flex justify-between text-sm">
                              <span>Practice</span>
                              <span>{progress.practice}%</span>
                            </div>
                            <Progress value={progress.practice} className="h-2" />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
                          <div>Reviews: {progress.reviewCount || 0}</div>
                          <div>Interval: {progress.interval || 0} days</div>
                          <div>Ease: {(progress.easeFactor ? progress.easeFactor / 100 : 2.5).toFixed(2)}</div>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          Last reviewed: {progress.lastReviewed ? formatDate(progress.lastReviewed) : 'Never'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}