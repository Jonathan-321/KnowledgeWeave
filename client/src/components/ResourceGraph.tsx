import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as d3 from 'd3';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Book, 
  Video, 
  MousePointer, 
  ZoomIn, 
  ZoomOut, 
  RefreshCw,
  Globe,
  Layers,
  BookOpen,
  BarChart
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

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

interface ResourceConnection {
  sourceResourceId: number;
  targetResourceId: number;
  connectionType: 'prerequisite' | 'extension' | 'alternative' | 'application' | 'deepDive';
  connectionStrength: number;
}

interface ResourceGraphProps {
  conceptIds: number[];
  width?: number;
  height?: number;
  onResourceSelect?: (resource: CuratedResource) => void;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface GraphNode {
  id: number;
  title: string;
  type: string;
  group: number;
  quality: string;
  relevance: number;
  url: string;
  imageUrl?: string;
  resource: CuratedResource;
}

interface GraphLink {
  source: number;
  target: number;
  value: number;
  type: string;
}

export function ResourceGraph({ conceptIds, width = 800, height = 600, onResourceSelect }: ResourceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterQuality, setFilterQuality] = useState<string>('all');
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [graphData, setGraphData] = useState<GraphData | null>(null);

  // Fetch the resource graph data
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/resource-graph/concepts', conceptIds.join(',')],
    queryFn: async () => {
      const response = await fetch(`/api/resource-graph/concepts?conceptIds=${conceptIds.join(',')}`);
      if (!response.ok) {
        throw new Error('Failed to fetch resource graph data');
      }
      return response.json();
    },
    enabled: conceptIds.length > 0,
  });

  // Transform API data into graph data
  useEffect(() => {
    if (data) {
      const nodes: GraphNode[] = data.resources.map((resource: CuratedResource) => {
        // Determine the group based on resource type
        let group = 1;
        switch (resource.sourceType) {
          case 'video': group = 1; break;
          case 'article': group = 2; break;
          case 'interactive': group = 3; break;
          case 'course': group = 4; break;
          case 'book': group = 5; break;
          case 'tool': group = 6; break;
          default: group = 7;
        }

        // Get the most relevant concept connection
        const primaryConnection = resource.conceptConnections.reduce(
          (prev, current) => (current.relevanceScore > prev.relevanceScore ? current : prev),
          resource.conceptConnections[0]
        );

        return {
          id: resource.id,
          title: resource.title,
          type: resource.sourceType,
          group,
          quality: resource.sourceQuality,
          relevance: primaryConnection?.relevanceScore || 50,
          url: resource.url,
          imageUrl: resource.imageUrl,
          resource,
        };
      });

      const links: GraphLink[] = data.connections.map((conn: ResourceConnection) => ({
        source: conn.sourceResourceId,
        target: conn.targetResourceId,
        value: conn.connectionStrength,
        type: conn.connectionType,
      }));

      setGraphData({ nodes, links });
    }
  }, [data]);

  // Apply filters to graph data
  const filteredData = React.useMemo(() => {
    if (!graphData) return null;

    let filteredNodes = graphData.nodes;

    // Apply type filter
    if (filterType !== 'all') {
      filteredNodes = filteredNodes.filter(node => node.type === filterType);
    }

    // Apply quality filter
    if (filterQuality !== 'all') {
      filteredNodes = filteredNodes.filter(node => node.quality === filterQuality);
    }

    // Get node IDs to filter links
    const nodeIds = new Set(filteredNodes.map(node => node.id));
    
    // Filter links to only include those between visible nodes
    const filteredLinks = graphData.links.filter(
      link => nodeIds.has(link.source as number) && nodeIds.has(link.target as number)
    );

    return { nodes: filteredNodes, links: filteredLinks };
  }, [graphData, filterType, filterQuality]);

  // D3 visualization
  useEffect(() => {
    if (!filteredData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g');

    // Create a zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    // Apply zoom behavior to SVG
    svg.call(zoom);

    // Reset zoom to initial state
    svg.call(zoom.transform, d3.zoomIdentity);

    // Create a force simulation
    const simulation = d3.forceSimulation<GraphNode, GraphLink>(filteredData.nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(filteredData.links)
        .id(d => d.id)
        .distance(link => 100 / (link.value / 50))
      )
      .force('charge', d3.forceManyBody().strength(-120))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    // Create the links
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(filteredData.links)
      .enter()
      .append('line')
      .attr('stroke-width', d => Math.max(1, d.value / 20))
      .attr('stroke', d => {
        switch (d.type) {
          case 'prerequisite': return '#ff9800';
          case 'extension': return '#4caf50';
          case 'alternative': return '#2196f3';
          case 'application': return '#9c27b0';
          case 'deepDive': return '#e91e63';
          default: return '#999';
        }
      })
      .attr('stroke-opacity', 0.6);

    // Create the node groups
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(filteredData.nodes)
      .enter()
      .append('g')
      .call(d3.drag<SVGGElement, GraphNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      )
      .on('click', (event, d) => {
        setSelectedNode(d);
        if (onResourceSelect) {
          onResourceSelect(d.resource);
        }
      });

    // Add circles to nodes
    node.append('circle')
      .attr('r', d => Math.max(5, d.relevance / 10) + 5)
      .attr('fill', d => {
        // Color by resource type
        switch (d.type) {
          case 'video': return '#FF5252';
          case 'article': return '#2196F3';
          case 'interactive': return '#9C27B0';
          case 'course': return '#4CAF50';
          case 'book': return '#FF9800';
          case 'tool': return '#607D8B';
          default: return '#999';
        }
      })
      .attr('stroke', d => d.quality === 'high' ? '#FFD700' : (d.quality === 'medium' ? '#C0C0C0' : '#CD7F32'))
      .attr('stroke-width', 2);

    // Add icons to nodes
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', 'white')
      .attr('font-family', 'FontAwesome')
      .attr('font-size', '10px')
      .text(d => {
        switch (d.type) {
          case 'video': return '▶';
          case 'article': return '📄';
          case 'interactive': return '🔄';
          case 'course': return '🎓';
          case 'book': return '📚';
          case 'tool': return '🔧';
          default: return '?';
        }
      });

    // Add labels to nodes
    if (showLabels) {
      node.append('text')
        .attr('dy', 20)
        .attr('text-anchor', 'middle')
        .attr('font-size', '8px')
        .text(d => d.title.length > 20 ? d.title.substring(0, 20) + '...' : d.title)
        .attr('fill', '#333')
        .attr('stroke', 'white')
        .attr('stroke-width', 0.5)
        .attr('paint-order', 'stroke');
    }

    // Update positions on each tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as GraphNode).x || 0)
        .attr('y1', d => (d.source as GraphNode).y || 0)
        .attr('x2', d => (d.target as GraphNode).x || 0)
        .attr('y2', d => (d.target as GraphNode).y || 0);

      node.attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);
    });

    // Clean up
    return () => {
      simulation.stop();
    };
  }, [filteredData, width, height, showLabels, onResourceSelect]);

  // Helper function to get icon by resource type
  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'article': return <BookOpen className="h-4 w-4" />;
      case 'interactive': return <MousePointer className="h-4 w-4" />;
      case 'course': return <Book className="h-4 w-4" />;
      case 'book': return <Book className="h-4 w-4" />;
      case 'tool': return <Layers className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  // Handle zoom in
  const handleZoomIn = () => {
    if (!svgRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(750)
      .call(
        d3.zoom<SVGSVGElement, unknown>().on('zoom', (event) => {
          d3.select(svgRef.current)
            .select('g')
            .attr('transform', event.transform);
        }).scaleBy,
        1.2
      );
  };

  // Handle zoom out
  const handleZoomOut = () => {
    if (!svgRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(750)
      .call(
        d3.zoom<SVGSVGElement, unknown>().on('zoom', (event) => {
          d3.select(svgRef.current)
            .select('g')
            .attr('transform', event.transform);
        }).scaleBy,
        0.8
      );
  };

  // Handle reset view
  const handleResetView = () => {
    if (!svgRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(750)
      .call(
        d3.zoom<SVGSVGElement, unknown>().on('zoom', (event) => {
          d3.select(svgRef.current)
            .select('g')
            .attr('transform', event.transform);
        }).transform,
        d3.zoomIdentity
      );
  };

  if (isLoading) {
    return (
      <Card className="w-full h-full">
        <CardContent className="pt-6">
          <div className="flex flex-col space-y-4">
            <Skeleton className="h-[600px] w-full rounded-md" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="w-full h-full">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center h-[600px]">
            <p className="text-muted-foreground mb-4">Error loading resource graph</p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full">
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Resource Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="article">Articles</SelectItem>
                <SelectItem value="interactive">Interactive</SelectItem>
                <SelectItem value="course">Courses</SelectItem>
                <SelectItem value="book">Books</SelectItem>
                <SelectItem value="tool">Tools</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterQuality} onValueChange={setFilterQuality}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Quality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Qualities</SelectItem>
                <SelectItem value="high">High Quality</SelectItem>
                <SelectItem value="medium">Medium Quality</SelectItem>
                <SelectItem value="low">Basic Quality</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <Switch
                id="show-labels"
                checked={showLabels}
                onCheckedChange={setShowLabels}
              />
              <Label htmlFor="show-labels">Show Labels</Label>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" size="icon" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleResetView}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="relative">
          <svg
            ref={svgRef}
            width={width}
            height={height}
            className="border rounded-md bg-slate-50"
          />
          
          {selectedNode && (
            <div className="absolute bottom-4 right-4 w-80 bg-white p-4 rounded-md shadow-md">
              <h3 className="font-medium text-sm flex items-center">
                {getResourceIcon(selectedNode.type)}
                <span className="ml-1">{selectedNode.title}</span>
              </h3>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {selectedNode.resource.description}
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                <Badge variant="outline" className="text-xs">
                  {selectedNode.type}
                </Badge>
                <Badge variant={selectedNode.quality === 'high' ? 'default' : 'outline'} className="text-xs">
                  {selectedNode.quality} quality
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {selectedNode.resource.estimatedTimeMinutes} min
                </Badge>
              </div>
              <div className="mt-3 flex justify-end">
                <Button size="sm" variant="outline" asChild>
                  <a href={selectedNode.url} target="_blank" rel="noopener noreferrer">
                    Open Resource
                  </a>
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-4 flex flex-wrap gap-2">
          <div className="flex items-center text-xs">
            <span className="inline-block w-3 h-3 rounded-full bg-[#FF5252] mr-1"></span> Video
          </div>
          <div className="flex items-center text-xs">
            <span className="inline-block w-3 h-3 rounded-full bg-[#2196F3] mr-1"></span> Article
          </div>
          <div className="flex items-center text-xs">
            <span className="inline-block w-3 h-3 rounded-full bg-[#9C27B0] mr-1"></span> Interactive
          </div>
          <div className="flex items-center text-xs">
            <span className="inline-block w-3 h-3 rounded-full bg-[#4CAF50] mr-1"></span> Course
          </div>
          <div className="flex items-center text-xs">
            <span className="inline-block w-3 h-3 rounded-full bg-[#FF9800] mr-1"></span> Book
          </div>
          <div className="flex items-center text-xs">
            <span className="inline-block w-3 h-3 rounded-full border-2 border-[#FFD700] mr-1"></span> High Quality
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
