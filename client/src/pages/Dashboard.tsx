import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  BarChart,
  Brain,
  BookOpen,
  Calendar,
  Clock,
  Star,
  ArrowRight,
  AlertTriangle,
  Target,
  Check,
  TrendingUp,
  List
} from 'lucide-react';

interface LearningProgressItem {
  id: number;
  conceptId: number;
  conceptName: string;
  comprehension: number;
  practice: number;
  lastReviewed: string;
  nextReviewDate: string;
  interval: number;
  knowledgeGaps?: string[];
}

interface RecentActivity {
  id: number;
  type: 'resource_view' | 'quiz_completion' | 'note_creation' | 'concept_exploration';
  conceptId: number;
  conceptName: string;
  timestamp: string;
  details: {
    resourceTitle?: string;
    quizScore?: number;
    duration?: number;
  };
}

interface StudyRecommendation {
  id: number;
  conceptId: number;
  conceptName: string;
  recommendationType: 'review_due' | 'knowledge_gap' | 'popular' | 'prerequisite';
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Fetch user learning progress
  const { data: learningProgress = [], isLoading: isLoadingProgress } = useQuery({
    queryKey: ['/api/learning/progress'],
    queryFn: async () => {
      // For demo, return mock data
      return [
        {
          id: 1,
          conceptId: 101,
          conceptName: 'Quantum Computing',
          comprehension: 75,
          practice: 65,
          lastReviewed: '2025-05-20T15:30:00Z',
          nextReviewDate: '2025-05-25T00:00:00Z',
          interval: 5,
          knowledgeGaps: ['Quantum Gates', 'Entanglement']
        },
        {
          id: 2,
          conceptId: 102,
          conceptName: 'Neural Networks',
          comprehension: 85,
          practice: 80,
          lastReviewed: '2025-05-21T10:15:00Z',
          nextReviewDate: '2025-05-28T00:00:00Z',
          interval: 7,
          knowledgeGaps: ['Backpropagation']
        },
        {
          id: 3,
          conceptId: 103,
          conceptName: 'Data Structures',
          comprehension: 90,
          practice: 85,
          lastReviewed: '2025-05-19T14:45:00Z',
          nextReviewDate: '2025-05-24T00:00:00Z',
          interval: 5
        }
      ] as LearningProgressItem[];
    }
  });
  
  // Fetch recent activity
  const { data: recentActivity = [], isLoading: isLoadingActivity } = useQuery({
    queryKey: ['/api/user/activity'],
    queryFn: async () => {
      // For demo, return mock data
      return [
        {
          id: 1,
          type: 'quiz_completion',
          conceptId: 101,
          conceptName: 'Quantum Computing',
          timestamp: '2025-05-22T15:30:00Z',
          details: {
            quizScore: 80,
            duration: 15
          }
        },
        {
          id: 2,
          type: 'resource_view',
          conceptId: 102,
          conceptName: 'Neural Networks',
          timestamp: '2025-05-22T13:45:00Z',
          details: {
            resourceTitle: 'Introduction to Deep Learning'
          }
        },
        {
          id: 3,
          type: 'concept_exploration',
          conceptId: 103,
          conceptName: 'Data Structures',
          timestamp: '2025-05-22T11:20:00Z',
          details: {}
        }
      ] as RecentActivity[];
    }
  });
  
  // Fetch study recommendations
  const { data: recommendations = [], isLoading: isLoadingRecommendations } = useQuery({
    queryKey: ['/api/learning/recommendations'],
    queryFn: async () => {
      // For demo, return mock data
      return [
        {
          id: 1,
          conceptId: 101,
          conceptName: 'Quantum Computing',
          recommendationType: 'knowledge_gap',
          priority: 'high',
          reason: 'You have knowledge gaps in Quantum Gates and Entanglement'
        },
        {
          id: 2,
          conceptId: 103,
          conceptName: 'Data Structures',
          recommendationType: 'review_due',
          priority: 'medium',
          reason: 'Review due tomorrow based on your spaced repetition schedule'
        },
        {
          id: 3,
          conceptId: 104,
          conceptName: 'Machine Learning Ethics',
          recommendationType: 'popular',
          priority: 'low',
          reason: 'Popular among users with similar interests'
        }
      ] as StudyRecommendation[];
    }
  });
  
  // Format timestamp to relative time
  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
  };
  
  // Get review due status
  const getReviewStatus = (nextReviewDate: string) => {
    const reviewDate = new Date(nextReviewDate);
    const now = new Date();
    const diffInDays = Math.floor((reviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 0) {
      return { status: 'overdue', text: 'Overdue', color: 'text-red-600 bg-red-100' };
    } else if (diffInDays === 0) {
      return { status: 'today', text: 'Today', color: 'text-green-600 bg-green-100' };
    } else if (diffInDays === 1) {
      return { status: 'tomorrow', text: 'Tomorrow', color: 'text-blue-600 bg-blue-100' };
    } else {
      return { status: 'upcoming', text: `In ${diffInDays} days`, color: 'text-gray-600 bg-gray-100' };
    }
  };
  
  // Calculate average progress
  const averageComprehension = learningProgress.length > 0
    ? Math.round(learningProgress.reduce((sum, item) => sum + item.comprehension, 0) / learningProgress.length)
    : 0;
  
  const averagePractice = learningProgress.length > 0
    ? Math.round(learningProgress.reduce((sum, item) => sum + item.practice, 0) / learningProgress.length)
    : 0;
  
  // Get upcoming reviews
  const upcomingReviews = [...learningProgress]
    .sort((a, b) => new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime())
    .slice(0, 3);
  
  // Get activity icon
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'quiz_completion':
        return <Brain className="h-5 w-5 text-purple-500" />;
      case 'resource_view':
        return <BookOpen className="h-5 w-5 text-blue-500" />;
      case 'note_creation':
        return <List className="h-5 w-5 text-green-500" />;
      case 'concept_exploration':
        return <Target className="h-5 w-5 text-amber-500" />;
      default:
        return <Star className="h-5 w-5 text-gray-500" />;
    }
  };
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
      <p className="text-muted-foreground mb-6">Your personalized learning hub</p>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="progress">
            <TrendingUp className="h-4 w-4 mr-2" />
            Learning Progress
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Clock className="h-4 w-4 mr-2" />
            Recent Activity
          </TabsTrigger>
          <TabsTrigger value="recommendations">
            <Star className="h-4 w-4 mr-2" />
            Recommendations
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average Comprehension</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averageComprehension}%</div>
                <Progress value={averageComprehension} className="h-2 mt-2" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average Practice</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averagePractice}%</div>
                <Progress value={averagePractice} className="h-2 mt-2" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Concepts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{learningProgress.length}</div>
                <div className="text-xs text-muted-foreground mt-2">
                  Concepts in your learning journey
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Upcoming Reviews</CardTitle>
                <CardDescription>Based on your spaced repetition schedule</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingReviews.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingReviews.map(item => {
                      const reviewStatus = getReviewStatus(item.nextReviewDate);
                      
                      return (
                        <div key={item.id} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                            <div>
                              <div className="font-medium">{item.conceptName}</div>
                              <div className="text-sm text-muted-foreground">
                                Interval: {item.interval} days
                              </div>
                            </div>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${reviewStatus.color}`}>
                            {reviewStatus.text}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No upcoming reviews
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveTab('progress')}>
                  View All Progress
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest learning actions</CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.slice(0, 3).map(activity => (
                      <div key={activity.id} className="flex items-start">
                        <div className="mr-3 mt-0.5">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{activity.conceptName}</div>
                          <div className="text-sm text-muted-foreground">
                            {activity.type === 'quiz_completion' && `Quiz: ${activity.details.quizScore}% score`}
                            {activity.type === 'resource_view' && `Resource: ${activity.details.resourceTitle}`}
                            {activity.type === 'concept_exploration' && 'Explored concept'}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatRelativeTime(activity.timestamp)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No recent activity
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveTab('activity')}>
                  View All Activity
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Study Recommendations</CardTitle>
              <CardDescription>Personalized suggestions based on your learning patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recommendations.slice(0, 3).map(recommendation => (
                  <div 
                    key={recommendation.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center mb-3">
                      {recommendation.recommendationType === 'knowledge_gap' && (
                        <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                      )}
                      {recommendation.recommendationType === 'review_due' && (
                        <Calendar className="h-5 w-5 text-blue-500 mr-2" />
                      )}
                      {recommendation.recommendationType === 'popular' && (
                        <Star className="h-5 w-5 text-purple-500 mr-2" />
                      )}
                      <div className="font-medium">{recommendation.conceptName}</div>
                    </div>
                    <div className="text-sm text-muted-foreground mb-3">
                      {recommendation.reason}
                    </div>
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${recommendation.priority === 'high' ? 'bg-red-100 text-red-800' : 
                        recommendation.priority === 'medium' ? 'bg-amber-100 text-amber-800' : 
                        'bg-blue-100 text-blue-800'}`}
                    >
                      {recommendation.priority === 'high' ? 'High Priority' : 
                       recommendation.priority === 'medium' ? 'Medium Priority' : 'Low Priority'}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveTab('recommendations')}>
                View All Recommendations
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Learning Progress</CardTitle>
              <CardDescription>Track your progress across all concepts</CardDescription>
            </CardHeader>
            <CardContent>
              {learningProgress.length > 0 ? (
                <div className="space-y-6">
                  {learningProgress.map(item => {
                    const reviewStatus = getReviewStatus(item.nextReviewDate);
                    
                    return (
                      <div key={item.id} className="border-b pb-4 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium text-lg">{item.conceptName}</div>
                          <div className={`px-2 py-1 rounded-full text-xs ${reviewStatus.color}`}>
                            {reviewStatus.text}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium flex items-center">
                                <Brain className="h-4 w-4 mr-1 text-blue-500" /> Comprehension
                              </span>
                              <span>{item.comprehension}%</span>
                            </div>
                            <Progress value={item.comprehension} className="h-2" />
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium flex items-center">
                                <Target className="h-4 w-4 mr-1 text-green-500" /> Practice
                              </span>
                              <span>{item.practice}%</span>
                            </div>
                            <Progress value={item.practice} className="h-2" />
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-3">
                          <div className="text-xs flex items-center text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            Last reviewed {formatRelativeTime(item.lastReviewed)}
                          </div>
                          <div className="text-xs flex items-center text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            Interval: {item.interval} days
                          </div>
                          
                          {item.knowledgeGaps && item.knowledgeGaps.length > 0 && (
                            <div className="ml-auto">
                              <div className="text-xs flex items-center text-amber-600">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Knowledge gaps: 
                                <span className="ml-1">
                                  {item.knowledgeGaps.join(', ')}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2 mt-3">
                          <Button 
                            size="sm" 
                            onClick={() => navigate(`/concepts/${item.conceptId}`)}
                          >
                            Study Now
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/quiz/${item.conceptId}`)}
                          >
                            Take Quiz
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-muted-foreground mb-4">
                    You haven't started learning any concepts yet
                  </div>
                  <Button onClick={() => navigate('/concepts')}>
                    Explore Concepts
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your learning journey over time</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map(activity => (
                    <div key={activity.id} className="flex items-start border-b pb-4 last:border-0 last:pb-0">
                      <div className="mr-3 mt-0.5">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{activity.conceptName}</div>
                        <div className="text-sm">
                          {activity.type === 'quiz_completion' && (
                            <div className="flex items-center mt-1">
                              <Brain className="h-4 w-4 mr-1 text-purple-500" />
                              <span>
                                Completed quiz with {activity.details.quizScore}% score
                                {activity.details.duration && 
                                  ` (${activity.details.duration} min)`}
                              </span>
                            </div>
                          )}
                          {activity.type === 'resource_view' && (
                            <div className="flex items-center mt-1">
                              <BookOpen className="h-4 w-4 mr-1 text-blue-500" />
                              <span>Viewed resource: {activity.details.resourceTitle}</span>
                            </div>
                          )}
                          {activity.type === 'concept_exploration' && (
                            <div className="flex items-center mt-1">
                              <Target className="h-4 w-4 mr-1 text-amber-500" />
                              <span>Explored concept details</span>
                            </div>
                          )}
                          {activity.type === 'note_creation' && (
                            <div className="flex items-center mt-1">
                              <List className="h-4 w-4 mr-1 text-green-500" />
                              <span>Created study notes</span>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatRelativeTime(activity.timestamp)}
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="ml-2"
                        onClick={() => navigate(`/concepts/${activity.conceptId}`)}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No activity recorded yet. Start learning to see your activity here.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Study Recommendations</CardTitle>
              <CardDescription>Personalized suggestions to optimize your learning</CardDescription>
            </CardHeader>
            <CardContent>
              {recommendations.length > 0 ? (
                <div className="space-y-4">
                  {recommendations.map(recommendation => (
                    <div 
                      key={recommendation.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center">
                          {recommendation.recommendationType === 'knowledge_gap' && (
                            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                          )}
                          {recommendation.recommendationType === 'review_due' && (
                            <Calendar className="h-5 w-5 text-blue-500 mr-2" />
                          )}
                          {recommendation.recommendationType === 'popular' && (
                            <Star className="h-5 w-5 text-purple-500 mr-2" />
                          )}
                          {recommendation.recommendationType === 'prerequisite' && (
                            <BookOpen className="h-5 w-5 text-green-500 mr-2" />
                          )}
                          <div className="font-medium text-lg">{recommendation.conceptName}</div>
                        </div>
                        <div className={`px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${recommendation.priority === 'high' ? 'bg-red-100 text-red-800' : 
                            recommendation.priority === 'medium' ? 'bg-amber-100 text-amber-800' : 
                            'bg-blue-100 text-blue-800'}`}
                        >
                          {recommendation.priority === 'high' ? 'High Priority' : 
                           recommendation.priority === 'medium' ? 'Medium Priority' : 'Low Priority'}
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground mb-4">
                        {recommendation.reason}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => navigate(`/concepts/${recommendation.conceptId}`)}
                        >
                          Study Now
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => navigate(`/quiz/${recommendation.conceptId}`)}
                        >
                          Take Quiz
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No recommendations available</AlertTitle>
                  <AlertDescription>
                    Continue using the application to receive personalized recommendations
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
