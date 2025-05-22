import * as d3 from "d3";
import { GraphNode, GraphLink } from "@shared/schema";

interface SimulationNode extends d3.SimulationNodeDatum {
  id: number;
  label: string;
  type: string;
  radius?: number;
  color?: string;
  x?: number;
  y?: number;
}

interface SimulationLink extends d3.SimulationLinkDatum<SimulationNode> {
  source: number | SimulationNode;
  target: number | SimulationNode;
  strength: string;
  color?: string;
  width?: number;
}

export function createForceSimulation(
  svgElement: SVGSVGElement,
  nodes: GraphNode[],
  links: GraphLink[],
  width: number,
  height: number,
  onNodeClick: (node: GraphNode) => void,
  directNavigate: boolean = false
) {
  // Process nodes and links to add visual properties
  const processedNodes: SimulationNode[] = nodes.map(node => {
    let radius: number = 15;
    let color: string = "#3b82f6"; // Default blue

    if (node.type === "concept") {
      radius = 20;
      color = "#3b82f6"; // Blue for concepts
    } else if (node.type === "document") {
      radius = 15;
      color = "#8b5cf6"; // Purple for documents
    } else if (node.type === "ai-generated") {
      radius = 15;
      color = "#60a5fa"; // Light blue for AI-generated
    }

    return {
      ...node,
      radius,
      color
    };
  });

  const processedLinks: SimulationLink[] = links.map(link => {
    let color: string = "#9ca3af"; // Default gray
    let width: number = 1;

    if (link.strength === "strong") {
      color = "#3b82f6"; // Blue
      width = 3;
    } else if (link.strength === "moderate") {
      color = "#60a5fa"; // Light blue
      width = 2;
    } else {
      color = "#9ca3af"; // Gray
      width = 1;
    }

    return {
      ...link,
      color,
      width
    };
  });

  // Create SVG elements
  const svg = d3.select(svgElement);
  const g = svg.append("g");

  // Add zoom behavior
  const zoom = d3.zoom()
    .scaleExtent([0.1, 4])
    .on("zoom", (event) => {
      g.attr("transform", event.transform);
    });

  svg.call(zoom as any);

  // Create link elements with animated paths
  const linkElements = g.append("g")
    .selectAll("path")
    .data(processedLinks)
    .enter()
    .append("path")
    .attr("class", "graph-link")
    .attr("stroke", d => d.color as string)
    .attr("stroke-width", d => d.width as number)
    .attr("fill", "none")
    .attr("opacity", 0.6)
    .attr("stroke-dasharray", "5,5")
    .attr("stroke-dashoffset", 0)
    .each(function(d: any) {
      // Add animated flow effect for stronger connections
      if (d.strength === "strong" || d.strength === "moderate") {
        d3.select(this)
          .attr("stroke-dasharray", d.strength === "strong" ? "6,3" : "4,4")
          .transition()
          .duration(20000)
          .ease(d3.easeLinear)
          .attr("stroke-dashoffset", 200)
          .on("end", function repeat() {
            d3.select(this)
              .attr("stroke-dashoffset", 0)
              .transition()
              .duration(20000)
              .ease(d3.easeLinear)
              .attr("stroke-dashoffset", 200)
              .on("end", repeat);
          });
      }
    });

  // Create node elements
  const nodeElements = g.append("g")
    .selectAll("circle")
    .data(processedNodes)
    .enter()
    .append("circle")
    .attr("class", "graph-node")
    .attr("r", d => d.radius as number)
    .attr("fill", d => d.color as string)
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
    .style("cursor", "pointer")
    .on("click", (event, d) => {
      event.stopPropagation();
      onNodeClick(d);
    })
    .on("mouseover", function() {
      d3.select(this)
        .attr("stroke", "#000")
        .attr("stroke-width", 2);
    })
    .on("mouseout", function() {
      d3.select(this)
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5);
    })
    .call(d3.drag<any, SimulationNode>()
      .on("start", dragStarted)
      .on("drag", dragging)
      .on("end", dragEnded) as any
    );

  // Add labels
  const textElements = g.append("g")
    .selectAll("text")
    .data(processedNodes)
    .enter()
    .append("text")
    .text(d => d.label)
    .attr("font-size", 12)
    .attr("text-anchor", "middle")
    .attr("dy", 25)
    .style("pointer-events", "none")
    .attr("fill", "#374151");

  // Create the simulation
  const simulation = d3.forceSimulation<SimulationNode>(processedNodes)
    .force("link", d3.forceLink<SimulationNode, SimulationLink>(processedLinks)
      .id(d => d.id)
      .distance(100)
      .strength(d => d.strength === "strong" ? 0.7 : d.strength === "moderate" ? 0.5 : 0.3)
    )
    .force("charge", d3.forceManyBody().strength(-300))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide().radius(d => (d.radius as number) + 10))
    .on("tick", () => {
      // Update positions on each tick
      // For animated paths, we'll use a curve to make them look more natural
      linkElements.attr("d", (d: any) => {
        const sourceX = (d.source as SimulationNode).x || 0;
        const sourceY = (d.source as SimulationNode).y || 0;
        const targetX = (d.target as SimulationNode).x || 0;
        const targetY = (d.target as SimulationNode).y || 0;
        
        // Calculate a midpoint with a slight curve
        const dx = targetX - sourceX;
        const dy = targetY - sourceY;
        const dr = Math.sqrt(dx * dx + dy * dy) * 1.2;
        
        // Stronger connections have straighter lines
        const curvature = d.strength === "strong" ? 0 : (d.strength === "moderate" ? 1 : 1.5);
        
        return `M${sourceX},${sourceY}A${dr * curvature},${dr * curvature} 0 0,1 ${targetX},${targetY}`;
      });

      nodeElements
        .attr("cx", d => d.x || 0)
        .attr("cy", d => d.y || 0);

      textElements
        .attr("x", d => d.x || 0)
        .attr("y", d => d.y || 0);
    });

  // Add tooltips
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "white")
    .style("border", "1px solid #ddd")
    .style("border-radius", "4px")
    .style("padding", "8px")
    .style("box-shadow", "0 2px 5px rgba(0,0,0,0.1)")
    .style("pointer-events", "none")
    .style("opacity", 0)
    .style("transition", "opacity 0.15s ease-in-out");

  nodeElements
    .on("mouseover.tooltip", (event, d) => {
      tooltip
        .style("opacity", 1)
        .html(`
          <div>
            <strong>${d.label}</strong>
            <div style="font-size: 12px; color: #666;">${capitalizeFirstLetter(d.type)}</div>
          </div>
        `);
    })
    .on("mousemove.tooltip", (event) => {
      tooltip
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 20) + "px");
    })
    .on("mouseout.tooltip", () => {
      tooltip.style("opacity", 0);
    });

  // Handle node dragging
  function dragStarted(event: any, d: SimulationNode) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragging(event: any, d: SimulationNode) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragEnded(event: any, d: SimulationNode) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  // Utility functions
  function capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  // Return the simulation so it can be controlled from outside
  return simulation;
}