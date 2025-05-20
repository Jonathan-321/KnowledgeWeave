import { Document } from "@shared/schema";
import { FileText, FileEdit, Eye, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DocumentCardProps {
  document: Document;
}

export default function DocumentCard({ document }: DocumentCardProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Document deleted",
        description: "The document has been removed",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete document",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getDocumentIcon = () => {
    switch (document.type) {
      case "pdf":
        return (
          <div className="rounded-md w-10 h-10 flex items-center justify-center bg-blue-100 dark:bg-blue-900 text-primary">
            <FileText />
          </div>
        );
      case "note":
        return (
          <div className="rounded-md w-10 h-10 flex items-center justify-center bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-400">
            <FileEdit />
          </div>
        );
      default:
        return (
          <div className="rounded-md w-10 h-10 flex items-center justify-center bg-purple-100 dark:bg-purple-900 text-secondary dark:text-purple-400">
            <FileText />
          </div>
        );
    }
  };

  const formatFileSize = (bytes: number | null | undefined) => {
    if (!bytes) return "";
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "";
    return format(new Date(date), "MMM d, yyyy");
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this document?")) {
      deleteMutation.mutate(document.id);
    }
  };

  return (
    <div className="border border-neutral-200 dark:border-gray-700 rounded-lg overflow-hidden flex flex-col">
      <div className="p-4 flex items-start">
        {getDocumentIcon()}
        <div className="flex-1 min-w-0 ml-3">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {document.title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {document.type.toUpperCase()} · {document.pageCount} pages · {formatFileSize(document.fileSize)}
          </p>
          <div className="mt-1 flex items-center">
            <span className={`inline-block w-2 h-2 rounded-full ${document.processed ? "bg-green-500" : "bg-yellow-500"} mr-1`}></span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {document.processed ? "Processed" : "Processing..."}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-auto">
        <div className="px-4 py-3 bg-neutral-50 dark:bg-gray-800 text-xs font-medium text-gray-500 dark:text-gray-400 flex justify-between">
          <span>Added {formatDate(document.uploadDate)}</span>
          <div className="flex space-x-2">
            <button className="text-gray-400 hover:text-primary dark:hover:text-primary">
              <Eye size={16} />
            </button>
            <button className="text-gray-400 hover:text-primary dark:hover:text-primary">
              <Pencil size={16} />
            </button>
            <button 
              className="text-gray-400 hover:text-red-500 dark:hover:text-red-500"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
