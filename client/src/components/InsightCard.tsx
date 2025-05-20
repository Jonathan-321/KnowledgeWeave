import { ThumbsUp, PlusCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface InsightCardProps {
  insight: {
    id: number;
    content: string;
    isHelpful: boolean | null;
    addedToGraph: boolean;
    relatedConceptIds: number[];
  };
}

export default function InsightCard({ insight }: InsightCardProps) {
  const queryClient = useQueryClient();

  const markHelpfulMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/insights/${insight.id}/helpful`, { isHelpful: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/insights"] });
    },
  });

  const addToGraphMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/insights/${insight.id}/add-to-graph`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/insights"] });
      queryClient.invalidateQueries({ queryKey: ["/api/graph"] });
    },
  });

  // Helper function to highlight concept mentions
  const highlightConcepts = (text: string) => {
    // This is a simplified version - in a real app you'd have the actual concept names
    // For now, we'll just highlight anything that looks like a concept (words with first letter capitalized)
    return text.split(/\b/).map((word, index) => {
      if (/^[A-Z][a-z]+/.test(word)) {
        return <span key={index} className="text-primary">{word}</span>;
      }
      return word;
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-3 rounded-md shadow-sm mb-2">
      <p className="text-sm text-gray-900 dark:text-gray-100">
        {highlightConcepts(insight.content)}
      </p>
      <div className="flex items-center mt-2">
        <button 
          className={`mr-2 text-xs ${
            insight.isHelpful 
              ? "text-primary" 
              : "text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary"
          } flex items-center`}
          onClick={() => markHelpfulMutation.mutate()}
          disabled={insight.isHelpful || markHelpfulMutation.isPending}
        >
          <ThumbsUp className="mr-1" size={14} />
          <span>{insight.isHelpful ? "Helpful" : "Mark as Helpful"}</span>
        </button>
        <button 
          className={`text-xs ${
            insight.addedToGraph 
              ? "text-primary" 
              : "text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary"
          } flex items-center`}
          onClick={() => addToGraphMutation.mutate()}
          disabled={insight.addedToGraph || addToGraphMutation.isPending}
        >
          <PlusCircle className="mr-1" size={14} />
          <span>{insight.addedToGraph ? "Added to Graph" : "Add to Graph"}</span>
        </button>
      </div>
    </div>
  );
}
