import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { EnhancedResource } from '@shared/enhancedSchemaTypes';
import ResourceCard from './ResourceCard';
import { Search, Filter, Clock, Star, BookOpen, Play, FileText, Zap, Book, X, Grid3x3, LayoutList, Timer, CircleSlash } from 'lucide-react';
import axios from 'axios';
import { useMediaQuery } from '@/hooks/use-media-query';

interface VisualResourceGalleryProps {
  conceptId: number;
  conceptName?: string;
  showFilters?: boolean;
  initialResourceType?: string;
  onResourceSelect?: (resource: EnhancedResource) => void;
  compact?: boolean;
}

// Mock learning style data (in a real app, this would come from the user's profile)
const userLearningStyle = {
  visual: 80,
  auditory: 60,
  reading: 70,
  kinesthetic: 50
};

const VisualResourceGallery: React.FC<VisualResourceGalleryProps> = ({
  conceptId,
  conceptName,
  showFilters = true,
  initialResourceType,
  onResourceSelect,
  compact = false
}) => {
  // State for filters
  const [resourceType, setResourceType] = useState<string>(initialResourceType || 'all');
  const [qualityFilter, setQualityFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<[number]>([60]); // max minutes
  const [searchQuery, setSearchQuery] = useState('');
  const [visualRichnessFilter, setVisualRichnessFilter] = useState<[number]>([0]); // min visual richness
  const [sortBy, setSortBy] = useState<string>('relevance');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(compact ? 'list' : 'grid');
  
  // State for resource detail dialog
  const [selectedResource, setSelectedResource] = useState<EnhancedResource | null>(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  
  // Fetch resources for the concept
  const { data: resources, isLoading, error } = useQuery<EnhancedResource[]>({
    queryKey: ['resources', conceptId],
    queryFn: async () => {
      // In a real implementation, this would be an API call
      try {
        const response = await axios.get(`/api/graph/resources/${conceptId}`);
        return response.data;
      } catch (error) {
        console.error('Error fetching resources:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: [] // Empty array as placeholder
  });
  
  // Apply filters to resources
  const filteredResources = (resources || []).filter(resource => {
    // Filter by resource type
    if (resourceType !== 'all' && resource.type !== resourceType) {
      return false;
    }
    
    // Filter by quality
    if (qualityFilter !== 'all' && resource.quality !== qualityFilter) {
      return false;
    }
    
    // Filter by time
    if (resource.estimatedTimeMinutes > timeFilter[0]) {
      return false;
    }
    
    // Filter by visual richness
    if (resource.visualRichness < visualRichnessFilter[0]) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        resource.title.toLowerCase().includes(query) ||
        resource.description.toLowerCase().includes(query) ||
        (resource.author && resource.author.toLowerCase().includes(query))
      );
    }
    
    return true;
  });
  
  // Sort resources
  const sortedResources = [...filteredResources].sort((a, b) => {
    switch (sortBy) {
      case 'relevance':
        // Prioritize high quality, visual content
        return (
          ((b.quality === 'high' ? 3 : b.quality === 'medium' ? 2 : 1) * 10 + b.visualRichness / 10) -
          ((a.quality === 'high' ? 3 : a.quality === 'medium' ? 2 : 1) * 10 + a.visualRichness / 10)
        );
      case 'visual':
        return b.visualRichness - a.visualRichness;
      case 'quality':
        const qualityValueA = a.quality === 'high' ? 3 : a.quality === 'medium' ? 2 : 1;
        const qualityValueB = b.quality === 'high' ? 3 : b.quality === 'medium' ? 2 : 1;
        return qualityValueB - qualityValueA;
      case 'time':
        return a.estimatedTimeMinutes - b.estimatedTimeMinutes;
      case 'authority':
        return b.authorityScore - a.authorityScore;
      case 'match':
        // This would be better with actual match calculations
        return 0;
      default:
        return 0;
    }
  });
  
  // Group resources by type for the tabs
  const resourcesByType: Record<string, EnhancedResource[]> = {
    all: sortedResources,
    video: sortedResources.filter(r => r.type === 'video'),
    article: sortedResources.filter(r => r.type === 'article'),
    interactive: sortedResources.filter(r => r.type === 'interactive'),
    course: sortedResources.filter(r => r.type === 'course'),
    book: sortedResources.filter(r => r.type === 'book')
  };
  
  // Get resource type icon
  const getResourceTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Play className="h-4 w-4" />;
      case 'article':
        return <FileText className="h-4 w-4" />;
      case 'interactive':
        return <Zap className="h-4 w-4" />;
      case 'course':
        return <BookOpen className="h-4 w-4" />;
      case 'book':
        return <Book className="h-4 w-4" />;
      default:
        return null;
    }
  };
  
  // Handle resource selection
  const handleResourceSelect = (resource: EnhancedResource) => {
    if (onResourceSelect) {
      onResourceSelect(resource);
    } else {
      setSelectedResource(resource);
    }
  };
  
  // Reset filters
  const resetFilters = () => {
    setResourceType('all');
    setQualityFilter('all');
    setTimeFilter([60]);
    setVisualRichnessFilter([0]);
    setSearchQuery('');
    setSortBy('relevance');
  };
  
  return (
    <div className="w-full space-y-4">
      {/* Header with title and search */}
      {!compact && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              {conceptName ? `Learning Resources: ${conceptName}` : 'Learning Resources'}
            </h2>
            <p className="text-sm text-muted-foreground">
              Discover high-quality visual learning materials
            </p>
          </div>
          
          {showFilters && (
            <div className="relative w-64">
              <Input
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-8"
              />
              <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </div>
      )}
      
      {/* Filters */}
      {showFilters && !compact && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                Filter Resources
              </CardTitle>
              
              <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8">
                Reset
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Resource Type</label>
                <Select value={resourceType} onValueChange={setResourceType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select resource type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="video">Videos</SelectItem>
                    <SelectItem value="article">Articles</SelectItem>
                    <SelectItem value="interactive">Interactive</SelectItem>
                    <SelectItem value="course">Courses</SelectItem>
                    <SelectItem value="book">Books</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Quality</label>
                <Select value={qualityFilter} onValueChange={setQualityFilter}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select quality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Qualities</SelectItem>
                    <SelectItem value="high">High Quality</SelectItem>
                    <SelectItem value="medium">Medium Quality</SelectItem>
                    <SelectItem value="low">Low Quality</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Sort By</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="visual">Visual Richness</SelectItem>
                    <SelectItem value="quality">Quality</SelectItem>
                    <SelectItem value="time">Time (Shortest First)</SelectItem>
                    <SelectItem value="authority">Authority</SelectItem>
                    <SelectItem value="match">Learning Style Match</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Max Duration</label>
                  <span className="text-sm text-muted-foreground">{timeFilter[0]} min</span>
                </div>
                <Slider
                  className="mt-2"
                  min={5}
                  max={120}
                  step={5}
                  value={timeFilter}
                  onValueChange={(value) => setTimeFilter(value as [number])}
                />
              </div>
              
              <div>
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Min Visual Content</label>
                  <span className="text-sm text-muted-foreground">{visualRichnessFilter[0]}%</span>
                </div>
                <Slider
                  className="mt-2"
                  min={0}
                  max={100}
                  step={5}
                  value={visualRichnessFilter}
                  onValueChange={(value) => setVisualRichnessFilter(value as [number])}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">View Mode</label>
                <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as 'grid' | 'list')}>
                  <ToggleGroupItem value="grid" size="sm">
                    <Grid3x3 className="h-4 w-4 mr-1" />
                    Grid
                  </ToggleGroupItem>
                  <ToggleGroupItem value="list" size="sm">
                    <LayoutList className="h-4 w-4 mr-1" />
                    List
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Resource count and view toggle for compact mode */}
      {compact && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {filteredResources.length} resources
          </div>
          
          <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as 'grid' | 'list')}>
            <ToggleGroupItem value="grid" size="sm">
              <Grid3x3 className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" size="sm">
              <LayoutList className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}
      
      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center">
            <div className="animate-spin mb-2">
              <BookOpen className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-muted-foreground">Discovering resources...</p>
          </div>
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <Card className="text-center py-8">
          <CardContent>
            <div className="flex flex-col items-center">
              <CircleSlash className="h-8 w-8 text-red-500 mb-2" />
              <h3 className="font-medium">Failed to load resources</h3>
              <p className="text-sm text-muted-foreground mt-1">
                There was an error loading the learning resources. Please try again.
              </p>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Empty state */}
      {!isLoading && filteredResources.length === 0 && (
        <Card className="text-center py-8">
          <CardContent>
            <div className="flex flex-col items-center">
              <Search className="h-8 w-8 text-muted-foreground mb-2" />
              <h3 className="font-medium">No resources found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery ? 
                  `No resources matching "${searchQuery}"` : 
                  "Try adjusting your filters to find resources"
                }
              </p>
              {(resourceType !== 'all' || qualityFilter !== 'all' || timeFilter[0] < 60 || visualRichnessFilter[0] > 0 || searchQuery) && (
                <Button onClick={resetFilters} variant="outline" className="mt-4">
                  Reset Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Resources display */}
      {!isLoading && filteredResources.length > 0 && (
        <div>
          {compact ? (
            <div className={
              viewMode === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" 
                : "space-y-2"
            }>
              {sortedResources.map(resource => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  userLearningStyle={userLearningStyle}
                  compact={viewMode === 'list'}
                  onSelect={handleResourceSelect}
                />
              ))}
            </div>
          ) : (
            <Tabs defaultValue={initialResourceType || 'all'} onValueChange={setResourceType}>
              <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full mb-4">
                <TabsTrigger value="all">
                  All
                  <Badge variant="secondary" className="ml-2">
                    {resourcesByType.all.length}
                  </Badge>
                </TabsTrigger>
                
                <TabsTrigger value="video">
                  <Play className="h-4 w-4 mr-1" />
                  Videos
                  <Badge variant="secondary" className="ml-2">
                    {resourcesByType.video.length}
                  </Badge>
                </TabsTrigger>
                
                <TabsTrigger value="article">
                  <FileText className="h-4 w-4 mr-1" />
                  Articles
                  <Badge variant="secondary" className="ml-2">
                    {resourcesByType.article.length}
                  </Badge>
                </TabsTrigger>
                
                <TabsTrigger value="interactive">
                  <Zap className="h-4 w-4 mr-1" />
                  Interactive
                  <Badge variant="secondary" className="ml-2">
                    {resourcesByType.interactive.length}
                  </Badge>
                </TabsTrigger>
                
                <TabsTrigger value="course">
                  <BookOpen className="h-4 w-4 mr-1" />
                  Courses
                  <Badge variant="secondary" className="ml-2">
                    {resourcesByType.course.length}
                  </Badge>
                </TabsTrigger>
                
                <TabsTrigger value="book">
                  <Book className="h-4 w-4 mr-1" />
                  Books
                  <Badge variant="secondary" className="ml-2">
                    {resourcesByType.book.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>
              
              {Object.entries(resourcesByType).map(([type, resources]) => (
                <TabsContent key={type} value={type} className="mt-0">
                  {resources.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No {type !== 'all' ? type : ''} resources available
                    </div>
                  ) : (
                    <div className={
                      viewMode === 'grid' 
                        ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6" 
                        : "space-y-4"
                    }>
                      {resources.map(resource => (
                        <ResourceCard
                          key={resource.id}
                          resource={resource}
                          userLearningStyle={userLearningStyle}
                          compact={viewMode === 'list'}
                          onSelect={handleResourceSelect}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
      )}
      
      {/* Resource detail dialog/drawer */}
      {isDesktop ? (
        <Dialog open={!!selectedResource} onOpenChange={(open) => !open && setSelectedResource(null)}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            {selectedResource && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedResource.title}</DialogTitle>
                  <DialogDescription>
                    {selectedResource.description}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 my-4">
                  {selectedResource.imageUrl && (
                    <div className="w-full h-64 overflow-hidden rounded-md">
                      <img 
                        src={selectedResource.imageUrl} 
                        alt={selectedResource.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-3 items-center">
                    <Badge className="capitalize">{selectedResource.type}</Badge>
                    <Badge variant={
                      selectedResource.quality === 'high' ? "success" : 
                      selectedResource.quality === 'medium' ? "warning" : 
                      "destructive"
                    }>
                      {selectedResource.quality} quality
                    </Badge>
                    <Badge variant="outline" className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {selectedResource.estimatedTimeMinutes} minutes
                    </Badge>
                    <Badge variant="outline" className="flex items-center">
                      <Star className="h-3 w-3 mr-1 text-amber-500" />
                      {(selectedResource.authorityScore / 10).toFixed(1)} rating
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Visual Content</h4>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Richness</span>
                        <span>{selectedResource.visualRichness}%</span>
                      </div>
                      <Progress value={selectedResource.visualRichness} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Authority Score</h4>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Credibility</span>
                        <span>{selectedResource.authorityScore}%</span>
                      </div>
                      <Progress value={selectedResource.authorityScore} className="h-2" />
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <h4 className="font-medium mb-2">Learning Style Fit</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Visual</span>
                          <span>{selectedResource.learningStyleFit.visual}%</span>
                        </div>
                        <Progress value={selectedResource.learningStyleFit.visual} className="h-1.5" />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Auditory</span>
                          <span>{selectedResource.learningStyleFit.auditory}%</span>
                        </div>
                        <Progress value={selectedResource.learningStyleFit.auditory} className="h-1.5" />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Reading</span>
                          <span>{selectedResource.learningStyleFit.reading}%</span>
                        </div>
                        <Progress value={selectedResource.learningStyleFit.reading} className="h-1.5" />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Kinesthetic</span>
                          <span>{selectedResource.learningStyleFit.kinesthetic}%</span>
                        </div>
                        <Progress value={selectedResource.learningStyleFit.kinesthetic} className="h-1.5" />
                      </div>
                    </div>
                  </div>
                  
                  {selectedResource.author && (
                    <div>
                      <h4 className="font-medium text-sm">Author</h4>
                      <p className="text-sm">{selectedResource.author}</p>
                    </div>
                  )}
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSelectedResource(null)}>
                    Close
                  </Button>
                  <Button asChild>
                    <a href={selectedResource.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Visit Resource
                    </a>
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={!!selectedResource} onOpenChange={(open) => !open && setSelectedResource(null)}>
          <DrawerContent>
            {selectedResource && (
              <>
                <DrawerHeader>
                  <DrawerTitle>{selectedResource.title}</DrawerTitle>
                  <DrawerDescription>
                    {selectedResource.description}
                  </DrawerDescription>
                </DrawerHeader>
                
                <div className="p-4 space-y-4">
                  {selectedResource.imageUrl && (
                    <div className="w-full h-48 overflow-hidden rounded-md">
                      <img 
                        src={selectedResource.imageUrl} 
                        alt={selectedResource.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2 items-center">
                    <Badge className="capitalize">{selectedResource.type}</Badge>
                    <Badge variant={
                      selectedResource.quality === 'high' ? "success" : 
                      selectedResource.quality === 'medium' ? "warning" : 
                      "destructive"
                    }>
                      {selectedResource.quality} quality
                    </Badge>
                    <Badge variant="outline" className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {selectedResource.estimatedTimeMinutes} min
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Visual Content</h4>
                    <Progress value={selectedResource.visualRichness} className="h-2" />
                  </div>
                  
                  {selectedResource.author && (
                    <div>
                      <h4 className="font-medium text-sm">Author</h4>
                      <p className="text-sm">{selectedResource.author}</p>
                    </div>
                  )}
                </div>
                
                <DrawerFooter>
                  <Button asChild>
                    <a href={selectedResource.url} target="_blank" rel="noopener noreferrer">
                      Visit Resource
                    </a>
                  </Button>
                  <DrawerClose asChild>
                    <Button variant="outline">Close</Button>
                  </DrawerClose>
                </DrawerFooter>
              </>
            )}
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
};

export default VisualResourceGallery;
