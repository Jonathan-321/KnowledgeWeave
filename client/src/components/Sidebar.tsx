import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Folder, School, FileText, FileEdit, X, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import FileDropZone from "@/components/FileDropZone";
import NavMenu from "@/components/NavMenu";
import { Separator } from "@/components/ui/separator";

interface Document {
  id: number;
  title: string;
  type: "course" | "article" | "note";
  createdAt: string;
  updatedAt: string;
  url?: string;
  content?: string;
}

interface Concept {
  id: number;
  name: string;
  description?: string;
  category?: string;
}

interface SidebarProps {
  closeSidebar: () => void;
}

export default function Sidebar({ closeSidebar }: SidebarProps) {
  const { data: documents = [] } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
    queryFn: async () => {
      // Mock data for demonstration
      return [
        { id: 1, title: "Machine Learning Fundamentals", type: "course", createdAt: "2025-05-01", updatedAt: "2025-05-01" },
        { id: 2, title: "Introduction to Neural Networks", type: "article", createdAt: "2025-05-05", updatedAt: "2025-05-05" },
        { id: 3, title: "Quantum Computing Notes", type: "note", createdAt: "2025-05-10", updatedAt: "2025-05-12" },
        { id: 4, title: "Data Structures and Algorithms", type: "course", createdAt: "2025-04-28", updatedAt: "2025-05-15" }
      ];
    }
  });

  const { data: concepts = [] } = useQuery<Concept[]>({
    queryKey: ["/api/concepts"],
    queryFn: async () => {
      // Mock data for demonstration
      return [
        { id: 101, name: "Quantum Computing", description: "Study of quantum systems for computation" },
        { id: 102, name: "Neural Networks", description: "Computational models inspired by the brain" },
        { id: 103, name: "Data Structures", description: "Methods of organizing data for efficient access" },
        { id: 104, name: "Machine Learning Ethics", description: "Ethical considerations in ML applications" },
        { id: 105, name: "Deep Learning", description: "Neural networks with multiple layers" },
        { id: 106, name: "Artificial Intelligence", description: "Study of intelligent agents" },
        { id: 107, name: "Algorithms", description: "Step-by-step procedures for calculations" }
      ];
    }
  });

  // Calculate document counts by type
  const documentCounts = {
    total: documents.length,
    courses: documents.filter((doc: any) => doc.type === "course").length,
    articles: documents.filter((doc: any) => doc.type === "article").length,
    notes: documents.filter((doc: any) => doc.type === "note").length,
  };

  return (
    <div className="h-full bg-white dark:bg-gray-900 shadow-sm overflow-y-auto">
      <div className="flex items-center justify-between p-4 md:hidden">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">KnowledgeWeave</h3>
        <button
          onClick={closeSidebar}
          className="p-1 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X size={20} />
        </button>
      </div>
      
      <div className="px-4 py-5 space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
            <Layers className="mr-2 h-5 w-5 text-blue-500" /> 
            KnowledgeWeave
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Adaptive Learning System</p>
        </div>
        
        <Separator />
        
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-3">NAVIGATION</h3>
          <NavMenu />
        </div>
        
        <Separator />
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">DOCUMENT LIBRARY</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your learning materials</p>
          
          <div className="mt-4 flex flex-col space-y-2">
            <button className="text-left flex items-center px-3 py-2 text-sm font-medium rounded-md bg-neutral-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
              <Folder className="text-gray-400 mr-3" size={20} />
              <span>All Documents</span>
              <Badge variant="outline" className="ml-auto">
                {documentCounts.total}
              </Badge>
            </button>
            
            <button className="text-left flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 hover:bg-neutral-100 dark:hover:bg-gray-800">
              <School className="text-gray-400 mr-3" size={20} />
              <span>Courses</span>
              <Badge variant="outline" className="ml-auto">
                {documentCounts.courses}
              </Badge>
            </button>
            
            <button className="text-left flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 hover:bg-neutral-100 dark:hover:bg-gray-800">
              <FileText className="text-gray-400 mr-3" size={20} />
              <span>Articles</span>
              <Badge variant="outline" className="ml-auto">
                {documentCounts.articles}
              </Badge>
            </button>
            
            <button className="text-left flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 hover:bg-neutral-100 dark:hover:bg-gray-800">
              <FileEdit className="text-gray-400 mr-3" size={20} />
              <span>Notes</span>
              <Badge variant="outline" className="ml-auto">
                {documentCounts.notes}
              </Badge>
            </button>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Concepts</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {concepts.slice(0, 6).map((concept) => (
              <Badge key={concept.id} variant="secondary" className="text-xs">
                {concept.name}
              </Badge>
            ))}
            {concepts.length > 6 && (
              <Badge variant="outline" className="text-xs hover:bg-neutral-300 dark:hover:bg-gray-700">
                +{concepts.length - 6} more
              </Badge>
            )}
          </div>
        </div>
        
        <FileDropZone />
      </div>
    </div>
  );
}
