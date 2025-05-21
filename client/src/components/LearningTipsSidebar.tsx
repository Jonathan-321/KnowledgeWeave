import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  LightbulbIcon, 
  BookOpenIcon, 
  BrainIcon, 
  ChevronRightIcon, 
  XIcon 
} from "lucide-react";
import { Concept } from "@shared/schema";

interface LearningTipsSidebarProps {
  conceptId?: number | null;
  onClose: () => void;
}

export default function LearningTipsSidebar({ conceptId, onClose }: LearningTipsSidebarProps) {
  const [tips, setTips] = useState<string[]>([]);
  
  // Fetch concept details if a concept ID is provided
  const { data: concept } = useQuery<Concept>({
    queryKey: ["/api/concepts", conceptId],
    enabled: !!conceptId,
  });
  
  // Fetch learning progress for the concept
  const { data: progress } = useQuery({
    queryKey: ["/api/learning", conceptId],
    enabled: !!conceptId,
  });
  
  // Generate relevant learning tips based on the concept and progress
  useEffect(() => {
    if (concept) {
      const newTips = [
        `Focus on understanding the core principles of ${concept.name} before diving into details.`,
        `Try relating ${concept.name} to concepts you already know well.`,
        `Create practice examples to solidify your understanding of ${concept.name}.`,
        `Explaining ${concept.name} to someone else is a great way to identify gaps in your understanding.`
      ];
      
      // Add progress-specific tips
      if (progress) {
        if (progress.comprehension < 50) {
          newTips.push(`You're still building foundational knowledge of ${concept.name}. Focus on basic principles first.`);
        } else if (progress.comprehension >= 80) {
          newTips.push(`You have a strong understanding of ${concept.name}. Try applying it to complex problems.`);
        }
        
        if (progress.practice < 30) {
          newTips.push(`Increase your practice with ${concept.name} through practical exercises.`);
        }
      }
      
      setTips(newTips);
    } else {
      // General tips when no specific concept is selected
      setTips([
        "Connect related concepts to build a comprehensive understanding.",
        "Review concepts that are prerequisites for more advanced topics.",
        "Dedicate focused study time to concepts with lower comprehension scores.",
        "Use the spaced repetition features to optimize your learning schedule."
      ]);
    }
  }, [concept, progress]);
  
  // Generate a tip for the optimal time to review based on spaced repetition
  const getReviewTimeTip = () => {
    if (!progress || !progress.nextReviewDate) return null;
    
    const nextReview = new Date(progress.nextReviewDate);
    const now = new Date();
    const daysDifference = Math.round((nextReview.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDifference < 0) {
      return "This concept is due for review. Study it today for optimal learning.";
    } else if (daysDifference === 0) {
      return "This concept is scheduled for review today based on spaced repetition.";
    } else if (daysDifference === 1) {
      return "This concept is scheduled for review tomorrow. Wait until then for optimal retention.";
    } else {
      return `This concept is scheduled for review in ${daysDifference} days. Waiting until then will improve long-term retention.`;
    }
  };
  
  const reviewTip = getReviewTimeTip();
  
  return (
    <div className="h-full flex flex-col border-l border-gray-200 dark:border-gray-800 w-80 p-4 overflow-auto bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium flex items-center">
          <LightbulbIcon size={18} className="text-yellow-500 mr-2" />
          <span>Learning Tips</span>
        </h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <XIcon size={16} />
        </Button>
      </div>
      
      {concept && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
          <h3 className="font-medium text-blue-700 dark:text-blue-400 mb-1">
            Currently Exploring:
          </h3>
          <p className="text-blue-600 dark:text-blue-300">{concept.name}</p>
        </div>
      )}
      
      {reviewTip && (
        <Card className="mb-4 border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-900/20">
          <CardContent className="p-3">
            <div className="flex">
              <BrainIcon size={18} className="text-yellow-600 dark:text-yellow-400 mt-1 mr-2 flex-shrink-0" />
              <p className="text-sm text-yellow-700 dark:text-yellow-300">{reviewTip}</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="space-y-3 mb-6">
        {tips.map((tip, index) => (
          <Card key={index} className="border-gray-200 dark:border-gray-700">
            <CardContent className="p-3">
              <div className="flex">
                <LightbulbIcon size={18} className="text-amber-500 mt-1 mr-2 flex-shrink-0" />
                <p className="text-sm">{tip}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card className="mt-auto">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-medium flex items-center">
            <BookOpenIcon size={16} className="mr-2" />
            Learning Resources
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <ul className="space-y-2 text-sm">
            <li>
              <a 
                href="#" 
                className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
              >
                <span>Using spaced repetition effectively</span>
                <ChevronRightIcon size={14} className="ml-1" />
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
              >
                <span>Knowledge graph learning techniques</span>
                <ChevronRightIcon size={14} className="ml-1" />
              </a>
            </li>
            {concept && (
              <li>
                <a 
                  href="#" 
                  className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <span>Related resources for {concept.name}</span>
                  <ChevronRightIcon size={14} className="ml-1" />
                </a>
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}