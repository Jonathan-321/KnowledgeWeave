interface ProgressBarProps {
  value: number;
  max?: number;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
}

export default function ProgressBar({ value, max = 100, color = 'blue' }: ProgressBarProps) {
  // Ensure value is between 0 and max
  const normalizedValue = Math.min(Math.max(0, value), max);
  const percentage = (normalizedValue / max) * 100;
  
  // Map color names to tailwind classes
  const colorMap = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
  };
  
  return (
    <div className="w-full bg-neutral-200 dark:bg-gray-700 rounded-full h-1.5">
      <div 
        className={`${colorMap[color]} h-1.5 rounded-full`} 
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
