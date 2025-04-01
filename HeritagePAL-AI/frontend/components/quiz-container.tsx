"use client"

import { useState, useEffect } from "react"
import QuizQuestion from "./quiz-question"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { TopicSelector } from "./topic-selector"
import { contentApi, Quiz, QuizQuestion as QuizQuestionType } from "@/lib/api-new"
import { toast } from "sonner"
import { CheckCircle, XCircle, Award, RotateCw } from "lucide-react"
import { useGrade } from "@/hooks/useGrade"

export default function QuizContainer() {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const { grade: userGrade } = useGrade()

  // Fetch quiz when topic changes
  useEffect(() => {
    if (selectedTopic) {
      loadQuiz(selectedTopic)
    }
  }, [selectedTopic])

  const loadQuiz = async (topicId: string) => {
    setIsLoading(true)
    try {
      // Generate content on-the-fly using the AI model
      const generatedContent = await contentApi.generateContent(topicId, userGrade || 3);
      
      console.log('Generated quiz data:', generatedContent?.quiz?.questions);
      
      if (generatedContent && generatedContent.quiz) {
        // Parse questions if they're not already an array
        let questionsData = generatedContent.quiz.questions;
        
        // If questions is a string, try to parse it as JSON
        if (typeof questionsData === 'string') {
          try {
            questionsData = JSON.parse(questionsData);
          } catch (err) {
            console.error('Failed to parse quiz questions string:', err);
          }
        }
        
        // Ensure questionsData is an array
        if (!Array.isArray(questionsData)) {
          // If it's an object with numeric keys, convert to array
          if (questionsData && typeof questionsData === 'object') {
            questionsData = Object.values(questionsData);
          } else {
            // If it's a valid question object, create a single-item array
            questionsData = questionsData && typeof questionsData === 'object' ? [questionsData] : [];
          }
        }
        
        // Transform the generated quiz into the expected format
        const quizData = {
          id: `generated-${Date.now()}`,
          title: generatedContent.quiz.title,
          description: generatedContent.quiz.description,
          topic: generatedContent.topic,
          grade: generatedContent.grade,
          questions: questionsData.map((q, index) => ({
            id: `q-${index}`,
            question: q.question_text || q.question || '',
            options: q.options || [],
            correctAnswer: q.correct_answer !== undefined ? q.correct_answer : (q.correctAnswer !== undefined ? q.correctAnswer : 0),
            explanation: q.explanation || '',
          }))
        };
        
        setQuiz(quizData);
        
        // Reset quiz state
        setCurrentQuestionIndex(0);
        setSelectedAnswers({});
        setIsSubmitted(false);
        setScore(0);
      } else {
        toast.error("Failed to generate quiz questions");
        setQuiz(null);
      }
    } catch (error) {
      console.error("Error generating quiz:", error)
      toast.error("Error generating quiz")
      setQuiz(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTopicSelect = (topicId: string) => {
    setSelectedTopic(topicId)
  }

  const handleAnswerSelect = (questionId: string, answer: string) => {
    if (!isSubmitted) {
      setSelectedAnswers((prev) => ({
        ...prev,
        [questionId]: answer,
      }))
    }
  }

  const handleNextQuestion = () => {
    if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const calculateScore = (): number => {
    if (!quiz) return 0
    
    let correctCount = 0
    quiz.questions.forEach((question) => {
      if (selectedAnswers[question.id] === question.correctAnswer) {
        correctCount++
      }
    })
    
    return Math.round((correctCount / quiz.questions.length) * 100)
  }

  const handleSubmit = () => {
    const calculatedScore = calculateScore()
    setScore(calculatedScore)
    setIsSubmitted(true)
    
    // Here you might want to send the quiz results to an API
    toast.success(`Quiz submitted! Your score: ${calculatedScore}%`)
  }

  const handleRetry = () => {
    if (selectedTopic) {
      loadQuiz(selectedTopic)
    }
  }

  const getCurrentQuestion = (): QuizQuestionType | undefined => {
    return quiz?.questions[currentQuestionIndex]
  }

  const isQuestionAnswered = (questionId: string): boolean => {
    return !!selectedAnswers[questionId]
  }

  const isAllQuestionsAnswered = (): boolean => {
    if (!quiz) return false
    return quiz.questions.every((q) => isQuestionAnswered(q.id))
  }

  return (
    <div className="container mx-auto max-w-4xl p-4">
      {!selectedTopic ? (
        <Card className="shadow-md border-2 border-green-200">
          <CardHeader className="bg-green-50 rounded-t-lg">
            <CardTitle className="text-xl text-green-700">Select a Topic</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <TopicSelector onSelect={handleTopicSelect} />
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
        </div>
      ) : !quiz ? (
        <Card className="shadow-md border-2 border-green-200">
          <CardHeader className="bg-green-50 rounded-t-lg">
            <CardTitle className="text-xl text-green-700">No Quiz Available</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-gray-700 mb-4">Sorry, no quiz is available for this topic. Please try another topic.</p>
            <Button onClick={() => setSelectedTopic(null)} className="bg-green-600 hover:bg-green-700">
              Back to Topic Selection
            </Button>
          </CardContent>
        </Card>
      ) : isSubmitted ? (
        <Card className="shadow-md border-2 border-green-200">
          <CardHeader className="bg-green-50 rounded-t-lg">
            <CardTitle className="text-xl text-green-700">Quiz Results</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-6">
              <Award className="h-16 w-16 text-yellow-500 mb-4" />
              <h3 className="text-2xl font-bold mb-2">Your Score: {score}%</h3>
              <Progress value={score} className="w-full max-w-md h-3 mb-4" />
              
              <div className="space-y-4 w-full max-w-md mt-6">
                {quiz.questions.map((question, index) => (
                  <div key={question.id} className="border rounded-md p-4 bg-gray-50">
                    <p className="font-medium mb-2">Question {index + 1}: {question.question}</p>
                    <div className="flex items-center mt-2">
                      <p className="mr-2">Your answer: </p>
                      <span className="font-medium">
                        {selectedAnswers[question.id] || "No answer"}
                      </span>
                      {selectedAnswers[question.id] === question.correctAnswer ? (
                        <CheckCircle className="h-5 w-5 text-green-600 ml-2" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 ml-2" />
                      )}
                    </div>
                    {selectedAnswers[question.id] !== question.correctAnswer && (
                      <p className="text-sm mt-2 text-gray-600">
                        Correct answer: <span className="font-medium">{question.correctAnswer}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 p-4 flex justify-between">
            <Button 
              onClick={() => setSelectedTopic(null)} 
              variant="outline"
              className="border-green-600 text-green-700"
            >
              Change Topic
            </Button>
            <Button 
              onClick={handleRetry} 
              className="bg-green-600 hover:bg-green-700"
            >
              <RotateCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card className="shadow-md border-2 border-green-200">
          <CardHeader className="bg-green-50 rounded-t-lg">
            <CardTitle className="text-xl text-green-700">{quiz.title}</CardTitle>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-600">Topic: {quiz.topic}</span>
              <span className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
              </span>
            </div>
            <Progress 
              value={((currentQuestionIndex + 1) / quiz.questions.length) * 100} 
              className="h-1 mt-2" 
            />
          </CardHeader>
          <CardContent className="p-6">
            {getCurrentQuestion() && (
              <QuizQuestion
                question={getCurrentQuestion()!}
                selectedAnswer={selectedAnswers[getCurrentQuestion()!.id]}
                onSelectAnswer={(answer) => 
                  handleAnswerSelect(getCurrentQuestion()!.id, answer)
                }
                isSubmitted={isSubmitted}
              />
            )}
          </CardContent>
          <CardFooter className="bg-gray-50 p-4 flex justify-between">
            <div>
              <Button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                variant="outline"
                className="mr-2 border-green-600 text-green-700"
              >
                Previous
              </Button>
              <Button
                onClick={handleNextQuestion}
                disabled={currentQuestionIndex === quiz.questions.length - 1}
                variant="outline"
                className="border-green-600 text-green-700"
              >
                Next
              </Button>
            </div>
            {currentQuestionIndex === quiz.questions.length - 1 && (
              <Button
                onClick={handleSubmit}
                disabled={!isAllQuestionsAnswered()}
                className="bg-green-600 hover:bg-green-700"
              >
                Submit Quiz
              </Button>
            )}
          </CardFooter>
        </Card>
      )}
    </div>
  )
} 