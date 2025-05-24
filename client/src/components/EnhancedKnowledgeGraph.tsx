import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { EnhancedGraphNode, EnhancedGraphLink, EnhancedKnowledgeGraph as EnhancedGraphData } from '@shared/enhancedSchema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Network, Settings, Filter, Search, Info, BookOpen, Brain, Database } from 'lucide-react';
import GraphVisualization from '@/components/graph/GraphVisualization';
import ResourcePanel from '@/components/graph/ResourcePanel';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface EnhancedKnowledgeGraphProps {
  userId?: number;
  initialConceptId?: number;
  width?: number;
  height?: number;
}

const EnhancedKnowledgeGraph: React.FC<EnhancedKnowledgeGraphProps> = ({
  userId,
  initialConceptId,
  width = 1200,
  height = 800
}) => {
  const [selectedNode, setSelectedNode] = useState<EnhancedGraphNode | null>(null);
  const [highlightNodes, setHighlightNodes] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState(0);
  const [colorBy, setColorBy] = useState<'domain' | 'mastery' | 'importance'>('domain');
  const [sizeBy, setSizeBy] = useState<'importance' | 'resourceCount' | 'mastery'>('importance');
  const [showResourcePanel, setShowResourcePanel] = useState(false);
  
  // Fetch the enhanced knowledge graph data
  const { data: graphData, isLoading } = useQuery<EnhancedGraphData>({
    queryKey: ['enhancedKnowledgeGraph', userId],
    queryFn: async () => {
      // In a real implementation, this would be an API call
      // For now, return mock data
      return {
        nodes: [
          {
            id: 1,
            label: 'Machine Learning',
            type: 'concept',
            importance: 10,
            mastery: 65,
            color: '#0984e3',
            domainArea: 'Computer Science',
            depthLevel: 1,
            resourceCount: 12,
            descriptionShort: 'Algorithms that improve automatically through experience',
            prerequisites: [2, 3]
          },
          {
            id: 2,
            label: 'Linear Algebra',
            type: 'concept',
            importance: 9,
            mastery: 80,
            color: '#6c5ce7',
            domainArea: 'Mathematics',
            depthLevel: 1,
            resourceCount: 8,
            descriptionShort: 'Branch of mathematics concerning linear equations',
            prerequisites: []
          },
          {
            id: 3,
            label: 'Statistics',
            type: 'concept',
            importance: 8,
            mastery: 75,
            color: '#6c5ce7',
            domainArea: 'Mathematics',
            depthLevel: 1,
            resourceCount: 10,
            descriptionShort: 'Study of collecting, analyzing, and interpreting data',
            prerequisites: []
          },
          {
            id: 4,
            label: 'Neural Networks',
            type: 'concept',
            importance: 8,
            mastery: 60,
            color: '#0984e3',
            domainArea: 'Computer Science',
            depthLevel: 2,
            resourceCount: 9,
            descriptionShort: 'Computing systems inspired by biological neural networks',
            prerequisites: [1, 2, 3]
          },
          {
            id: 5,
            label: 'Deep Learning',
            type: 'concept',
            importance: 7,
            mastery: 55,
            color: '#0984e3',
            domainArea: 'Computer Science',
            depthLevel: 3,
            resourceCount: 7,
            descriptionShort: 'Machine learning based on artificial neural networks with multiple layers',
            prerequisites: [4]
          },
          {
            id: 6,
            label: 'Convolutional Networks',
            type: 'concept',
            importance: 6,
            mastery: 45,
            color: '#0984e3',
            domainArea: 'Computer Science',
            depthLevel: 4,
            resourceCount: 5,
            descriptionShort: 'Neural networks designed for processing structured grid data like images',
            prerequisites: [5]
          },
          {
            id: 7,
            label: 'Reinforcement Learning',
            type: 'concept',
            importance: 7,
            mastery: 40,
            color: '#0984e3',
            domainArea: 'Computer Science',
            depthLevel: 3,
            resourceCount: 6,
            descriptionShort: 'Training algorithms by rewarding desired behaviors and punishing undesired ones',
            prerequisites: [1, 3]
          },
          {
            id: 8,
            label: 'Probability Theory',
            type: 'concept',
            importance: 8,
            mastery: 70,
            color: '#6c5ce7',
            domainArea: 'Mathematics',
            depthLevel: 2,
            resourceCount: 7,
            descriptionShort: 'Branch of mathematics concerned with numerical descriptions of how likely an event is to occur',
            prerequisites: [3]
          },
          {
            id: 9,
            label: 'Data Visualization',
            type: 'concept',
            importance: 6,
            mastery: 85,
            color: '#00b894',
            domainArea: 'Data Science',
            depthLevel: 2,
            resourceCount: 8,
            descriptionShort: 'Graphical representation of data and information',
            prerequisites: [3]
          },
          {
            id: 10,
            label: 'Computer Vision',
            type: 'concept',
            importance: 7,
            mastery: 50,
            color: '#0984e3',
            domainArea: 'Computer Science',
            depthLevel: 3,
            resourceCount: 6,
            descriptionShort: 'Field of AI that enables computers to derive information from images and videos',
            prerequisites: [5, 6]
          }
        ],
        links: [
          {
            source: 2,
            target: 1,
            type: 'prerequisite',
            strength: 'strong',
            strengthValue: 90,
            bidirectional: false,
            description: 'Linear algebra is essential for understanding machine learning algorithms'
          },
          {
            source: 3,
            target: 1,
            type: 'prerequisite',
            strength: 'strong',
            strengthValue: 85,
            bidirectional: false,
            description: 'Statistical concepts are fundamental to machine learning'
          },
          {
            source: 1,
            target: 4,
            type: 'prerequisite',
            strength: 'strong',
            strengthValue: 90,
            bidirectional: false,
            description: 'Machine learning concepts are essential for neural networks'
          },
          {
            source: 2,
            target: 4,
            type: 'prerequisite',
            strength: 'moderate',
            strengthValue: 70,
            bidirectional: false,
            description: 'Linear algebra is used in neural network computations'
          },
          {
            source: 3,
            target: 4,
            type: 'prerequisite',
            strength: 'moderate',
            strengthValue: 65,
            bidirectional: false,
            description: 'Statistical concepts help understand neural network behavior'
          },
          {
            source: 4,
            target: 5,
            type: 'prerequisite',
            strength: 'strong',
            strengthValue: 95,
            bidirectional: false,
            description: 'Neural networks are the foundation of deep learning'
          },
          {
            source: 5,
            target: 6,
            type: 'prerequisite',
            strength: 'strong',
            strengthValue: 85,
            bidirectional: false,
            description: 'Deep learning concepts are required for understanding convolutional networks'
          },
          {
            source: 1,
            target: 7,
            type: 'prerequisite',
            strength: 'strong',
            strengthValue: 80,
            bidirectional: false,
            description: 'Machine learning fundamentals are required for reinforcement learning'
          },
          {
            source: 3,
            target: 7,
            type: 'prerequisite',
            strength: 'moderate',
            strengthValue: 70,
            bidirectional: false,
            description: 'Statistical knowledge helps with reinforcement learning algorithms'
          },
          {
            source: 3,
            target: 8,
            type: 'prerequisite',
            strength: 'strong',
            strengthValue: 90,
            bidirectional: false,
            description: 'Statistics is closely related to probability theory'
          },
          {
            source: 3,
            target: 9,
            type: 'related',
            strength: 'moderate',
            strengthValue: 65,
            bidirectional: true,
            description: 'Statistical knowledge enhances data visualization capabilities'
          },
          {
            source: 5,
            target: 10,
            type: 'prerequisite',
            strength: 'strong',
            strengthValue: 85,
            bidirectional: false,
            description: 'Deep learning is essential for modern computer vision'
          },
          {
            source: 6,
            target: 10,
            type: 'prerequisite',
            strength: 'strong',
            strengthValue: 90,
            bidirectional: false,
            description: 'Convolutional networks are fundamental to computer vision'
          }
        ],
        domains: ['Computer Science', 'Mathematics', 'Data Science'],
        resourceConnections: [
          { conceptId: 1, resourceId: 101, resourceType: 'article' },
          { conceptId: 1, resourceId: 102, resourceType: 'video' },
          { conceptId: 1, resourceId: 103, resourceType: 'interactive' },
          { conceptId: 2, resourceId: 201, resourceType: 'article' },
          { conceptId: 3, resourceId: 301, resourceType: 'video' }
        ],
        userProgress: [
          { conceptId: 1, mastery: 65, knowledgeGaps: [1001, 1002] },
          { conceptId: 2, mastery: 80, knowledgeGaps: [] },
          { conceptId: 3, mastery: 75, knowledgeGaps: [3001] },
          { conceptId: 4, mastery: 60, knowledgeGaps: [4001, 4002] },
          { conceptId: 5, mastery: 55, knowledgeGaps: [5001] }
        ]
      };
    },
    staleTime: 1000 * 60 * 5 // 5 minutes
  });
  
  // Fetch user's knowledge gaps
  const { data: knowledgeGaps } = useQuery({
    queryKey: ['knowledgeGaps', userId],
    queryFn: async () => {
      // In a real implementation, this would be an API call
      // For now, return mock data
      return [
        { id: 1001, conceptId: 1, topic: 'Gradient Descent Optimization', confidenceScore: 30 },
        { id: 1002, conceptId: 1, topic: 'Regularization Techniques', confidenceScore: 35 },
        { id: 3001, conceptId: 3, topic: 'Bayesian Statistics', confidenceScore: 25 },
        { id: 4001, conceptId: 4, topic: 'Backpropagation Algorithm', confidenceScore: 40 },
        { id: 4002, conceptId: 4, topic: 'Activation Functions', confidenceScore: 35 },
        { id: 5001, conceptId: 5, topic: 'Transfer Learning', confidenceScore: 20 }
      ];
    },
    enabled: !!userId
  });
  
  // Select initial node if provided
  useEffect(() => {
    if (initialConceptId && graphData) {
      const node = graphData.nodes.find(n => n.id === initialConceptId);
      if (node) {
        setSelectedNode(node as EnhancedGraphNode);
        setShowResourcePanel(true);
      }
    }
  }, [initialConceptId, graphData]);
  
  // Handle node click
  const handleNodeClick = (node: EnhancedGraphNode) => {
    setSelectedNode(node);
    setShowResourcePanel(true);
    
    // Highlight connected nodes
    const connectedLinks = graphData?.links.filter(
      link => link.source === node.id || link.target === node.id
    );
    
    const connectedNodeIds = new Set<number>();
    connectedLinks?.forEach(link => {
      const sourceId = typeof link.source === 'number' ? link.source : link.source.id;
      const targetId = typeof link.target === 'number' ? link.target : link.target.id;
      
      if (sourceId !== node.id) connectedNodeIds.add(sourceId);
      if (targetId !== node.id) connectedNodeIds.add(targetId);
    });
    
    setHighlightNodes(Array.from(connectedNodeIds));
  };
  
  // Handle link click
  const handleLinkClick = (link: EnhancedGraphLink) => {
    // Show relationship details, if needed
    console.log('Link clicked:', link);
  };
  
  // Handle search
  const handleSearch = () => {
    if (!searchQuery.trim() || !graphData) return;
    
    const query = searchQuery.toLowerCase();
    const matchingNodes = graphData.nodes.filter(node => 
      node.label.toLowerCase().includes(query) || 
      (node.descriptionShort && node.descriptionShort.toLowerCase().includes(query))
    );
    
    if (matchingNodes.length > 0) {
      // Select the first matching node
      const firstMatch = matchingNodes[0] as EnhancedGraphNode;
      setSelectedNode(firstMatch);
      setShowResourcePanel(true);
      
      // Highlight all matching nodes
      setHighlightNodes(matchingNodes.map(node => node.id));
    }
  };
  
  // Get domains from graph data
  const getDomains = () => {
    if (!graphData) return [];
    return Array.from(new Set(graphData.nodes
      .map(node => (node as EnhancedGraphNode).domainArea)
      .filter(Boolean)
    ));
  };
  
  // Filter graph by domain
  const filterByDomain = (domain: string) => {
    if (!graphData) return;
    
    if (domain === 'all') {
      setHighlightNodes([]);
      return;
    }
    
    const matchingNodes = graphData.nodes.filter(
      node => (node as EnhancedGraphNode).domainArea === domain
    );
    
    setHighlightNodes(matchingNodes.map(node => node.id));
  };
  
  // Identify knowledge gaps in the graph
  const getKnowledgeGapNodes = () => {
    if (!graphData || !knowledgeGaps) return [];
    
    const gapConceptIds = new Set(knowledgeGaps.map(gap => gap.conceptId));
    return graphData.nodes
      .filter(node => gapConceptIds.has(node.id))
      .map(node => node.id);
  };
  
  return (
    <div className="w-full h-full flex flex-col">
      {/* Controls */}
      <div className="bg-white p-4 border-b flex flex-wrap items-center gap-4">
        <div className="flex items-center">
          <Network className="h-5 w-5 mr-2 text-blue-600" />
          <h2 className="text-lg font-medium">Knowledge Graph</h2>
        </div>
        
        <div className="flex items-center ml-auto">
          <div className="relative w-64 mr-4">
            <Input
              placeholder="Search concepts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pr-8"
            />
            <Search 
              className="h-4 w-4 text-muted-foreground absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer" 
              onClick={handleSearch}
            />
          </div>
          
          <Select defaultValue="all" onValueChange={filterByDomain}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Filter by domain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Domains</SelectItem>
              {getDomains().map(domain => (
                <SelectItem key={domain} value={domain}>{domain}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="ml-4 flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Filter:</span>
            <Slider
              className="w-24"
              min={0}
              max={10}
              step={1}
              value={[filterLevel]}
              onValueChange={(values) => setFilterLevel(values[0])}
            />
          </div>
          
          <div className="flex space-x-2 ml-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const gapNodes = getKnowledgeGapNodes();
                setHighlightNodes(gapNodes.length > 0 ? gapNodes : []);
              }}
            >
              <Brain className="h-4 w-4 mr-1" />
              Knowledge Gaps
            </Button>
            
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Graph visualization */}
        <div className={`flex-1 overflow-hidden ${showResourcePanel ? 'border-r' : ''}`}>
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <p>Loading knowledge graph...</p>
            </div>
          ) : graphData ? (
            <GraphVisualization
              data={graphData}
              width={width - (showResourcePanel ? 420 : 0)}
              height={height - 70}
              onNodeClick={handleNodeClick}
              onLinkClick={handleLinkClick}
              highlightNodes={highlightNodes}
              filterLevel={filterLevel}
              colorBy={colorBy}
              sizeBy={sizeBy}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <p>No graph data available</p>
            </div>
          )}
        </div>
        
        {/* Resource panel */}
        {showResourcePanel && (
          <div className="w-96 overflow-y-auto">
            <ResourcePanel
              node={selectedNode}
              userId={userId}
              onClose={() => setShowResourcePanel(false)}
            />
          </div>
        )}
      </div>
      
      {/* Legend */}
      <div className="bg-white border-t p-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
          <span>High Mastery</span>
        </div>
        
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></div>
          <span>Medium Mastery</span>
        </div>
        
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
          <span>Low Mastery</span>
        </div>
        
        <div className="flex items-center">
          <div className="w-4 h-0.5 bg-red-500 mr-1"></div>
          <span>Prerequisite</span>
        </div>
        
        <div className="flex items-center">
          <div className="w-4 h-0.5 bg-blue-500 mr-1"></div>
          <span>Related</span>
        </div>
        
        <div className="flex items-center">
          <div className="w-4 h-0.5 bg-green-500 mr-1"></div>
          <span>Extension</span>
        </div>
        
        <div className="ml-auto flex items-center">
          <Select value={colorBy} onValueChange={(value: 'domain' | 'mastery' | 'importance') => setColorBy(value)}>
            <SelectTrigger className="h-7 text-xs w-32">
              <SelectValue placeholder="Color by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="domain">Color by Domain</SelectItem>
              <SelectItem value="mastery">Color by Mastery</SelectItem>
              <SelectItem value="importance">Color by Importance</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sizeBy} onValueChange={(value: 'importance' | 'resourceCount' | 'mastery') => setSizeBy(value)} className="ml-2">
            <SelectTrigger className="h-7 text-xs w-32">
              <SelectValue placeholder="Size by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="importance">Size by Importance</SelectItem>
              <SelectItem value="resourceCount">Size by Resources</SelectItem>
              <SelectItem value="mastery">Size by Mastery</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default EnhancedKnowledgeGraph;
