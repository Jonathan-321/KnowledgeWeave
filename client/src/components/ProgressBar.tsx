import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  color?: "green" | "blue" | "purple" | "red" | "yellow";
  className?: string;
  size?: number;
}

export default function ProgressBar({ 
  value, 
  color = "blue", 
  className,
  size
}: ProgressBarProps) {
  // Ensure value is between 0 and 100
  const normalizedValue = Math.min(Math.max(value, 0), 100);
  
  // Map colors to Tailwind classes
  const colorMap = {
    green: "bg-green-500 dark:bg-green-600",
    blue: "bg-blue-500 dark:bg-blue-600",
    purple: "bg-purple-500 dark:bg-purple-600",
    red: "bg-red-500 dark:bg-red-600",
    yellow: "bg-yellow-500 dark:bg-yellow-600"
  };
  
  return (
    <div 
      className={cn(
        "w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden",
        className
      )}
    >
      <div 
        className={cn(colorMap[color], "h-full rounded-full transition-all duration-300")}
        style={{ width: `${normalizedValue}%` }}
      />
    </div>
  );
}