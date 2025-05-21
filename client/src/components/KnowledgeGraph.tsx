import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as d3 from "d3";
import { Search, ZoomIn, ZoomOut, Maximize, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GraphNode, GraphLink, Concept } from "@shared/schema";
import { createForceSimulation } from "@/lib/d3-graph";

interface KnowledgeGraphProps {
  onSelectConcept: (concept: Concept) => void;
  redirectToLearning?: boolean;
}

export default function KnowledgeGraph({ onSelectConcept, redirectToLearning = false }: KnowledgeGraphProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [simulation, setSimulation] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const { data: graph, isLoading } = useQuery({
    queryKey: ["/api/graph"],
  });

  const { data: concepts } = useQuery({
    queryKey: ["/api/concepts"],
  });

  useEffect(() => {
    if (!graph || !svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Clear previous graph
    d3.select(svgRef.current).selectAll("*").remove();

    const sim = createForceSimulation(
      svgRef.current,
      graph.nodes,
      graph.links,
      width,
      height,
      handleNodeClick
    );

    setSimulation(sim);

    // Cleanup on unmount
    return () => {
      if (sim) {
        sim.stop();
      }
    };
  }, [graph, svgRef.current, containerRef.current]);

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node);
    
    if (node.type === "concept") {
      // Find the full concept data from our concepts
      const concept = concepts?.find((c: Concept) => c.id === node.id);
      
      if (concept) {
        // Log the concept that's being selected (for debugging)
        console.log("Selected concept:", concept);
        
        // Trigger the parent component's handler
        onSelectConcept(concept);
        
        // If redirectToLearning is true, we'll navigate to the learning page
        if (redirectToLearning) {
          // Using window.location for direct navigation
          window.location.href = `/learning?conceptId=${concept.id}`;
        }
      } else {
        console.error("Concept not found in available concepts:", node.id);
      }
    } else if (node.type === "document") {
      // For document nodes, create a document concept object to display
      const documentConcept = {
        id: node.id,
        name: node.label,
        description: "This document contains information related to the concepts in your knowledge graph.",
        tags: ["document"],
        userId: 1,
        complexity: 3
      };
      
      // Pass the document as a concept to the detail panel
      onSelectConcept(documentConcept);
    } else {
      console.log("Clicked on node:", node);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    
    if (!simulation) return;
    
    const term = e.target.value.toLowerCase();
    
    // Highlight nodes that match the search term
    d3.select(svgRef.current)
      .selectAll(".graph-node")
      .attr("opacity", (d: any) => {
        if (!term) return 1;
        return d.label.toLowerCase().includes(term) ? 1 : 0.2;
      });
    
    // Highlight links connected to matching nodes
    d3.select(svgRef.current)
      .selectAll(".graph-link")
      .attr("opacity", (d: any) => {
        if (!term) return 0.6;
        const sourceMatches = graph.nodes.find(
          (n: GraphNode) => n.id === d.source.id && n.label.toLowerCase().includes(term)
        );
        const targetMatches = graph.nodes.find(
          (n: GraphNode) => n.id === d.target.id && n.label.toLowerCase().includes(term)
        );
        return sourceMatches || targetMatches ? 0.8 : 0.1;
      });
  };

  const handleZoomIn = () => {
    if (!svgRef.current) return;
    
    const zoom = d3.zoom().on("zoom", (event) => {
      d3.select(svgRef.current).select("g").attr("transform", event.transform);
    });
    
    d3.select(svgRef.current)
      .transition()
      .call(zoom.scaleBy, 1.5);
  };

  const handleZoomOut = () => {
    if (!svgRef.current) return;
    
    const zoom = d3.zoom().on("zoom", (event) => {
      d3.select(svgRef.current).select("g").attr("transform", event.transform);
    });
    
    d3.select(svgRef.current)
      .transition()
      .call(zoom.scaleBy, 0.75);
  };

  const handleReset = () => {
    if (!svgRef.current) return;
    
    const zoom = d3.zoom().on("zoom", (event) => {
      d3.select(svgRef.current).select("g").attr("transform", event.transform);
    });
    
    d3.select(svgRef.current)
      .transition()
      .call(zoom.transform, d3.zoomIdentity);
  };

  return (
    <div className="border border-neutral-200 dark:border-gray-700 rounded-lg mb-4">
      <div className="p-3 border-b border-neutral-200 dark:border-gray-700 bg-neutral-100 dark:bg-gray-800 rounded-t-lg flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={handleZoomIn}>
            <ZoomIn size={18} />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleZoomOut}>
            <ZoomOut size={18} />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleReset}>
            <Maximize size={18} />
          </Button>
        </div>
        <div className="flex items-center">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Search concepts..."
              className="h-8 pl-8 pr-4 w-56"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <Button variant="ghost" size="icon" className="ml-2">
            <Filter size={18} />
          </Button>
        </div>
      </div>
      
      <div ref={containerRef} className="knowledge-graph h-96 relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : !graph?.nodes?.length ? (
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
