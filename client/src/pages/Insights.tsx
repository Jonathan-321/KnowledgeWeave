import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Lightbulb,
  RefreshCw,
  Zap,
  BrainCircuit,
  Network,
  Filter,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import InsightCard from "@/components/InsightCard";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Concept } from "@shared/schema";

export default function Insights() {
  const [selectedConcepts, setSelectedConcepts] = useState<number[]>([]);
  const [conceptFilter, setConceptFilter] = useState<string>("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: concepts = [] } = useQuery({
    queryKey: ["/api/concepts"],
  });

  const { data: insights = [] } = useQuery({
    queryKey: ["/api/insights"],
  });

  const { data: graph } = useQuery({
    queryKey: ["/api/graph"],
  });

  const generateInsightsMutation = useMutation({
    mutationFn: async (conceptIds: number[]) => {
      const response = await apiRequest(
        "POST",
        "/api/insights/generate",
        { conceptIds }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/insights"] });
      toast({
        title: "Insights generated",
        description: "New AI-generated insights are now available",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to generate insights",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleConceptSelection = (conceptId: number) => {
    if (selectedConcepts.includes(conceptId)) {
      setSelectedConcepts(selectedConcepts.filter(id => id !== conceptId));
    } else {
      setSelectedConcepts([...selectedConcepts, conceptId]);
    }
  };

  const handleGenerateInsights = () => {
    if (selectedConcepts.length === 0) {
      toast({
        title: "No concepts selected",
        description: "Please select at least one concept to generate insights",
        variant: "destructive",
      });
      return;
    }
    
    generateInsightsMutation.mutate(selectedConcepts);
  };

  const getRelevantInsights = () => {
    if (conceptFilter === "all") return insights;
    
    return insights.filter((insight: any) => 
      insight.relatedConceptIds && 
      insight.relatedConceptIds.includes(parseInt(conceptFilter))
    );
  };

  const relevantInsights = getRelevantInsights();
  
  // Get insights that haven't been added to the graph yet
  const newInsights = insights.filter((insight: any) => !insight.addedToGraph);
  
  // Get insights that have been marked as helpful
  const helpfulInsights = insights.filter((insight: any) => insight.isHelpful);

  return (
    <div className="flex-1 p-6">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle>AI-Generated Insights</CardTitle>
              <CardDescription>
                Discover connections and relationships between your concepts
              </CardDescription>
            </div>
            <Button 
              onClick={handleGenerateInsights} 
              disabled={generateInsightsMutation.isPending}
            >
              <Zap className="mr-2" size={16} />
              <span>{generateInsightsMutation.isPending ? "Generating..." : "Generate Insights"}</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
              <TabsList>
                <TabsTrigger value="all">All Insights</TabsTrigger>
                <TabsTrigger value="new">New ({newInsights.length})</TabsTrigger>
                <TabsTrigger value="helpful">Helpful ({helpfulInsights.length})</TabsTrigger>
              </TabsList>
              
              <Select value={conceptFilter} onValueChange={setConceptFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by concept" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Concepts</SelectItem>
                  {concepts.map((concept: Concept) => (
                    <SelectItem key={concept.id} value={concept.id.toString()}>
                      {concept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <TabsContent value="all">
              {relevantInsights.length > 0 ? (
                <div className="space-y-3">
                  {relevantInsights.map((insight: any) => (
                    <InsightCard key={insight.id} insight={insight} />
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 border border-dashed rounded-lg">
                  <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <h3 className="text-lg font-medium">No Insights Available</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Generate insights to discover connections between your concepts
                  </p>
                  <Button onClick={handleGenerateInsights}>
                    <Zap className="mr-2" size={16} />
                    <span>Generate Insights</span>
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="new">
              {newInsights.length > 0 ? (
                <div className="space-y-3">
                  {newInsights.map((insight: any) => (
                    <InsightCard key={insight.id} insight={insight} />
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 border border-dashed rounded-lg">
                  <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <h3 className="text-lg font-medium">No New Insights</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    All insights have been added to your knowledge graph
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="helpful">
              {helpfulInsights.length > 0 ? (
                <div className="space-y-3">
                  {helpfulInsights.map((insight: any) => (
                    <InsightCard key={insight.id} insight={insight} />
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 border border-dashed rounded-lg">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <h3 className="text-lg font-medium">No Helpful Insights Yet</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Mark insights as helpful to save them for future reference
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Concept Selection</CardTitle>
          <CardDescription>
            Select concepts to generate new insights and discover connections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {concepts.map((concept: Concept) => (
              <Card 
                key={concept.id} 
                className={`cursor-pointer border-2 ${
                  selectedConcepts.includes(concept.id) 
                    ? "border-primary" 
                    : "border-neutral-200 dark:border-gray-700"
                }`}
                onClick={() => toggleConceptSelection(concept.id)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-base font-medium">{concept.name}</h3>
                    {selectedConcepts.includes(concept.id) && (
                      <Badge variant="primary">Selected</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {concept.description}
                  </p>
                  {concept.tags && concept.tags.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {concept.tags.map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => setSelectedConcepts([])}
            disabled={selectedConcepts.length === 0}
          >
            Clear Selection
          </Button>
          <Button 
            onClick={handleGenerateInsights}
            disabled={selectedConcepts.length === 0 || generateInsightsMutation.isPending}
          >
            <BrainCircuit className="mr-2" size={16} />
            <span>Generate Insights</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
