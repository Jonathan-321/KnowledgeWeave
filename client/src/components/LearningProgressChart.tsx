import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Brain, Calendar, Clock, TrendingUp, AlertTriangle } from 'lucide-react';

interface LearningProgressProps {
  progress: {
    comprehension: number;
    practice: number;
    interval: number;
    nextReviewDate: Date | string;
    reviewCount: number;
    knowledgeGaps?: string[];
  };
  conceptName?: string;
}

export const LearningProgressChart: React.FC<LearningProgressProps> = ({ 
  progress, 
  conceptName = 'this concept'
}) => {
  // Calculate days until next review
  const nextReviewDate = progress.nextReviewDate instanceof Date 
    ? progress.nextReviewDate 
    : new Date(progress.nextReviewDate);
  
  const daysUntilReview = Math.max(
    0, 
    Math.ceil((nextReviewDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  );
  
  // Format next review date
  const formatReviewDate = () => {
    if (daysUntilReview === 0) {
      return 'Today';
    } else if (daysUntilReview === 1) {
      return 'Tomorrow';
    } else {
      return `In ${daysUntilReview} days`;
    }
  };
  
  // Calculate memory strength (derived from interval and ease factor)
  const memoryStrength = Math.min(100, Math.round((progress.interval / 30) * 100));
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Brain className="mr-2 h-5 w-5 text-primary" />
          Learning Progress for {conceptName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Comprehension */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium flex items-center">
                <TrendingUp className="mr-1 h-4 w-4 text-blue-500" />
                Comprehension
              </span>
              <span className="text-blue-600 font-semibold">{progress.comprehension}%</span>
            </div>
            <Progress value={progress.comprehension} className="h-2 bg-blue-100" 
              style={{ '--theme-primary': 'hsl(221, 83%, 53%)' } as React.CSSProperties} />
          </div>
          
          {/* Practice */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium flex items-center">
                <Clock className="mr-1 h-4 w-4 text-green-500" />
                Practice Proficiency
              </span>
              <span className="text-green-600 font-semibold">{progress.practice}%</span>
            </div>
            <Progress value={progress.practice} className="h-2 bg-green-100" 
              style={{ '--theme-primary': 'hsl(142, 71%, 45%)' } as React.CSSProperties} />
          </div>
        </div>
        
        {/* Spaced Repetition Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-blue-50 p-3 rounded-md">
            <div className="text-sm text-blue-800 font-medium mb-1 flex items-center">
              <Calendar className="mr-1 h-4 w-4" />
              Next Review
            </div>
            <div className="font-semibold text-blue-900">{formatReviewDate()}</div>
          </div>
          
          <div className="bg-green-50 p-3 rounded-md">
            <div className="text-sm text-green-800 font-medium mb-1">Memory Strength</div>
            <Progress value={memoryStrength} className="h-2 bg-green-200" 
              style={{ '--theme-primary': 'hsl(142, 71%, 45%)' } as React.CSSProperties} />
            <div className="text-xs text-green-700 mt-1">
              {progress.reviewCount} review{progress.reviewCount !== 1 ? 's' : ''} completed
            </div>
          </div>
          
          <div className="bg-amber-50 p-3 rounded-md">
            <div className="text-sm text-amber-800 font-medium mb-1 flex items-center">
              <AlertTriangle className="mr-1 h-4 w-4" />
              Study Interval
            </div>
            <div className="font-semibold text-amber-900">
              {progress.interval} day{progress.interval !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        
        {/* Knowledge Gaps */}
        {progress.knowledgeGaps && progress.knowledgeGaps.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2 flex items-center">
              <AlertTriangle className="mr-1 h-4 w-4 text-amber-500" />
              Areas to Focus On
            </h4>
            <div className="flex flex-wrap gap-2">
              {progress.knowledgeGaps.map((gap, index) => (
                <span key={index} className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                  {gap}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LearningProgressChart;
