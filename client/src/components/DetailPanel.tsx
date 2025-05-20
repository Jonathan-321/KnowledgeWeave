import { useQuery } from "@tanstack/react-query";
import { Concept } from "@shared/schema";
import { Brain, X, Edit, Share, FileText, FileEdit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import ProgressBar from "@/components/ProgressBar";

interface DetailPanelProps {
  concept: Concept | null;
  closeDetailPanel: () => void;
}

export default function DetailPanel({ concept, closeDetailPanel }: DetailPanelProps) {
  const { data: learningProgress } = useQuery({
    queryKey: ["/api/learning", concept?.id],
    enabled: !!concept,
  });

  const { data: graph } = useQuery({
    queryKey: ["/api/graph"],
  });

  const { data: documents } = useQuery({
    queryKey: ["/api/documents"],
  });

  // Find connected concepts
  const getConnectedConcepts = () => {
    if (!graph || !concept) return [];
    
    const links = graph.links.filter(
      (link: any) => link.source === concept.id || link.target === concept.id
    );
    
    return links.map((link: any) => {
      const connectedId = link.source === concept.id ? link.target : link.source;
      const connectedNode = graph.nodes.find((node: any) => node.id === connectedId);
      return {
        id: connectedId,
        name: connectedNode?.label || "Unknown",
        strength: link.strength,
      };
    });
  };

  // Find related documents
  const getRelatedDocuments = () => {
    if (!graph || !concept || !documents) return [];
    
    // Find document nodes connected to this concept
    const documentLinks = graph.links.filter(
      (link: any) => 
        (link.source === concept.id && link.target > 10000) || 
        (link.target === concept.id && link.source > 10000)
    );
    
    return documentLinks.map((link: any) => {
      const docId = link.source === concept.id ? link.target - 10000 : link.source - 10000;
      const document = documents.find((doc: any) => doc.id === docId);
      return document;
    });
  };

  if (!concept) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
        <p>Select a concept to view details</p>
      </div>
    );
  }

  const connectedConcepts = getConnectedConcepts();
  const relatedDocuments = getRelatedDocuments();
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Concept Details</h2>
        <button
          onClick={closeDetailPanel}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X size={20} />
        </button>
      </div>
      
      <div className="mb-6">
        <h3 className="text-xl font-medium text-primary mb-2">{concept.name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
          {concept.description}
        </p>
        
        <div className="flex items-center space-x-2 mb-4">
          {concept.tags && concept.tags.map((tag, index) => (
            <Badge key={index} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
        
        <Separator className="my-4" />
        
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Connected Concepts</h4>
        <ul className="space-y-2">
          {connectedConcepts.length > 0 ? (
            connectedConcepts.map((conn) => (
              <li key={conn.id} className="flex items-center justify-between">
                <a href="#" className="text-sm text-primary hover:underline">
                  {conn.name}
                </a>
                <span className="text-xs text-gray-500 capitalize">{conn.strength} Connection</span>
              </li>
            ))
          ) : (
            <li className="text-sm text-gray-500">No connected concepts yet</li>
          )}
        </ul>
      </div>
      
      <Separator className="my-4" />
      
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Source Documents</h4>
        <ul className="space-y-3">
          {relatedDocuments.length > 0 ? (
            relatedDocuments.map((doc: any) => (
              <li key={doc.id} className="flex items-start">
                {doc.type === "pdf" ? (
                  <FileText className="text-gray-400 mr-2 text-sm" size={18} />
                ) : (
                  <FileEdit className="text-gray-400 mr-2 text-sm" size={18} />
                )}
                <div>
                  <a href="#" className="text-sm font-medium text-primary hover:underline">
                    {doc.title}
                  </a>
                  <p className="text-xs text-gray-500">
                    {doc.pageCount ? `Pages ${doc.pageCount}` : ""}
                  </p>
                </div>
              </li>
            ))
          ) : (
            <li className="text-sm text-gray-500">No source documents found</li>
          )}
        </ul>
      </div>
      
      <Separator className="my-4" />
      
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Learning Progress</h4>
        {learningProgress ? (
          <>
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600 dark:text-gray-300">Comprehension</span>
                <span className="text-xs font-medium text-green-600">
                  {learningProgress.comprehension}%
                </span>
              </div>
              <ProgressBar value={learningProgress.comprehension} color="green" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600 dark:text-gray-300">Practice</span>
                <span className="text-xs font-medium text-blue-600">
                  {learningProgress.practice}%
                </span>
              </div>
              <ProgressBar value={learningProgress.practice} color="blue" />
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-500">No learning progress yet</p>
        )}
      </div>
      
      <Separator className="my-4" />
      
      <div>
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Actions</h4>
        <div className="space-y-3">
          <Button className="w-full">
            <Brain className="mr-2" size={16} />
            <span>Start Learning Session</span>
          </Button>
          <Button variant="outline" className="w-full">
            <Edit className="mr-2" size={16} />
            <span>Add Notes</span>
          </Button>
          <Button variant="outline" className="w-full">
            <Share className="mr-2" size={16} />
            <span>Export Concept</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
