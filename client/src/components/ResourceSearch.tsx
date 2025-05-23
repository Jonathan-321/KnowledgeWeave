import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ExternalLink, Bookmark, BookmarkCheck, ThumbsUp, ThumbsDown, Clock } from 'lucide-react';
import { Resource } from '../types/resource';

// Using the shared Resource type from types/resource.ts

interface ResourceSearchProps {
  conceptId?: number;
  userId?: number;
  onAddResource?: (resource: Resource) => void;
}

export const ResourceSearch: React.FC<ResourceSearchProps> = ({ 
  conceptId, 
  userId,
  onAddResource 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Resource[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [urlToAnalyze, setUrlToAnalyze] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Resource search query
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    try {
      const response = await fetch(`/api/resources/search?query=${encodeURIComponent(searchQuery)}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Error searching for resources:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // URL analyzer query
  const handleAnalyzeUrl = async () => {
    if (!urlToAnalyze.trim()) return;
    
    setIsAnalyzing(true);
    
    try {
      const response = await fetch('/api/resources/analyze-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: urlToAnalyze }),
      });
      
      if (!response.ok) {
        throw new Error('URL analysis failed');
      }
      
      const data = await response.json();
      setSearchResults([data]);
    } catch (error) {
      console.error('Error analyzing URL:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle adding a resource to the concept
  const handleAddResource = async (resource: Resource) => {
    if (!conceptId) return;
    
    try {
      // First, check if the resource already exists
      const checkResponse = await fetch(`/api/resources/url?url=${encodeURIComponent(resource.url)}`);
      const existingResources = await checkResponse.json();
      
      let resourceId: number;
      
      if (existingResources.length > 0) {
        // Resource exists, connect it to the concept
        resourceId = existingResources[0].id;
        
        await fetch('/api/resources/connect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            resourceId,
            conceptId,
            relevanceScore: 85
          }),
        });
      } else {
        // Create new resource
        const createResponse = await fetch('/api/resources', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(resource),
        });
        
        const createdResource = await createResponse.json();
        resourceId = createdResource.id;
        
        // Connect to concept
        await fetch('/api/resources/connect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            resourceId,
            conceptId,
            relevanceScore: 85
          }),
        });
      }
      
      if (onAddResource) {
        onAddResource({...resource, id: resourceId});
      }
      
      // Clear search results
      setSearchResults([]);
      setSearchQuery('');
      setUrlToAnalyze('');
      
    } catch (error) {
      console.error('Error adding resource:', error);
    }
  };

  return (
    <div className="resource-search p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Find Learning Resources</h3>
      
      {/* Keyword search */}
      <div className="mb-4">
        <div className="flex mb-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for tutorials, articles, videos..."
            className="flex-grow p-2 border rounded-l"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button 
            onClick={handleSearch}
            disabled={isSearching}
            className="bg-blue-500 text-white p-2 rounded-r flex items-center"
          >
            <Search size={18} className="mr-1" />
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
        <p className="text-sm text-gray-500">Search for learning resources related to this concept</p>
      </div>
      
      {/* URL analyzer */}
      <div className="mb-6">
        <div className="flex mb-2">
          <input
            type="text"
            value={urlToAnalyze}
            onChange={(e) => setUrlToAnalyze(e.target.value)}
            placeholder="Enter a URL to analyze..."
            className="flex-grow p-2 border rounded-l"
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyzeUrl()}
          />
          <button 
            onClick={handleAnalyzeUrl}
            disabled={isAnalyzing}
            className="bg-green-500 text-white p-2 rounded-r flex items-center"
          >
            <ExternalLink size={18} className="mr-1" />
            {isAnalyzing ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
        <p className="text-sm text-gray-500">Add a specific resource by URL</p>
      </div>
      
      {/* Search results */}
      {searchResults.length > 0 && (
        <div className="search-results">
          <h4 className="font-medium mb-2">Results</h4>
          <div className="space-y-4">
            {searchResults.map((resource, index) => (
              <div key={index} className="resource-card border rounded p-3 bg-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-medium">{resource.title}</h5>
                    <p className="text-sm text-gray-600 mb-2">{resource.description}</p>
                    <div className="flex space-x-2 mb-2">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {resource.type}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded flex items-center">
                        <ThumbsUp size={12} className="mr-1" /> {resource.qualityScore}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mt-1">
                      {resource.tags.map((tag, i) => (
                        <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {resource.imageUrl && (
                    <img 
                      src={resource.imageUrl} 
                      alt={resource.title} 
                      className="w-20 h-20 object-cover rounded ml-2"
                    />
                  )}
                </div>
                
                <div className="flex justify-between items-center mt-3 pt-2 border-t">
                  <a 
                    href={resource.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 text-sm flex items-center"
                  >
                    <ExternalLink size={14} className="mr-1" />
                    View Resource
                  </a>
                  
                  <button
                    onClick={() => handleAddResource(resource)}
                    className="bg-green-500 text-white text-sm px-3 py-1 rounded flex items-center"
                  >
                    <Bookmark size={14} className="mr-1" />
                    Add to Concept
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceSearch;
