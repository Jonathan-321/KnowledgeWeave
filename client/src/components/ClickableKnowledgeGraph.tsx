import { useEffect, useRef, useState, MouseEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import * as d3 from "d3";
import { Search, ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GraphNode, GraphLink, Concept } from "@shared/schema";
import { createForceSimulation } from "@/lib/d3-graph";

interface KnowledgeGraphProps {
  onSelectConcept?: (concept: Concept) => void;
}

export default function ClickableKnowledgeGraph({ onSelectConcept }: KnowledgeGraphProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  // Fetch graph data
  const { data: graph } = useQuery({
    queryKey: ['/api/graph'],
  });

  // Fetch all concepts for details
  const { data: concepts } = useQuery({
    queryKey: ['/api/concepts'],
  });

  // Handle node click - directly navigate to learning page
  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node);
    
    if (node.type === "concept") {
      // Find the full concept data
      const concept = Array.isArray(concepts) ? 
        concepts.find((c: Concept) => c.id === node.id) : null;
      
      if (concept) {
        console.log("Selected concept:", concept);
        
        // Redirect directly to the learning page
        window.location.href = `/learning?conceptId=${node.id}`;
        
        // Also call the onSelectConcept if provided
        if (onSelectConcept) {
          onSelectConcept(concept);
        }
      }
    } else if (node.type === "document") {
      // Create a document concept for display
      const documentNode = {
        id: node.id,
        name: node.label,
        description: "This document contains information related to the concepts in your knowledge graph.",
        tags: ["document"],
        userId: 1
      };
      
      // For documents, we navigate to the documents page
      window.location.href = `/documents`;
      
      // Also call onSelectConcept if provided
      if (onSelectConcept) {
        onSelectConcept(documentNode as any);
      }
    }
  };

  // Initialize the graph visualization
  useEffect(() => {
    // Only proceed if we have data and container elements
    if (!graph || !svgRef.current || !containerRef.current) return;
    
    // Clear previous graph
    d3.select(svgRef.current).selectAll("*").remove();
    
    // Get container dimensions
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    
    // Create the force-directed graph
    const sim = createForceSimulation(
      svgRef.current,
      graph.nodes || [],
      graph.links || [],
      width,
      height,
      handleNodeClick
    );
    
    // Cleanup on unmount
    return () => {
      if (sim) {
        sim.stop();
      }
    };
  }, [graph, concepts]);

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-background">
      <div className="flex items-center justify-between p-3 border-b border-neutral-200 dark:border-gray-700">
        <div className="flex items-center flex-1 mr-4">
          <Search className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
          <Input
            placeholder="Search concepts..."
            className="h-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-1">
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <Maximize className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 relative" ref={containerRef}>
        {!graph || !graph.nodes || graph.nodes.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">No data available</p>
          </div>
        ) : (
          <svg ref={svgRef} className="w-full h-full"></svg>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2 p-3 border-t border-neutral-200 dark:border-gray-700">
        <div className="flex items-center">
          <span className="w-3 h-3 bg-primary rounded-full mr-1"></span>
          <span className="text-xs text-gray-600 dark:text-gray-300">Concepts</span>
        </div>
        <div className="flex items-center">
          <span className="w-3 h-3 bg-purple-500 rounded-full mr-1"></span>
          <span className="text-xs text-gray-600 dark:text-gray-300">Documents</span>
        </div>
        <div className="flex items-center">
          <span className="w-3 h-3 bg-blue-400 rounded-full mr-1"></span>
          <span className="text-xs text-gray-600 dark:text-gray-300">AI-Generated</span>
        </div>
      </div>
    </div>
  );
}