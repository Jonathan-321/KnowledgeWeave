import { ChevronRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BreadcrumbItem {
  id: number;
  label: string;
}

interface BreadcrumbNavigationProps {
  items: BreadcrumbItem[];
  onNavigate: (itemId: number | null) => void;
}

export default function BreadcrumbNavigation({ 
  items, 
  onNavigate 
}: BreadcrumbNavigationProps) {
  return (
    <div className="flex items-center overflow-x-auto pb-2 mb-4 text-sm">
      <Button 
        variant="ghost" 
        size="sm" 
        className="flex items-center h-8 px-2 text-gray-500 hover:text-primary"
        onClick={() => onNavigate(null)}
      >
        <Home size={16} className="mr-1" />
        <span>Home</span>
      </Button>
      
      {items.length > 0 && (
        <ChevronRight size={16} className="mx-1 text-gray-400 flex-shrink-0" />
      )}
      
      {items.map((item, index) => (
        <div key={item.id} className="flex items-center flex-shrink-0">
          <Button
            variant="ghost"
            size="sm" 
            className={`flex items-center h-8 px-2 ${
              index === items.length - 1 
                ? "text-primary font-medium" 
                : "text-gray-500 hover:text-primary"
            }`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="truncate max-w-[150px]">{item.label}</span>
          </Button>
          
          {index < items.length - 1 && (
            <ChevronRight size={16} className="mx-1 text-gray-400 flex-shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}