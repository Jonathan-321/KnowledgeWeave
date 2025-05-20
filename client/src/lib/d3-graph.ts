import * as d3 from "d3";
import { GraphNode, GraphLink } from "@shared/schema";

export function createForceSimulation(
  svgElement: SVGSVGElement,
  nodes: GraphNode[],
  links: GraphLink[],
  width: number,
  height: number,
  onNodeClick: (node: GraphNode) => void
) {
  // Create a zoom behavior
  const zoom = d3.zoom().on("zoom", (event) => {
    svg.attr("transform", event.transform);
  });
  
  // Create SVG group element
  const svg = d3.select(svgElement)
    .call(zoom as any)
    .append("g");
  
  // Create links before nodes so they appear under the nodes
  const link = svg.append("g")
    .selectAll("line")
    .data(links)
    .enter()
    .append("line")
    .attr("class", d => `graph-link ${d.strength}`)
    .attr("stroke", "#dee2e6")
    .attr("stroke-width", d => d.strength === "strong" ? 2 : 1)
    .attr("opacity", d => d.strength === "strong" ? 0.8 : 0.4);
  
  // Create nodes
  const node = svg.append("g")
    .selectAll("circle")
    .data(nodes)
    .enter()
    .append("circle")
    .attr("class", d => `graph-node ${d.type}`)
    .attr("r", d => d.radius || getNodeRadius(d))
    .attr("fill", d => getNodeColor(d.type))
    .attr("stroke", "#ffffff")
    .attr("stroke-width", 2)
    .on("click", (event, d) => onNodeClick(d))
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended) as any
    );
  
  // Add labels to nodes
  const label = svg.append("g")
    .selectAll("text")
    .data(nodes)
    .enter()
    .append("text")
    .attr("text-anchor", "middle")
    .attr("dy", d => getNodeRadius(d) + 15)
    .attr("font-size", "10px")
    .attr("fill", "#343a40")
    .text(d => truncateLabel(d.label));
  
  // Create force simulation
  const simulation = d3.forceSimulation(nodes as any)
    .force("link", d3.forceLink(links as any).id((d: any) => d.id).distance(100))
    .force("charge", d3.forceManyBody().strength(-300))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide().radius(d => getNodeRadius(d as GraphNode) + 10));
  
  // Update positions on each tick
  simulation.on("tick", () => {
    link
      .attr("x1", d => (d.source as any).x)
      .attr("y1", d => (d.source as any).y)
      .attr("x2", d => (d.target as any).x)
      .attr("y2", d => (d.target as any).y);
    
    node
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);
    
    label
      .attr("x", d => d.x)
      .attr("y", d => d.y);
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
  
  // Helper functions
  function getNodeRadius(node: GraphNode): number {
    switch (node.type) {
      case "concept":
        return 18;
      case "document":
        return 15;
      case "ai-generated":
        return 12;
      default:
        return 15;
    }
  }
  
  function getNodeColor(type: string): string {
    switch (type) {
      case "concept":
        return "#4361ee";
      case "document":
        return "#7209b7";
      case "ai-generated":
        return "#4cc9f0";
      default:
        return "#4361ee";
    }
  }
  
  function truncateLabel(label: string): string {
    return label.length > 15 ? label.substring(0, 13) + "..." : label;
  }
  
  return simulation;
}
