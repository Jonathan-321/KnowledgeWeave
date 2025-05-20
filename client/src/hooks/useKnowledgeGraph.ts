import { useQuery } from "@tanstack/react-query";
import { KnowledgeGraph } from "@shared/schema";

export function useKnowledgeGraph() {
  const graphQuery = useQuery<KnowledgeGraph>({
    queryKey: ["/api/graph"],
  });

  const getNodeById = (id: number) => {
    if (!graphQuery.data?.nodes) return null;
    return graphQuery.data.nodes.find((node) => node.id === id);
  };

  const getConnectedNodes = (nodeId: number) => {
    if (!graphQuery.data?.links || !graphQuery.data?.nodes) return [];
    
    const connectedLinks = graphQuery.data.links.filter(
      (link) => link.source === nodeId || link.target === nodeId
    );
    
    const connectedNodeIds = connectedLinks.map((link) =>
      link.source === nodeId ? link.target : link.source
    );
    
    return graphQuery.data.nodes.filter((node) =>
      connectedNodeIds.includes(node.id)
    );
  };

  const getNodesByType = (type: 'concept' | 'document' | 'ai-generated') => {
    if (!graphQuery.data?.nodes) return [];
    return graphQuery.data.nodes.filter((node) => node.type === type);
  };

  return {
    graph: graphQuery.data,
    isLoading: graphQuery.isLoading,
    isError: graphQuery.isError,
    error: graphQuery.error,
    getNodeById,
    getConnectedNodes,
    getNodesByType,
  };
}
