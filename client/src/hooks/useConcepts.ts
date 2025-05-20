import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Concept } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useConcepts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const conceptsQuery = useQuery<Concept[]>({
    queryKey: ["/api/concepts"],
  });

  const createConcept = useMutation({
    mutationFn: async (conceptData: Partial<Concept>) => {
      const response = await apiRequest("POST", "/api/concepts", conceptData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/concepts"] });
      toast({
        title: "Concept created",
        description: "New concept has been added to your knowledge graph",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create concept",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateConcept = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Concept> }) => {
      const response = await apiRequest("PATCH", `/api/concepts/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/concepts"] });
      toast({
        title: "Concept updated",
        description: "Your changes have been saved",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update concept",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteConcept = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/concepts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/concepts"] });
      toast({
        title: "Concept deleted",
        description: "The concept has been removed from your knowledge graph",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete concept",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    concepts: conceptsQuery.data || [],
    isLoading: conceptsQuery.isLoading,
    isError: conceptsQuery.isError,
    error: conceptsQuery.error,
    createConcept,
    updateConcept,
    deleteConcept,
  };
}
