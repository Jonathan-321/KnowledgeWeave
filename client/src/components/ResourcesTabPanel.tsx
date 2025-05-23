import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  ExternalLink, 
  BookOpen, 
  Video, 
  Cpu, 
  Award, 
  ThumbsUp, 
  ThumbsDown, 
  Clock,
  BarChart3,
  AlertCircle,
  Filter,
  Bookmark,
  Search,
  GraduationCap,
  Route
} from 'lucide-react';
import ResourceSearch from './ResourceSearch';
import { Resource, LearningPath } from '../types/resource';

// Using the shared Resource type from types/resource.ts

interface ResourcesTabPanelProps {
  conceptId: number;
  userId?: number;
  conceptName?: string;
}

interface ResourceCardProps {
  resource: Resource;
  userId?: number;
  onRateResource: (resourceId: number, rating: number) => void;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ resource, userId, onRateResource }) => {
  const [timeSpent, setTimeSpent] = useState<number>(0);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [showInteractionMessage, setShowInteractionMessage] = useState<boolean>(false);
  
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timerActive) {
      timer = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timerActive]);
  
  const handleResourceClick = () => {
    // Record resource view interaction if user is logged in
    if (userId) {
      fetch('/api/resources/interaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          resourceId: resource.id,
          interactionType: 'view',
          timeSpent: 0 // Initial view
        }),
      });
    }
    
    // Open the resource in a new tab
    window.open(resource.url, '_blank');
    
    // Start timer to track how long the resource is being used
    setTimerActive(true);
  };
  
  const handleResourceComplete = () => {
    if (userId) {
      fetch('/api/resources/interaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          resourceId: resource.id,
          interactionType: 'complete',
          timeSpent
        }),
      });
      
      setShowInteractionMessage(true);
      setTimeout(() => setShowInteractionMessage(false), 3000);
    }
    
    setTimerActive(false);
  };
  
  const handleRateResource = (rating: number) => {
    if (resource.id !== undefined) {
      onRateResource(resource.id, rating);
      setShowInteractionMessage(true);
      setTimeout(() => setShowInteractionMessage(false), 3000);
    }
  };
  
  const getResourceTypeIcon = () => {
    switch (resource.type) {
      case 'article':
        return <BookOpen className="w-5 h-5 text-blue-500" />;
      case 'video':
        return <Video className="w-5 h-5 text-red-500" />;
      case 'interactive':
        return <Cpu className="w-5 h-5 text-green-500" />;
      case 'visualization':
        return <BarChart3 className="w-5 h-5 text-purple-500" />;
      default:
        return <ExternalLink className="w-5 h-5 text-gray-500" />;
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };
  
  return (
    <div className="border rounded-lg p-4 mb-4 shadow-sm hover:shadow-md transition-shadow">
      {resource.learningPathOrder && (
        <div className="flex items-center mb-2">
          <Award className="w-4 h-4 text-amber-500 mr-1" />
          <span className="text-xs font-medium text-amber-700">
            Learning Path Step {resource.learningPathOrder}
            {resource.isRequired && " (Required)"}
          </span>
        </div>
      )}
      
      <div className="flex items-start gap-3">
        {resource.imageUrl ? (
          <img 
            src={resource.imageUrl} 
            alt={resource.title} 
            className="w-20 h-16 object-cover rounded" 
          />
        ) : (
          <div className="w-20 h-16 bg-gray-100 rounded flex items-center justify-center">
            {getResourceTypeIcon()}
          </div>
        )}
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {getResourceTypeIcon()}
            <h3 className="font-semibold text-lg">{resource.title}</h3>
          </div>
          
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{resource.description}</p>
          
          <div className="flex items-center mt-2 text-xs text-gray-500 gap-2">
            <span className="flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              Quality: {resource.qualityScore}%
            </span>
            {resource.relevanceScore && (
              <span className="flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                Relevance: {resource.relevanceScore}%
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-3">
        <div className="flex gap-2">
          <button
            onClick={handleResourceClick}
            className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm flex items-center hover:bg-blue-600"
          >
            <ExternalLink className="w-4 h-4 mr-1" /> View
          </button>
          
          {timerActive && (
            <button
              onClick={handleResourceComplete}
              className="px-3 py-1 bg-green-500 text-white rounded-md text-sm flex items-center hover:bg-green-600"
            >
              <Clock className="w-4 h-4 mr-1" /> Complete ({formatTime(timeSpent)})
            </button>
          )}
        </div>
        
        {userId && (
          <div className="flex gap-1">
            <button
              onClick={() => handleRateResource(5)}
              className="p-1 text-gray-400 hover:text-green-500"
              title="Helpful"
            >
              <ThumbsUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleRateResource(1)}
              className="p-1 text-gray-400 hover:text-red-500"
              title="Not Helpful"
            >
              <ThumbsDown className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      
      {showInteractionMessage && (
        <div className="mt-2 text-xs text-green-600 bg-green-50 p-1 rounded text-center">
          Thank you for your feedback!
        </div>
      )}
    </div>
  );
};

const ResourcesTabPanel: React.FC<ResourcesTabPanelProps> = ({ conceptId, userId, conceptName }) => {
  const [showResourceSearch, setShowResourceSearch] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showLearningPath, setShowLearningPath] = useState<boolean>(false);
  
  // Fetch resources for this concept
  const { data: resources = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['resources', conceptId],
    queryFn: async () => {
      const response = await fetch(`/api/resources/concept/${conceptId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch resources');
      }
      return response.json();
    }
  });
  
  // Fetch learning path
  const { data: learningPath = {} as LearningPath, isLoading: isLoadingPath } = useQuery({
    queryKey: ['learningPath', conceptId, userId],
    queryFn: async () => {
      const endpoint = userId 
        ? `/api/resources/learning-path/${conceptId}?userId=${userId}` 
        : `/api/resources/learning-path/${conceptId}`;
      
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error('Failed to fetch learning path');
      }
      return response.json();
    },
    enabled: showLearningPath
  });
  
  // Fetch personalized recommendations if user is logged in
  const { data: recommendations } = useQuery({
    queryKey: [`/api/resources/recommend/${userId}/${conceptId}`],
    queryFn: async () => {
      const response = await fetch(`/api/resources/recommend/${userId}/${conceptId}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    },
    enabled: !!userId, // Only run if userId is provided
  });
  
  const handleDiscoverResources = async () => {
    try {
      await fetch(`/api/resources/discover/${conceptId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Empty body to use default settings
      });
      
      // Refetch resources after discovery
      refetch();
    } catch (error) {
      console.error('Error discovering resources:', error);
    }
  };
  
  const handleRateResource = async (resourceId: number, rating: number) => {
    if (!userId) return;
    
    try {
      await fetch('/api/resources/interaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          resourceId,
          interactionType: 'rate',
          rating,
          timeSpent: 0
        }),
      });
    } catch (error) {
      console.error('Error rating resource:', error);
    }
  };
  
  // Filter resources based on active filter
  const filteredResources = Array.isArray(resources) ? resources.filter((resource: Resource) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'video' && resource.type === 'video') return true;
    if (activeFilter === 'article' && resource.type === 'article') return true;
    if (activeFilter === 'interactive' && resource.type === 'interactive') return true;
    if (activeFilter === 'course' && resource.type === 'course') return true;
    return false;
  }) : [];
  
  // Handle adding a new resource
  const handleAddResource = (resource: Resource) => {
    refetch();
  };
  
  if (isLoading) {
    return <div className="p-4 text-center text-gray-500">Loading resources...</div>;
  }
  
  if (isError) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">Error loading resources</p>
        <button 
          onClick={() => refetch()}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Try again
        </button>
      </div>
    );
  }
  
  if (resources && resources.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500 mb-4">No resources found for this concept</p>
        <button 
          onClick={handleDiscoverResources}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Discover Resources
        </button>
      </div>
    );
  }
  
  return (
    <div className="resources-tab p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Learning Resources</h2>
        
        <div className="flex space-x-2">
          <button 
            onClick={() => setShowLearningPath(!showLearningPath)}
            className={`px-3 py-1 text-sm rounded-md flex items-center ${showLearningPath ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            <Route className="w-4 h-4 mr-1" /> Learning Path
          </button>
          
          <button 
            onClick={() => setShowResourceSearch(!showResourceSearch)}
            className={`px-3 py-1 text-sm rounded-md flex items-center ${showResourceSearch ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
          >
            <Search className="w-4 h-4 mr-1" /> {showResourceSearch ? 'Hide Search' : 'Add Resources'}
          </button>
        </div>
      </div>
      
      {showResourceSearch && (
        <div className="mb-6 border rounded-lg overflow-hidden">
          <ResourceSearch 
            conceptId={conceptId} 
            userId={userId} 
            onAddResource={handleAddResource}
          />
        </div>
      )}
      
      {/* Filter controls */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button 
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1 text-sm rounded-md flex items-center ${activeFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
        >
          <Filter className="w-4 h-4 mr-1" /> All
        </button>
        
        <button 
          onClick={() => setActiveFilter('video')}
          className={`px-3 py-1 text-sm rounded-md flex items-center ${activeFilter === 'video' ? 'bg-red-500 text-white' : 'bg-gray-100'}`}
        >
          <Video className="w-4 h-4 mr-1" /> Videos
        </button>
        
        <button 
          onClick={() => setActiveFilter('article')}
          className={`px-3 py-1 text-sm rounded-md flex items-center ${activeFilter === 'article' ? 'bg-purple-500 text-white' : 'bg-gray-100'}`}
        >
          <BookOpen className="w-4 h-4 mr-1" /> Articles
        </button>
        
        <button 
          onClick={() => setActiveFilter('interactive')}
          className={`px-3 py-1 text-sm rounded-md flex items-center ${activeFilter === 'interactive' ? 'bg-green-500 text-white' : 'bg-gray-100'}`}
        >
          <Cpu className="w-4 h-4 mr-1" /> Interactive
        </button>
        
        <button 
          onClick={() => setActiveFilter('course')}
          className={`px-3 py-1 text-sm rounded-md flex items-center ${activeFilter === 'course' ? 'bg-amber-500 text-white' : 'bg-gray-100'}`}
        >
          <GraduationCap className="w-4 h-4 mr-1" /> Courses
        </button>
      </div>
      
      {/* Learning path view */}
      {showLearningPath && (
        <div className="mb-6 border rounded-lg p-4 bg-blue-50">
          <div className="flex items-center mb-3">
            <Route className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold">Learning Path for {conceptName || 'this concept'}</h3>
          </div>
          
          {isLoadingPath && <p>Loading learning path...</p>}
          
          {!isLoadingPath && learningPath && (
            <div className="space-y-2">
              {learningPath.prerequisites && learningPath.prerequisites.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700">Prerequisites:</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {learningPath.prerequisites.map((prereq: string, index: number) => (
                      <span key={index} className="text-xs bg-gray-200 px-2 py-1 rounded">
                        {prereq}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                {learningPath.path && learningPath.path.map((resource: Resource, index: number) => (
                  <div key={resource.id} className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center mr-3">
                      {index + 1}
                    </div>
                    <ResourceCard 
                      key={resource.id}
                      resource={{...resource, learningPathOrder: index + 1}}
                      userId={userId}
                      onRateResource={handleRateResource}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {isLoading && <p>Loading resources...</p>}
      {isError && <p className="text-red-500">Error loading resources.</p>}
      
      {!isLoading && !isError && filteredResources.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No resources found for this concept yet.</p>
          {!showResourceSearch && (
            <button 
              onClick={() => setShowResourceSearch(true)}
              className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-md text-sm flex items-center mx-auto"
            >
              <Search className="w-4 h-4 mr-1" /> Find Resources
            </button>
          )}
        </div>
      )}
      
      {filteredResources.length > 0 && (
        <div className="resources-list space-y-4">
          {filteredResources.map(resource => (
            <ResourceCard 
              key={resource.id}
              resource={resource}
              userId={userId}
              onRateResource={handleRateResource}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ResourcesTabPanel;
