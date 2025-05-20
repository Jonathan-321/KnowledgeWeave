import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Brain, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { Concept } from "@shared/schema";
import ProgressBar from "@/components/ProgressBar";

interface ConceptDetailsProps {
  concept: Concept;
  onClose: () => void;
  updateProgress?: (data: { comprehension: number; practice: number }) => void;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export default function ConceptDetails({ concept, onClose, updateProgress }: ConceptDetailsProps) {
  const [quizMode, setQuizMode] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);

  const { data: quizQuestions } = useQuery<QuizQuestion[]>({
    queryKey: ["/api/quiz", concept.id],
    enabled: quizMode,
  });

  const { data: progress } = useQuery({
    queryKey: ["/api/learning", concept.id],
  });

  const { data: documentConcepts } = useQuery({
    queryKey: ["/api/concepts", concept.id, "documents"],
  });

  useEffect(() => {
    if (quizComplete && updateProgress) {
      // Calculate new comprehension based on quiz performance
      const score = Math.round((correctAnswers / (quizQuestions?.length || 1)) * 100);
      
      // Update both comprehension and practice
      // Use existing progress values as base if available
      const currentComprehension = progress?.comprehension || 0;
      const currentPractice = progress?.practice || 0;
      
      // Weight new quiz results with previous progress
      const newComprehension = Math.min(
        Math.round((currentComprehension * 0.7) + (score * 0.3)),
        100
      );
      
      // Increment practice by 5-10% each time
      const practiceIncrement = 10;
      const newPractice = Math.min(currentPractice + practiceIncrement, 100);
      
      updateProgress({
        comprehension: newComprehension,
        practice: newPractice,
      });
    }
  }, [quizComplete, correctAnswers, quizQuestions, progress, updateProgress]);

  const handleAnswerSelect = (answerIndex: number) => {
    if (!hasAnswered) {
      setSelectedAnswer(answerIndex);
    }
  };

  const handleCheckAnswer = () => {
    if (selectedAnswer === null || !quizQuestions) return;
    
    setHasAnswered(true);
    
    if (selectedAnswer === quizQuestions[currentQuestionIndex].correctAnswer) {
      setCorrectAnswers(correctAnswers + 1);
    }
  };

  const handleNextQuestion = () => {
    if (!quizQuestions) return;
    
    setSelectedAnswer(null);
    setHasAnswered(false);
    
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setQuizComplete(true);
    }
  };

  const startQuiz = () => {
    setQuizMode(true);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setHasAnswered(false);
    setCorrectAnswers(0);
    setQuizComplete(false);
  };

  const renderQuizContent = () => {
    if (!quizQuestions || quizQuestions.length === 0) {
      return (
        <div className="text-center p-8">
          <p className="text-gray-500 dark:text-gray-400">Loading questions...</p>
        </div>
      );
    }

    if (quizComplete) {
      const score = Math.round((correctAnswers / quizQuestions.length) * 100);
      return (
        <div className="text-center p-4">
          <div className={`w-24 h-24 rounded-full ${
            score >= 70 ? "bg-green-100 dark:bg-green-900" : "bg-amber-100 dark:bg-amber-900"
          } flex items-center justify-center mx-auto mb-4`}>
            <span className={`text-2xl font-bold ${
              score >= 70 ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"
            }`}>
              {score}%
            </span>
          </div>
          
          <h3 className="text-xl font-bold mb-2">Quiz Complete!</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            You got {correctAnswers} out of {quizQuestions.length} questions correct.
          </p>
          
          {score >= 70 ? (
            <p className="text-green-600 dark:text-green-400 font-medium mb-4">
              Great job! You're making excellent progress with this concept.
            </p>
          ) : (
            <p className="text-amber-600 dark:text-amber-400 font-medium mb-4">
              Keep practicing! You'll improve with more review sessions.
            </p>
          )}
          
          <div className="flex flex-col sm:flex-row justify-center gap-2">
            <Button onClick={startQuiz} variant="outline">
              <ProgressBar className="mr-2" size={16} />
              <span>Practice Again</span>
            </Button>
            <Button onClick={onClose}>
              <CheckCircle2 className="mr-2" size={16} />
              <span>Finish Session</span>
            </Button>
          </div>
        </div>
      );
    }

    const currentQuestion = quizQuestions[currentQuestionIndex];
    
    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Question {currentQuestionIndex + 1} of {quizQuestions.length}
          </h3>
          <Badge variant="outline">
            {concept.name}
          </Badge>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-medium mb-4">{currentQuestion.question}</h2>
          
          <RadioGroup value={selectedAnswer?.toString()} className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <div
                key={index}
                className={`flex items-center space-x-2 border p-3 rounded-md cursor-pointer ${
                  hasAnswered
                    ? index === currentQuestion.correctAnswer
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                      : selectedAnswer === index
                        ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                        : "border-gray-200 dark:border-gray-700"
                    : selectedAnswer === index
                      ? "border-primary"
                      : "border-gray-200 dark:border-gray-700"
                }`}
                onClick={() => handleAnswerSelect(index)}
              >
                <RadioGroupItem
                  value={index.toString()}
                  id={`option-${index}`}
                  disabled={hasAnswered}
                />
                <Label
                  htmlFor={`option-${index}`}
                  className="flex-grow cursor-pointer"
                >
                  {option}
                </Label>
                {hasAnswered && index === currentQuestion.correctAnswer && (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
                {hasAnswered && selectedAnswer === index && index !== currentQuestion.correctAnswer && (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
            ))}
          </RadioGroup>
        </div>
        
        {hasAnswered && (
          <div className="mb-6 p-4 bg-neutral-100 dark:bg-gray-800 rounded-md">
            <h4 className="font-medium mb-2">Explanation:</h4>
            <p className="text-gray-700 dark:text-gray-300">{currentQuestion.explanation}</p>
          </div>
        )}
        
        <div className="flex justify-end">
          {!hasAnswered ? (
            <Button 
              onClick={handleCheckAnswer}
              disabled={selectedAnswer === null}
            >
              Check Answer
            </Button>
          ) : (
            <Button onClick={handleNextQuestion}>
              {currentQuestionIndex < quizQuestions.length - 1 ? (
                <>
                  <span>Next Question</span>
                  <ArrowRight className="ml-2" size={16} />
                </>
              ) : (
                <span>See Results</span>
              )}
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {quizMode ? (
          <Card>
            <CardHeader>
              <CardTitle>Learning Session: {concept.name}</CardTitle>
              <CardDescription>
                Test your knowledge of this concept
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderQuizContent()}
            </CardContent>
          </Card>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl text-primary">{concept.name}</DialogTitle>
              <DialogDescription>
                {concept.description}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {concept.tags && concept.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <h3 className="text-sm font-medium mb-2">Learning Progress</h3>
                {progress ? (
                  <div className="space-y-3 mb-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Comprehension</span>
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          {progress.comprehension}%
                        </span>
                      </div>
                      <ProgressBar value={progress.comprehension} color="green" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Practice</span>
                        <span className="text-blue-600 dark:text-blue-400 font-medium">
                          {progress.practice}%
                        </span>
                      </div>
                      <ProgressBar value={progress.practice} color="blue" />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    No learning progress recorded yet
                  </p>
                )}
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Source Documents</h3>
                {documentConcepts && documentConcepts.length > 0 ? (
                  <div className="space-y-2 mb-4">
                    {documentConcepts.map((doc: any) => (
                      <div key={doc.id} className="flex items-start">
                        <div className="mr-2 text-gray-400">
                          <span className="material-icons text-sm">description</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-primary">{doc.title}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {doc.pageReferences ? `Pages ${doc.pageReferences}` : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    No source documents found
                  </p>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={onClose} className="mr-2">
                Close
              </Button>
              <Button onClick={startQuiz}>
                <Brain className="mr-2" size={16} />
                <span>Start Learning Session</span>
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
