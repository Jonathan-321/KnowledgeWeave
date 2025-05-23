import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Calendar, Clock, Target, BookOpen, Award } from 'lucide-react';

interface StudySession {
  id: number;
  date: string;
  durationMinutes: number;
  conceptId: number;
  conceptName: string;
  activityType: 'quiz' | 'resource' | 'exploration' | 'notes';
  performance?: number;
}

interface DailyStudyTime {
  date: string;
  totalMinutes: number;
  conceptsStudied: number;
}

interface ConceptEngagement {
  conceptId: number;
  conceptName: string;
  timeSpentMinutes: number;
  quizPerformance: number;
  lastEngaged: string;
}

interface LearningStrengths {
  category: string;
  score: number;
  strengths: string[];
  weaknesses: string[];
}

interface StudyStatisticsProps {
  userId?: number;
  timeRange?: 'week' | 'month' | 'year';
  conceptFilter?: number;
}

const StudyStatistics: React.FC<StudyStatisticsProps> = ({
  userId,
  timeRange = 'week',
  conceptFilter
}) => {
  // In a real implementation, this would fetch data from the API
  // Here we're using mock data for demonstration
  
  const studySessions: StudySession[] = [
    {
      id: 1,
      date: '2025-05-22T14:30:00Z',
      durationMinutes: 35,
      conceptId: 101,
      conceptName: 'Quantum Computing',
      activityType: 'quiz',
      performance: 85
    },
    {
      id: 2,
      date: '2025-05-21T10:15:00Z',
      durationMinutes: 45,
      conceptId: 102,
      conceptName: 'Neural Networks',
      activityType: 'resource'
    },
    {
      id: 3,
      date: '2025-05-20T16:45:00Z',
      durationMinutes: 25,
      conceptId: 103,
      conceptName: 'Data Structures',
      activityType: 'quiz',
      performance: 92
    },
    {
      id: 4,
      date: '2025-05-19T11:30:00Z',
      durationMinutes: 40,
      conceptId: 101,
      conceptName: 'Quantum Computing',
      activityType: 'resource'
    },
    {
      id: 5,
      date: '2025-05-18T09:20:00Z',
      durationMinutes: 30,
      conceptId: 104,
      conceptName: 'Machine Learning Ethics',
      activityType: 'notes'
    }
  ];
  
  // Filter sessions by concept if specified
  const filteredSessions = conceptFilter
    ? studySessions.filter(session => session.conceptId === conceptFilter)
    : studySessions;
    
  // Calculate daily study time
  const dailyStudyTime: DailyStudyTime[] = [
    { date: '2025-05-22', totalMinutes: 35, conceptsStudied: 1 },
    { date: '2025-05-21', totalMinutes: 45, conceptsStudied: 1 },
    { date: '2025-05-20', totalMinutes: 25, conceptsStudied: 1 },
    { date: '2025-05-19', totalMinutes: 40, conceptsStudied: 1 },
    { date: '2025-05-18', totalMinutes: 60, conceptsStudied: 2 },
    { date: '2025-05-17', totalMinutes: 15, conceptsStudied: 1 },
    { date: '2025-05-16', totalMinutes: 50, conceptsStudied: 2 }
  ];
  
  // Calculate concept engagement
  const conceptEngagement: ConceptEngagement[] = [
    {
      conceptId: 101,
      conceptName: 'Quantum Computing',
      timeSpentMinutes: 75,
      quizPerformance: 85,
      lastEngaged: '2025-05-22T14:30:00Z'
    },
    {
      conceptId: 102,
      conceptName: 'Neural Networks',
      timeSpentMinutes: 45,
      quizPerformance: 80,
      lastEngaged: '2025-05-21T10:15:00Z'
    },
    {
      conceptId: 103,
      conceptName: 'Data Structures',
      timeSpentMinutes: 25,
      quizPerformance: 92,
      lastEngaged: '2025-05-20T16:45:00Z'
    },
    {
      conceptId: 104,
      conceptName: 'Machine Learning Ethics',
      timeSpentMinutes: 30,
      quizPerformance: 75,
      lastEngaged: '2025-05-18T09:20:00Z'
    }
  ];
  
  // Calculate learning strengths
  const learningStrengths: LearningStrengths[] = [
    {
      category: 'Visual Learning',
      score: 85,
      strengths: ['Diagrams', 'Videos'],
      weaknesses: []
    },
    {
      category: 'Reading Comprehension',
      score: 70,
      strengths: ['Technical Documentation'],
      weaknesses: ['Academic Papers']
    },
    {
      category: 'Interactive Learning',
      score: 90,
      strengths: ['Quizzes', 'Coding Exercises'],
      weaknesses: []
    },
    {
      category: 'Retention',
      score: 75,
      strengths: ['Spaced Repetition'],
      weaknesses: ['Long-term Memory']
    }
  ];
  
  // Calculate total study time
  const totalStudyTime = filteredSessions.reduce((total, session) => total + session.durationMinutes, 0);
  
  // Calculate average session length
  const averageSessionLength = Math.round(totalStudyTime / filteredSessions.length);
  
  // Calculate average quiz performance
  const quizSessions = filteredSessions.filter(session => session.activityType === 'quiz' && session.performance !== undefined);
  const averageQuizPerformance = quizSessions.length > 0
    ? Math.round(quizSessions.reduce((total, session) => total + (session.performance || 0), 0) / quizSessions.length)
    : 0;
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  // Get icon for activity type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'quiz':
        return <Brain className="h-4 w-4 text-purple-500" />;
      case 'resource':
        return <BookOpen className="h-4 w-4 text-blue-500" />;
      case 'exploration':
        return <Target className="h-4 w-4 text-amber-500" />;
      case 'notes':
        return <BookOpen className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Study Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudyTime} minutes</div>
            <div className="text-xs text-muted-foreground mt-1">
              {filteredSessions.length} study sessions
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Session Length</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageSessionLength} minutes</div>
            <div className="text-xs text-muted-foreground mt-1">
              Per study session
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Quiz Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageQuizPerformance}%</div>
            <Progress value={averageQuizPerformance} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="activity">
            <Clock className="h-4 w-4 mr-2" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="daily">
            <Calendar className="h-4 w-4 mr-2" />
            Daily Breakdown
          </TabsTrigger>
          <TabsTrigger value="concepts">
            <Target className="h-4 w-4 mr-2" />
            Concepts
          </TabsTrigger>
          <TabsTrigger value="strengths">
            <Award className="h-4 w-4 mr-2" />
            Learning Profile
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Study Activity</CardTitle>
              <CardDescription>Your learning sessions over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredSessions.map(session => (
                  <div key={session.id} className="flex items-center border-b pb-3 last:border-0 last:pb-0">
                    <div className="bg-slate-100 rounded-full p-2 mr-3">
                      {getActivityIcon(session.activityType)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{session.conceptName}</div>
                      <div className="text-sm text-muted-foreground">
                        {session.activityType === 'quiz' ? 'Quiz session' : 
                         session.activityType === 'resource' ? 'Resource study' :
                         session.activityType === 'notes' ? 'Note taking' : 'Concept exploration'}
                        {session.performance ? ` - ${session.performance}% score` : ''}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{session.durationMinutes} min</div>
                      <div className="text-xs text-muted-foreground">{formatDate(session.date)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="daily" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Study Time</CardTitle>
              <CardDescription>Your study habits throughout the week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dailyStudyTime.map(day => (
                  <div key={day.date} className="flex items-center">
                    <div className="w-24 text-sm">{formatDate(day.date)}</div>
                    <div className="flex-1">
                      <div className="h-8 bg-slate-100 rounded-lg relative overflow-hidden">
                        <div 
                          className="absolute top-0 left-0 h-full bg-blue-500 flex items-center"
                          style={{ width: `${Math.min(100, (day.totalMinutes / 120) * 100)}%` }}
                        >
                          <span className="text-white text-xs px-2">
                            {day.totalMinutes} min
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="w-24 text-right text-sm text-muted-foreground">
                      {day.conceptsStudied} concept{day.conceptsStudied !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-xs text-muted-foreground">
                * Bar length represents study time relative to maximum daily time (120 min)
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="concepts" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Concept Engagement</CardTitle>
              <CardDescription>Time spent on different topics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {conceptEngagement.map(concept => (
                  <div key={concept.conceptId} className="space-y-2">
                    <div className="flex justify-between">
                      <div className="font-medium">{concept.conceptName}</div>
                      <div className="text-sm text-muted-foreground">
                        Last studied: {formatDate(concept.lastEngaged)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1 text-blue-500" /> Time Spent
                          </span>
                          <span>{concept.timeSpentMinutes} min</span>
                        </div>
                        <Progress 
                          value={Math.min(100, (concept.timeSpentMinutes / 120) * 100)} 
                          className="h-2" 
                        />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="flex items-center">
                            <Brain className="h-4 w-4 mr-1 text-purple-500" /> Quiz Performance
                          </span>
                          <span>{concept.quizPerformance}%</span>
                        </div>
                        <Progress value={concept.quizPerformance} className="h-2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="strengths" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Learning Profile</CardTitle>
              <CardDescription>Your strengths and areas for improvement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {learningStrengths.map(category => (
                  <div key={category.category} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="font-medium">{category.category}</div>
                      <div className="text-sm">{category.score}%</div>
                    </div>
                    
                    <Progress value={category.score} className="h-2" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div>
                        <div className="text-xs font-medium text-green-600 mb-1">Strengths:</div>
                        <div className="flex flex-wrap gap-1">
                          {category.strengths.map(strength => (
                            <span 
                              key={strength}
                              className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full"
                            >
                              {strength}
                            </span>
                          ))}
                          {category.strengths.length === 0 && (
                            <span className="text-xs text-muted-foreground">None identified yet</span>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-xs font-medium text-amber-600 mb-1">Areas to improve:</div>
                        <div className="flex flex-wrap gap-1">
                          {category.weaknesses.map(weakness => (
                            <span 
                              key={weakness}
                              className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full"
                            >
                              {weakness}
                            </span>
                          ))}
                          {category.weaknesses.length === 0 && (
                            <span className="text-xs text-muted-foreground">No weaknesses identified</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudyStatistics;
