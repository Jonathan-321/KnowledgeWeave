import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Folder, School, FileText, FileEdit, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import FileDropZone from "@/components/FileDropZone";

interface SidebarProps {
  closeSidebar: () => void;
}

export default function Sidebar({ closeSidebar }: SidebarProps) {
  const { data: documents = [] } = useQuery({
    queryKey: ["/api/documents"],
  });

  const { data: concepts = [] } = useQuery({
    queryKey: ["/api/concepts"],
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
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Document Library</h3>
        <button
          onClick={closeSidebar}
          className="p-1 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X size={20} />
        </button>
      </div>
      
      <div className="px-4 py-5 space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Document Library</h3>
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
            {concepts.slice(0, 6).map((concept: any) => (
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
