import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { EnhancedGraphNode, EnhancedGraphLink, EnhancedKnowledgeGraph, ConceptRelationshipType } from '@shared/enhancedSchema';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut, Maximize, Filter, Settings } from 'lucide-react';

interface GraphVisualizationProps {
  data: EnhancedKnowledgeGraph;
  width?: number;
  height?: number;
  onNodeClick?: (node: EnhancedGraphNode) => void;
  onLinkClick?: (link: EnhancedGraphLink) => void;
  highlightNodes?: number[];
  filterLevel?: number;
  colorBy?: 'domain' | 'mastery' | 'importance';
  sizeBy?: 'importance' | 'resourceCount' | 'mastery';
}

const GraphVisualization: React.FC<GraphVisualizationProps> = ({
  data,
  width = 800,
  height = 600,
  onNodeClick,
  onLinkClick,
  highlightNodes = [],
  filterLevel = 0,
  colorBy = 'domain',
  sizeBy = 'importance',
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoom, setZoom] = useState(1);
  const [selectedNode, setSelectedNode] = useState<EnhancedGraphNode | null>(null);
  
  // Map relationship types to colors
  const relationshipColors: Record<ConceptRelationshipType, string> = {
    'prerequisite': '#ff6b6b',
    'related': '#74b9ff',
    'extension': '#55efc4',
    'application': '#ffeaa7',
    'example': '#81ecec',
  };
  
  // Create color scale based on domain areas
  const getDomainColor = (node: EnhancedGraphNode) => {
    const domainColors: Record<string, string> = {
      'mathematics': '#6c5ce7',
      'computer science': '#0984e3',
      'physics': '#00b894',
      'biology': '#00cec9',
      'chemistry': '#fdcb6e',
      'economics': '#e17055',
      'psychology': '#e84393',
      'history': '#d63031',
      'language': '#636e72',
      'default': '#2d3436'
    };
    
    return domainColors[node.domainArea?.toLowerCase() || 'default'] || domainColors.default;
  };
  
  // Color scale for mastery levels
  const getMasteryColor = (node: EnhancedGraphNode) => {
    if (node.mastery === undefined) return '#b2bec3'; // No mastery data
    
    if (node.mastery >= 80) return '#00b894'; // High mastery (green)
    if (node.mastery >= 50) return '#fdcb6e'; // Medium mastery (yellow)
    return '#ff7675'; // Low mastery (red)
  };
  
  // Get color based on selected attribute
  const getNodeColor = (node: EnhancedGraphNode) => {
    if (highlightNodes.includes(node.id)) {
      return '#ff9ff3'; // Highlight color
    }
    
    switch (colorBy) {
      case 'domain':
        return getDomainColor(node);
      case 'mastery':
        return getMasteryColor(node);
      case 'importance':
        // Gradient from gray to blue based on importance
        const importanceValue = node.importance || 5;
        const intensity = Math.min(255, Math.floor(importanceValue * 25));
        return `rgb(${100 - intensity / 3}, ${120 - intensity / 4}, ${200 + intensity / 4})`;
      default:
        return '#74b9ff';
    }
  };
  
  // Get node size based on selected attribute
  const getNodeSize = (node: EnhancedGraphNode) => {
    const baseSize = 8;
    
    switch (sizeBy) {
      case 'importance':
        return baseSize + (node.importance || 5) * 1.5;
      case 'resourceCount':
        return baseSize + (node.resourceCount || 0) * 0.8;
      case 'mastery':
        if (node.mastery === undefined) return baseSize;
        return baseSize + node.mastery / 10;
      default:
        return baseSize + 5;
    }
  };
  
  // Filter nodes based on filter level
  const getFilteredData = () => {
    if (filterLevel <= 0) return data;
    
    // Filter out less important nodes
    const filteredNodes = data.nodes.filter(node => 
      (node.importance || 5) >= filterLevel || 
      highlightNodes.includes(node.id)
    );
    
    // Get IDs of remaining nodes
    const nodeIds = new Set(filteredNodes.map(node => node.id));
    
    // Filter links to only include connections between remaining nodes
    const filteredLinks = data.links.filter(link => 
      nodeIds.has(link.source as number) && nodeIds.has(link.target as number)
    );
    
    return {
      nodes: filteredNodes,
      links: filteredLinks,
      domains: data.domains,
      resourceConnections: data.resourceConnections,
      userProgress: data.userProgress
    };
  };
  
  // Create force simulation
  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;
    
    // Clear previous visualization
    d3.select(svgRef.current).selectAll("*").remove();
    
    const filteredData = getFilteredData();
    
    // Create SVG element
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto;");
    
    // Create zoom behavior
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.25, 5])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        setZoom(event.transform.k);
      });
    
    svg.call(zoomBehavior);
    
    // Create container for graph elements
    const g = svg.append("g");
    
    // Create links
    const link = g.append("g")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(filteredData.links)
      .join("line")
      .attr("stroke-width", d => Math.sqrt((d as EnhancedGraphLink).strengthValue || 50) / 7)
      .attr("stroke", d => {
        const enhancedLink = d as EnhancedGraphLink;
        return relationshipColors[enhancedLink.type] || "#999";
      })
      .attr("marker-end", d => (d as EnhancedGraphLink).bidirectional ? "" : "url(#arrow)");
    
    // Create arrow marker for directed links
    svg.append("defs").append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 15)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", "#999")
      .attr("d", "M0,-5L10,0L0,5");
    
    // Create nodes
    const node = g.append("g")
      .selectAll("circle")
      .data(filteredData.nodes)
      .join("circle")
      .attr("r", d => getNodeSize(d as EnhancedGraphNode))
      .attr("fill", d => getNodeColor(d as EnhancedGraphNode))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .call(d3.drag<SVGCircleElement, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any);
    
    // Add labels to nodes
    const labels = g.append("g")
      .selectAll("text")
      .data(filteredData.nodes)
      .join("text")
      .attr("font-size", 10)
      .attr("text-anchor", "middle")
      .attr("dy", 20)
      .text(d => (d as EnhancedGraphNode).label)
      .attr("pointer-events", "none")
      .attr("fill", "#333");
    
    // Add tooltips on hover
    node.append("title")
      .text(d => {
        const enhancedNode = d as EnhancedGraphNode;
        return `${enhancedNode.label}\n${enhancedNode.descriptionShort || ''}\nImportance: ${enhancedNode.importance || 5}/10${enhancedNode.mastery !== undefined ? `\nMastery: ${enhancedNode.mastery}%` : ''}`;
      });
    
    // Handle node click
    node.on("click", (event, d) => {
      const enhancedNode = d as EnhancedGraphNode;
      setSelectedNode(enhancedNode);
      if (onNodeClick) onNodeClick(enhancedNode);
      
      // Highlight selected node
      node.attr("stroke", n => n === d ? "#f368e0" : "#fff")
          .attr("stroke-width", n => n === d ? 3 : 1.5);
    });
    
    // Handle link click
    link.on("click", (event, d) => {
      const enhancedLink = d as EnhancedGraphLink;
      if (onLinkClick) onLinkClick(enhancedLink);
    });
    
    // Force simulation
    const simulation = d3.forceSimulation(filteredData.nodes)
      .force("link", d3.forceLink(filteredData.links)
        .id(d => (d as EnhancedGraphNode).id)
        .distance(link => 100 - ((link as EnhancedGraphLink).strengthValue || 50) / 2))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(d => getNodeSize(d as EnhancedGraphNode) * 1.5));
    
    // Update positions on each tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as any).x)
        .attr("y1", d => (d.source as any).y)
        .attr("x2", d => (d.target as any).x)
        .attr("y2", d => (d.target as any).y);
        
      node
        .attr("cx", d => Math.max(20, Math.min(width - 20, (d as any).x)))
        .attr("cy", d => Math.max(20, Math.min(height - 20, (d as any).y)));
        
      labels
        .attr("x", d => Math.max(20, Math.min(width - 20, (d as any).x)))
        .attr("y", d => Math.max(20, Math.min(height - 20, (d as any).y)));
    });
    
    // Drag functions
    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
    
    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
    
    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
    
    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [data, width, height, highlightNodes, filterLevel, colorBy, sizeBy]);
  
  // Reset zoom to fit all nodes
  const resetZoom = () => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.25, 5]);
    
    svg.transition()
      .duration(750)
      .call(zoomBehavior.transform, d3.zoomIdentity);
    
    setZoom(1);
  };
  
  return (
    <div className="relative w-full h-full">
      <div className="absolute top-4 right-4 flex flex-col space-y-2 bg-white/80 backdrop-blur-sm p-2 rounded-md shadow-md z-10">
        <Button variant="outline" size="icon" onClick={resetZoom} title="Reset zoom">
          <Maximize className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => {
            if (!svgRef.current) return;
            const svg = d3.select(svgRef.current);
            const zoomBehavior = d3.zoom<SVGSVGElement, unknown>();
            svg.transition().duration(300).call(zoomBehavior.scaleBy, 1.2);
            setZoom(zoom * 1.2);
          }} 
          title="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => {
            if (!svgRef.current) return;
            const svg = d3.select(svgRef.current);
            const zoomBehavior = d3.zoom<SVGSVGElement, unknown>();
            svg.transition().duration(300).call(zoomBehavior.scaleBy, 0.8);
            setZoom(zoom * 0.8);
          }}
          title="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
      </div>
      
      {selectedNode && (
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm p-3 rounded-md shadow-md max-w-xs z-10">
          <h3 className="font-bold text-sm">{selectedNode.label}</h3>
          <p className="text-xs text-gray-600 mt-1">{selectedNode.descriptionShort}</p>
          {selectedNode.resourceCount !== undefined && (
            <p className="text-xs mt-1">
              <span className="font-medium">Resources:</span> {selectedNode.resourceCount}
            </p>
          )}
          {selectedNode.mastery !== undefined && (
            <div className="mt-1">
              <p className="text-xs font-medium">Mastery: {selectedNode.mastery}%</p>
              <div className="w-full h-1.5 bg-gray-200 rounded-full mt-1">
                <div 
                  className="h-full rounded-full" 
                  style={{ 
                    width: `${selectedNode.mastery}%`,
                    backgroundColor: getMasteryColor(selectedNode)
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
      
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default GraphVisualization;
