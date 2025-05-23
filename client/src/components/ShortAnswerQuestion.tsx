import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, X } from 'lucide-react';

interface ShortAnswerQuestionProps {
  question: {
    question: string;
    correctAnswer: string;
    explanation: string;
  };
  onAnswerSubmit: (isCorrect: boolean) => void;
}

const ShortAnswerQuestion: React.FC<ShortAnswerQuestionProps> = ({
  question,
  onAnswerSubmit
}) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  
  // Check if the answer is correct using fuzzy matching
  const checkAnswer = () => {
    if (!userAnswer.trim()) return false;
    
    // Get correct answer and normalize
    const correctAnswer = question.correctAnswer.toString().toLowerCase().trim();
    const normalizedUserAnswer = userAnswer.toLowerCase().trim();
    
    // Simple exact match
    if (normalizedUserAnswer === correctAnswer) {
      return true;
    }
    
    // Check if it's close enough (contains key parts)
    const correctKeywords = correctAnswer.split(/\s+/);
    const answerKeywords = normalizedUserAnswer.split(/\s+/);
    
    // If correct answer has multiple words, check for partial matches
    if (correctKeywords.length > 1) {
      // Count matching keywords
      const matchingKeywords = correctKeywords.filter(word => 
        answerKeywords.some(answerWord => answerWord.includes(word) || word.includes(answerWord))
      );
      
      // If more than 70% of keywords match, consider it correct
      if (matchingKeywords.length >= Math.ceil(correctKeywords.length * 0.7)) {
        return true;
      }
    }
    
    return false;
  };
  
  // Handle answer submission
  const handleSubmit = () => {
    const result = checkAnswer();
    setIsCorrect(result);
    setIsSubmitted(true);
    onAnswerSubmit(result);
  };
  
  return (
    <div className="space-y-4">
      <div className="text-lg font-medium mb-4">{question.question}</div>
      
      <div className="flex space-x-2">
        <Input
          type="text"
          placeholder="Type your answer here..."
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          disabled={isSubmitted}
          className="flex-1"
        />
        {!isSubmitted ? (
          <Button onClick={handleSubmit} disabled={!userAnswer.trim()}>
            Submit
          </Button>
        ) : null}
      </div>
      
      {isSubmitted && (
        <div className={`p-4 rounded-md ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex items-start">
            {isCorrect ? (
              <Check className="text-green-600 h-5 w-5 mr-2 mt-0.5" />
            ) : (
              <X className="text-red-600 h-5 w-5 mr-2 mt-0.5" />
            )}
            
            <div>
              <div className="font-medium mb-1">
                {isCorrect ? 'Correct!' : 'Not quite right'}
              </div>
              
              <div className="text-sm">
                <span className="font-medium">Correct answer:</span> {question.correctAnswer}
              </div>
              
              <div className="text-sm mt-2">
                {question.explanation}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShortAnswerQuestion;
