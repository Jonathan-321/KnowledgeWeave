import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Check, AlertCircle, ArrowRight, RotateCcw, Brain } from 'lucide-react';

interface QuizQuestion {
  question: string;
  options?: string[];
  correctAnswer: number | string;
  explanation: string;
  difficulty: "basic" | "medium" | "advanced";
  conceptArea?: string;
  type?: "multiple_choice" | "true_false" | "short_answer";
}

interface LearningProgress {
  id: number;
  conceptId: number;
  comprehension: number;
  practice: number;
  lastReviewed: Date;
  nextReviewDate: Date;
  interval: number;
  easeFactor: number;
  reviewCount: number;
  totalStudyTime: number;
}

interface QuizProps {
  conceptId: number;
}

export function AdaptiveQuiz({ conceptId }: QuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [timer, setTimer] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [userRating, setUserRating] = useState<number>(3); // Default to medium rating
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);

  // Fetch concept information
  const { data: concept } = useQuery({
    queryKey: ['/api/concepts', conceptId],
  });

  // Fetch adaptive quiz questions
  const { 
    data: quizData, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['/api/quiz', conceptId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/quiz/${conceptId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch quiz data');
        }
        return response.json();
      } catch (err) {
        console.error('Quiz fetch error:', err);
        throw err;
      }
    },
    retry: 1,
    enabled: !!conceptId
  });

  // Update learning progress mutation
  const updateProgress = useMutation({
    mutationFn: async (data: { quality: number, duration: number }) => {
      const response = await fetch(`/api/learning/progress/${conceptId}`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to update learning progress');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/learning'] });
    },
  });

  // Start timer when questions load
  useEffect(() => {
    if (quizData && !startTime) {
      setStartTime(new Date());
      const intervalId = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
      
      return () => clearInterval(intervalId);
    }
  }, [quizData, startTime]);

  // Format study time for display
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Get current question
  const currentQuestion = quizData?.questions?.[currentQuestionIndex];
  const progress = quizData?.progress;

  // Handle option selection
  const handleOptionSelect = (index: number) => {
    if (!isAnswerSubmitted) {
      setSelectedOption(index);
    }
  };

  // Submit answer
  const handleSubmitAnswer = () => {
    if (selectedOption !== null) {
      setIsAnswerSubmitted(true);
      if (selectedOption === currentQuestion?.correctAnswer) {
        setCorrectAnswersCount(prev => prev + 1);
      }
    }
  };

  // Move to next question
  const handleNextQuestion = () => {
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    
    if (currentQuestionIndex < (quizData?.questions?.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Quiz completed
      setQuizCompleted(true);
    }
  };

  // Submit learning progress
  const handleSubmitProgress = () => {
    if (startTime) {
      const duration = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
      
      // Calculate quality based on correct answers and self-rating
      const correctRatio = quizData?.questions?.length 
        ? correctAnswersCount / quizData.questions.length 
        : 0;
      
      // Combine correct ratio (70%) with user self-rating (30%)
      const calculatedQuality = Math.round((correctRatio * 5 * 0.7) + (userRating * 0.3));
      
      // Ensure quality is between 1-5
      const quality = Math.max(1, Math.min(5, calculatedQuality));
      
      updateProgress.mutate({ quality, duration });
      
      // Reset quiz state
      setCurrentQuestionIndex(0);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setQuizCompleted(false);
      setStartTime(null);
      setTimer(0);
      setCorrectAnswersCount(0);
      
      // Refetch questions to get newer adaptive questions
      setTimeout(() => {
        refetch();
      }, 1000);
    }
  };

  // Handle restart quiz
  const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setQuizCompleted(false);
    setStartTime(new Date());
    setTimer(0);
    setCorrectAnswersCount(0);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading adaptive quiz...</div>;
  }

  if (isError) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading quiz</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : 'Something went wrong'}
        </AlertDescription>
      </Alert>
    );
  }

  if (quizCompleted) {
    const score = quizData?.questions?.length 
      ? Math.round((correctAnswersCount / quizData.questions.length) * 100) 
      : 0;
      
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Quiz Completed!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-2xl font-bold">
            Score: {score}%
          </div>
          
          <div className="space-y-4 mt-6">
            <p className="text-center">
              You got {correctAnswersCount} out of {quizData?.questions?.length} questions correct.
            </p>
            
            <div className="flex justify-center">
              <Progress value={score} className="w-3/4 h-4" />
            </div>
            
            <div className="mt-6">
              <p className="text-center mb-2">How would you rate your understanding of this concept now?</p>
              <div className="flex justify-center space-x-4">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <Button
                    key={rating}
                    variant={userRating === rating ? "default" : "outline"}
                    className="w-10 h-10 rounded-full"
                    onClick={() => setUserRating(rating)}
                  >
                    {rating}
                  </Button>
                ))}
              </div>
              <div className="flex justify-between text-sm mt-1 px-4">
                <span>Difficult</span>
                <span>Easy</span>
              </div>
            </div>
            
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Study time: {formatTime(timer)}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center space-x-4">
          <Button variant="outline" onClick={handleRestartQuiz}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button onClick={handleSubmitProgress}>
            <Brain className="mr-2 h-4 w-4" />
            Update Learning Progress
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (!quizData?.questions || quizData.questions.length === 0) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No questions available</AlertTitle>
        <AlertDescription>
          Could not generate quiz questions for this concept.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{concept?.name} Quiz</CardTitle>
          <div className="text-sm">
            Question {currentQuestionIndex + 1} of {quizData.questions.length}
          </div>
        </div>
        <div className="flex justify-between items-center text-sm">
          <div>Difficulty: <span className="font-medium">{currentQuestion?.difficulty || 'Medium'}</span></div>
          <div>Time: {formatTime(timer)}</div>
        </div>
        <Progress 
          value={((currentQuestionIndex + 1) / quizData.questions.length) * 100} 
          className="h-2"
        />
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="text-lg font-medium">{currentQuestion?.question}</div>
        
        {currentQuestion?.options && (
          <RadioGroup
            value={selectedOption !== null ? selectedOption.toString() : undefined}
            onValueChange={(value) => handleOptionSelect(parseInt(value))}
            className="space-y-3"
          >
            {currentQuestion.options.map((option: string, index: number) => (
              <div 
                key={index} 
                className={`flex items-center space-x-2 p-3 rounded-md cursor-pointer ${
                  isAnswerSubmitted 
                    ? index === currentQuestion.correctAnswer
                      ? 'bg-green-50 border border-green-200' 
                      : selectedOption === index
                        ? 'bg-red-50 border border-red-200'
                        : 'border'
                    : selectedOption === index
                      ? 'bg-primary-50 border border-primary-200'
                      : 'border'
                }`}
              >
                <RadioGroupItem 
                  value={index.toString()}
                  id={`option-${index}`}
                  disabled={isAnswerSubmitted}
                />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
                {isAnswerSubmitted && index === currentQuestion.correctAnswer && (
                  <Check className="h-5 w-5 text-green-600" />
                )}
              </div>
            ))}
          </RadioGroup>
        )}
        
        {isAnswerSubmitted && (
          <div className="mt-4 p-4 bg-slate-50 rounded-md">
            <div className="font-medium mb-1">
              {selectedOption === currentQuestion?.correctAnswer 
                ? 'Correct!' 
                : 'Incorrect'
              }
            </div>
            <div className="text-sm">
              {currentQuestion?.explanation}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-end space-x-4">
        {!isAnswerSubmitted ? (
          <Button 
            onClick={handleSubmitAnswer}
            disabled={selectedOption === null}
          >
            Submit Answer
          </Button>
        ) : (
          <Button onClick={handleNextQuestion}>
            {currentQuestionIndex < (quizData.questions.length - 1) 
              ? 'Next Question' 
              : 'Complete Quiz'
            }
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}