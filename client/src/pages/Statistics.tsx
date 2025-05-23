import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, BarChart3, PieChart, LineChart } from 'lucide-react';
import StudyStatistics from '@/components/StudyStatistics';

const Statistics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  const [activeTab, setActiveTab] = useState('overview');
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Learning Statistics</h1>
          <p className="text-muted-foreground">Visualize your learning progress and patterns</p>
        </div>
        
        <div className="flex items-center">
          <span className="text-sm mr-2">Time range:</span>
          <Select value={timeRange} onValueChange={(value: 'week' | 'month' | 'year') => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Past Week</SelectItem>
              <SelectItem value="month">Past Month</SelectItem>
              <SelectItem value="year">Past Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Study Overview
          </TabsTrigger>
          <TabsTrigger value="concepts">
            <PieChart className="h-4 w-4 mr-2" />
            Concepts
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <Calendar className="h-4 w-4 mr-2" />
            Study Calendar
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <StudyStatistics timeRange={timeRange} />
        </TabsContent>
        
        <TabsContent value="concepts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Concept Distribution</CardTitle>
              <CardDescription>Time spent across different concepts</CardDescription>
            </CardHeader>
            <CardContent className="h-80 flex items-center justify-center">
              <div className="text-muted-foreground text-center">
                <PieChart className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Interactive concept distribution chart will be displayed here</p>
                <p className="text-sm">Shows time allocation across different study topics</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Mastery Progress</CardTitle>
              <CardDescription>Comprehension levels across concepts</CardDescription>
            </CardHeader>
            <CardContent className="h-80 flex items-center justify-center">
              <div className="text-muted-foreground text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Interactive mastery chart will be displayed here</p>
                <p className="text-sm">Shows proficiency levels across different concepts</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Study Calendar</CardTitle>
              <CardDescription>Your learning activity over time</CardDescription>
            </CardHeader>
            <CardContent className="h-96 flex items-center justify-center">
              <div className="text-muted-foreground text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Interactive calendar heatmap will be displayed here</p>
                <p className="text-sm">Shows study activity patterns over time</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Study Streaks</CardTitle>
              <CardDescription>Consistency in your learning journey</CardDescription>
            </CardHeader>
            <CardContent className="h-60 flex items-center justify-center">
              <div className="text-muted-foreground text-center">
                <LineChart className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Study streak visualization will be displayed here</p>
                <p className="text-sm">Shows your consistency and learning streaks</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Statistics;
