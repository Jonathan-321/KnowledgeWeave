import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Book, 
  Video, 
  MousePointer, 
  Clock, 
  Calendar, 
  User,
  Globe,
  Layers,
  ExternalLink,
  Share2,
  BookOpen,
  Star,
  BarChart4
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CuratedResource {
  id: number;
  resourceId: number;
  url: string;
  title: string;
  description: string;
  sourceType: 'video' | 'article' | 'interactive' | 'course' | 'book' | 'tool';
  sourceQuality: 'high' | 'medium' | 'low';
  visualRichness: number;
  authorityScore: number;
  imageUrl?: string;
  sourceName: string;
  author?: string;
  publishDate?: string;
  estimatedTimeMinutes: number;
  difficultyLevel: 'basic' | 'intermediate' | 'advanced';
  conceptConnections: {
    conceptId: number;
    conceptName: string;
    relevanceScore: number;
    isCore: boolean;
  }[];
  learningStyleFit: {
    visual: number;
    auditory: number;
    reading: number;
    kinesthetic: number;
  };
  tags: string[];
  aiSummary?: string;
}

interface ResourceDetailsProps {
  resource: CuratedResource | null;
  onBack?: () => void;
  onSimilarResources?: (conceptId: number) => void;
}

export function ResourceDetails({ resource, onBack, onSimilarResources }: ResourceDetailsProps) {
  if (!resource) {
    return (
      <Card className="w-full h-full">
        <CardContent className="pt-6 flex flex-col items-center justify-center h-[400px]">
          <p className="text-muted-foreground">Select a resource to view details</p>
        </CardContent>
      </Card>
    );
  }

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  // Helper function to get icon by resource type
  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-5 w-5" />;
      case 'article': return <BookOpen className="h-5 w-5" />;
      case 'interactive': return <MousePointer className="h-5 w-5" />;
      case 'course': return <Book className="h-5 w-5" />;
      case 'book': return <Book className="h-5 w-5" />;
      case 'tool': return <Layers className="h-5 w-5" />;
      default: return <Globe className="h-5 w-5" />;
    }
  };

  // Helper to get color based on quality
  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper to get color based on difficulty
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'basic': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper to format minutes to readable time
  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes > 0 ? remainingMinutes + 'm' : ''}`;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-2">
              {getResourceIcon(resource.sourceType)}
              <CardTitle className="text-xl">{resource.title}</CardTitle>
            </div>
            <CardDescription className="mt-1">{resource.sourceName}</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Badge className={getQualityColor(resource.sourceQuality)}>
              {resource.sourceQuality} quality
            </Badge>
            <Badge className={getDifficultyColor(resource.difficultyLevel)}>
              {resource.difficultyLevel}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-2">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="concepts">Related Concepts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {resource.imageUrl && (
              <div className="mb-4 rounded-md overflow-hidden">
                <img 
                  src={resource.imageUrl} 
                  alt={resource.title} 
                  className="w-full h-48 object-cover" 
                />
              </div>
            )}

            <div className="space-y-4">
              <p className="text-sm">{resource.description}</p>

              {resource.aiSummary && (
                <div className="mt-4 p-3 bg-slate-50 rounded-md">
                  <p className="text-xs text-slate-700 font-medium mb-1">AI Summary</p>
                  <p className="text-sm">{resource.aiSummary}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-4">
                {resource.tags.map((tag, index) => (
                  <Badge key={index} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">{formatTime(resource.estimatedTimeMinutes)}</span>
                </div>
                {resource.author && (
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">{resource.author}</span>
                  </div>
                )}
                {resource.publishDate && (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">{formatDate(resource.publishDate)}</span>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="details">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center">
                  <Star className="h-4 w-4 mr-1 text-yellow-500" />
                  Quality Metrics
                </h3>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between items-center text-sm">
                      <span>Visual Richness</span>
                      <span>{resource.visualRichness}/100</span>
                    </div>
                    <Progress value={resource.visualRichness} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center text-sm">
                      <span>Authority Score</span>
                      <span>{resource.authorityScore}/100</span>
                    </div>
                    <Progress value={resource.authorityScore} className="h-2" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center">
                  <BarChart4 className="h-4 w-4 mr-1 text-blue-500" />
                  Learning Style Fit
                </h3>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between items-center text-sm">
                      <span>Visual</span>
                      <span>{resource.learningStyleFit.visual}/100</span>
                    </div>
                    <Progress value={resource.learningStyleFit.visual} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center text-sm">
                      <span>Auditory</span>
                      <span>{resource.learningStyleFit.auditory}/100</span>
                    </div>
                    <Progress value={resource.learningStyleFit.auditory} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center text-sm">
                      <span>Reading</span>
                      <span>{resource.learningStyleFit.reading}/100</span>
                    </div>
                    <Progress value={resource.learningStyleFit.reading} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center text-sm">
                      <span>Kinesthetic</span>
                      <span>{resource.learningStyleFit.kinesthetic}/100</span>
                    </div>
                    <Progress value={resource.learningStyleFit.kinesthetic} className="h-2" />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="concepts">
            <div className="space-y-4">
              <p className="text-sm">This resource is connected to the following concepts:</p>
              <div className="space-y-3">
                {resource.conceptConnections.map((connection, index) => (
                  <div key={index} className="p-3 border rounded-md">
                    <div className="flex justify-between">
                      <div className="font-medium">{connection.conceptName}</div>
                      {connection.isCore && (
                        <Badge variant="outline" className="text-xs">
                          Core concept
                        </Badge>
                      )}
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between items-center text-xs">
                        <span>Relevance</span>
                        <span>{connection.relevanceScore}/100</span>
                      </div>
                      <Progress value={connection.relevanceScore} className="h-1.5 mt-1" />
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-2 text-xs"
                      onClick={() => onSimilarResources && onSimilarResources(connection.conceptId)}
                    >
                      Find similar resources
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="flex justify-between pt-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          Back to Graph
        </Button>
        <Button asChild>
          <a href={resource.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Resource
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
