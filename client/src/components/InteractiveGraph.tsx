import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import * as d3 from "d3";
import { GraphNode, GraphLink, Concept } from "@shared/schema";

export default function InteractiveGraph() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // Fetch graph data and concepts
  const { data: graph } = useQuery({
    queryKey: ['/api/graph'],
  });
  
  const { data: concepts } = useQuery({
    queryKey: ['/api/concepts'],
  });

  // Create the interactive visualization
  useEffect(() => {
    if (!graph || !svgRef.current || !containerRef.current) return;
    
    // Clear any existing elements
    d3.select(svgRef.current).selectAll("*").remove();
    
    const svg = d3.select(svgRef.current);
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    
    // Add zoom functionality
    const zoom = d3.zoom()
      .scaleExtent([0.1, 3])
      .on("zoom", (event) => {
        mainGroup.attr("transform", event.transform);
      });
    
    svg.call(zoom as any);
    
    // Create main group for all elements
    const mainGroup = svg.append("g");
    
    // Add links between nodes
    const link = mainGroup.selectAll(".link")
      .data(graph.links || [])
      .enter()
      .append("line")
      .attr("class", "link")
      .style("stroke", "#999")
      .style("stroke-opacity", 0.6)
      .style("stroke-width", (d: any) => 
        d.strength === "strong" ? 3 : 
        d.strength === "moderate" ? 2 : 1
      );
    
    // Create a force simulation
    const simulation = d3.forceSimulation(graph.nodes)
      .force("link", d3.forceLink(graph.links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(30));
    
    // Add the nodes
    const node = mainGroup.selectAll(".node")
      .data(graph.nodes || [])
      .enter()
      .append("circle")
      .attr("class", "node")
      .attr("r", (d: any) => d.type === "concept" ? 20 : 15)
      .style("fill", (d: any) => {
        if (d.type === "concept") return "#3b82f6"; // blue
        if (d.type === "document") return "#8b5cf6"; // purple
        return "#60a5fa"; // light blue for others
      })
      .style("stroke", "#fff")
      .style("stroke-width", 1.5)
      .style("cursor", "pointer")
      .on("click", (event: any, d: any) => {
        event.preventDefault();
        event.stopPropagation();
        
        if (d.type === "concept") {
          // Navigate directly to the learning page for this concept
          window.location.href = `/learning?conceptId=${d.id}`;
        } else if (d.type === "document") {
          // For documents, navigate to the documents page
          window.location.href = `/documents`;
        }
      })
      .call(d3.drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any
      );
    
    // Add labels to nodes
    const label = mainGroup.selectAll(".label")
      .data(graph.nodes || [])
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("text-anchor", "middle")
      .attr("dy", 30)
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .text((d: any) => d.label);
    
    // Update positions on each tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);
      
      node
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y);
      
      label
        .attr("x", (d: any) => d.x)
        .attr("y", (d: any) => d.y);
    });
    
    // Drag functions
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    
    // Cleanup on unmount
    return () => {
      simulation.stop();
    };
  }, [graph]);

  return (
    <div className="w-full h-[500px] border border-neutral-200 dark:border-gray-700 rounded-lg overflow-hidden relative" ref={containerRef}>
      {!graph || !graph.nodes || graph.nodes.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">No graph data available</p>
        </div>
      ) : (
        <svg ref={svgRef} className="w-full h-full"></svg>
      )}
      
      {/* Legend */}
      <div className="absolute bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 p-2 flex flex-wrap gap-3 text-xs">
        <div className="flex items-center">
          <span className="w-3 h-3 bg-blue-500 rounded-full mr-1"></span>
          <span>Concepts</span>
        </div>
        <div className="flex items-center">
          <span className="w-3 h-3 bg-purple-500 rounded-full mr-1"></span>
          <span>Documents</span>
        </div>
        <div className="flex items-center">
          <span className="text-xs italic text-gray-600">Click any node to explore</span>
        </div>
      </div>
    </div>
  );
}