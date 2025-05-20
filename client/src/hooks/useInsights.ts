import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useInsights() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const insightsQuery = useQuery({
    queryKey: ["/api/insights"],
  });

  const generateInsights = useMutation({
    mutationFn: async (conceptIds: number[]) => {
      const response = await apiRequest("POST", "/api/insights/generate", {
        conceptIds,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/insights"] });
      toast({
        title: "Insights generated",
        description: "AI has generated new insights for your concepts",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to generate insights",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const markInsightHelpful = useMutation({
    mutationFn: async (insightId: number) => {
      const response = await apiRequest("PATCH", `/api/insights/${insightId}/helpful`, {
        isHelpful: true,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/insights"] });
    },
  });

  const addInsightToGraph = useMutation({
    mutationFn: async (insightId: number) => {
      const response = await apiRequest("PATCH", `/api/insights/${insightId}/add-to-graph`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/insights"] });
      queryClient.invalidateQueries({ queryKey: ["/api/graph"] });
      toast({
        title: "Added to knowledge graph",
        description: "The insight has been incorporated into your knowledge graph",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add to graph",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    insights: insightsQuery.data || [],
    isLoading: insightsQuery.isLoading,
    isError: insightsQuery.isError,
    error: insightsQuery.error,
    generateInsights,
    markInsightHelpful,
    addInsightToGraph,
  };
}
