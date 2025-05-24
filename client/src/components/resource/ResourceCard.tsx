import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Star, Clock, Calendar, ExternalLink, BookOpen, Play, Zap, Code, FileText, BarChart } from 'lucide-react';
import { EnhancedResource } from '@shared/enhancedSchemaTypes';

interface ResourceCardProps {
  resource: EnhancedResource;
  userLearningStyle?: {
    visual: number;
    auditory: number;
    reading: number;
    kinesthetic: number;
  };
  compact?: boolean;
  onSelect?: (resource: EnhancedResource) => void;
}

const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  userLearningStyle,
  compact = false,
  onSelect
}) => {
  // Get icon based on resource type
  const getResourceIcon = () => {
    switch (resource.type) {
      case 'video':
        return <Play className="h-4 w-4 text-blue-500" />;
      case 'article':
        return <FileText className="h-4 w-4 text-green-500" />;
      case 'interactive':
        return <Zap className="h-4 w-4 text-purple-500" />;
      case 'course':
        return <BookOpen className="h-4 w-4 text-amber-500" />;
      case 'book':
        return <BookOpen className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get badge style based on quality
  const getQualityBadgeStyle = () => {
    switch (resource.quality) {
      case 'high':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'low':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Calculate learning style match percentage
  const calculateStyleMatch = () => {
    if (!userLearningStyle) return null;
    
    // Sum of weights (all equal in this case)
    const totalWeight = 1;
    
    // Calculate weighted match percentage
    const match = (
      (resource.learningStyleFit.visual * userLearningStyle.visual) +
      (resource.learningStyleFit.auditory * userLearningStyle.auditory) +
      (resource.learningStyleFit.reading * userLearningStyle.reading) +
      (resource.learningStyleFit.kinesthetic * userLearningStyle.kinesthetic)
    ) / (
      (userLearningStyle.visual + userLearningStyle.auditory + 
       userLearningStyle.reading + userLearningStyle.kinesthetic) * 100
    ) * 100;
    
    return Math.round(match);
  };

  // Get learning style match description
  const getStyleMatchDescription = (matchPercentage: number) => {
    if (matchPercentage >= 80) return 'Excellent match';
    if (matchPercentage >= 65) return 'Good match';
    if (matchPercentage >= 50) return 'Fair match';
    return 'Poor match';
  };

  // Style match percentage
  const styleMatch = calculateStyleMatch();
  
  // Format publish date
  const formattedDate = resource.lastUpdatedAt ? 
    new Date(resource.lastUpdatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : 
    undefined;

  // Render compact card
  if (compact) {
    return (
      <Card className="w-full overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => onSelect?.(resource)}>
        <div className="flex h-full">
          {resource.imageUrl && (
            <div className="w-20 h-20 bg-slate-100 shrink-0">
              <img 
                src={resource.imageUrl} 
                alt={resource.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="flex flex-col flex-1 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center">
                {getResourceIcon()}
                <span className="ml-1 text-xs text-muted-foreground capitalize">{resource.type}</span>
              </div>
              
              <Badge className={`text-xs ${getQualityBadgeStyle()}`}>
                {resource.quality}
              </Badge>
            </div>
            
            <h3 className="font-medium text-sm mt-1 line-clamp-1">{resource.title}</h3>
            
            <div className="mt-auto flex items-center justify-between">
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="h-3 w-3 mr-1" />
                <span>{resource.estimatedTimeMinutes} min</span>
              </div>
              
              {styleMatch && (
                <div className="flex items-center">
                  <span className={`text-xs font-medium ${
                    styleMatch >= 70 ? 'text-green-600' : 
                    styleMatch >= 50 ? 'text-amber-600' : 
                    'text-red-600'
                  }`}>
                    {styleMatch}% match
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Render full card
  return (
    <Card className="w-full overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative">
        {resource.imageUrl ? (
          <div className="w-full h-40 bg-slate-100">
            <img 
              src={resource.imageUrl} 
              alt={resource.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-40 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-center">
            {getResourceIcon()}
            <span className="ml-2 text-lg font-medium capitalize">{resource.type}</span>
          </div>
        )}
        
        <div className="absolute top-2 right-2 flex gap-2">
          <Badge className={`${getQualityBadgeStyle()}`}>
            {resource.quality}
          </Badge>
          
          <Badge variant="outline" className="bg-white/80 backdrop-blur-sm">
            {resource.type}
          </Badge>
        </div>
      </div>
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{resource.title}</CardTitle>
        </div>
        <CardDescription className="line-clamp-2">{resource.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            <span>{resource.estimatedTimeMinutes} min</span>
          </div>
          
          {resource.author && (
            <div className="flex items-center">
              <span className="mr-1">By</span>
              <span className="font-medium">{resource.author}</span>
            </div>
          )}
          
          {formattedDate && (
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{formattedDate}</span>
            </div>
          )}
          
          <div className="flex items-center">
            <Star className="h-4 w-4 mr-1 text-amber-500" />
            <span>{(resource.authorityScore / 10).toFixed(1)}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Visual content</span>
            <span className="font-medium">{resource.visualRichness}%</span>
          </div>
          <Progress value={resource.visualRichness} className="h-2" />
        </div>
        
        {styleMatch && (
          <div className="bg-blue-50 rounded-md p-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Learning style match</span>
              <span className={`text-sm font-medium ${
                styleMatch >= 70 ? 'text-green-600' : 
                styleMatch >= 50 ? 'text-amber-600' : 
                'text-red-600'
              }`}>
                {styleMatch}%
              </span>
            </div>
            <Progress 
              value={styleMatch} 
              className="h-2 mb-1" 
            />
            <p className="text-xs text-muted-foreground">{getStyleMatchDescription(styleMatch)}</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <div className="w-full flex justify-between">
          <Button variant="outline" size="sm" onClick={() => onSelect?.(resource)}>
            Details
          </Button>
          
          <Button asChild>
            <a href={resource.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Resource
            </a>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ResourceCard;
