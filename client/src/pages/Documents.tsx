import { useState } from "react";
import { useDocuments } from "@/hooks/useDocuments";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Upload, Filter, Grid3X3, List } from "lucide-react";
import DocumentCard from "@/components/DocumentCard";
import SimpleUpload from "@/components/SimpleUpload";

export default function Documents() {
  const { documents, isLoading } = useDocuments();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Filter and search documents
  const filteredDocuments = documents.filter((doc: any) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "all" || doc.type === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex-1 p-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Document Library</CardTitle>
              <CardDescription>
                Manage and organize your learning materials
              </CardDescription>
            </div>
            <Button onClick={() => {
              // Find the file drop zone or create one
              const dropZone = document.querySelector('.file-drop-area');
              if (dropZone) {
                dropZone.scrollIntoView({ behavior: 'smooth' });
              } else {
                setSearchTerm(""); // Clear search to show empty results and file dropzone
              }
            }}>
              <Upload className="mr-2" size={16} />
              <span>Upload Document</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Search documents..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="pdf">PDF Documents</SelectItem>
                    <SelectItem value="article">Articles</SelectItem>
                    <SelectItem value="note">Notes</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon">
                  <Filter size={18} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className={viewMode === "grid" ? "bg-neutral-100 dark:bg-gray-800" : ""}
                >
                  <Grid3X3 size={18} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className={viewMode === "list" ? "bg-neutral-100 dark:bg-gray-800" : ""}
                >
                  <List size={18} />
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="border border-dashed border-neutral-200 dark:border-gray-700 rounded-lg p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400 mb-4">No documents found</p>
                <div className="mb-6">
                  <SimpleUpload />
                  <p className="text-sm text-gray-500 mt-4">
                    After uploading, your document will be processed and concepts will be automatically extracted to build your knowledge graph.
                  </p>
                </div>
              </div>
            ) : (
              <div className={
                viewMode === "grid" 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
                  : "flex flex-col gap-3"
              }>
                {filteredDocuments.map((document: any) => (
                  <DocumentCard key={document.id} document={document} />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
