"use client"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle } from "lucide-react"
import type { QuizQuestion as QuizQuestionType } from "@/lib/api-new"

interface QuizQuestionProps {
  question: QuizQuestionType
  selectedAnswer: string | undefined
  onSelectAnswer: (answer: string) => void
  isSubmitted: boolean
}

export default function QuizQuestion({
  question,
  selectedAnswer,
  onSelectAnswer,
  isSubmitted,
}: QuizQuestionProps) {
  const { question: questionText, options, correctAnswer } = question

  const isCorrect = (option: string): boolean => {
    return isSubmitted && selectedAnswer === option && option === correctAnswer
  }

  const isIncorrect = (option: string): boolean => {
    return isSubmitted && selectedAnswer === option && option !== correctAnswer
  }

  const isCorrectAnswer = (option: string): boolean => {
    return isSubmitted && option === correctAnswer
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-medium text-gray-800">{questionText}</h3>
      <RadioGroup
        value={selectedAnswer}
        onValueChange={onSelectAnswer}
        className="space-y-3"
        disabled={isSubmitted}
      >
        {options.map((option, index) => (
          <div 
            key={index} 
            className={`flex items-center space-x-2 rounded-md border p-3 ${
              isCorrect(option) 
                ? "border-green-500 bg-green-50" 
                : isIncorrect(option)
                ? "border-red-500 bg-red-50"
                : isCorrectAnswer(option) && isSubmitted
                ? "border-green-500 bg-green-50"
                : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            <RadioGroupItem value={option} id={`option-${index}`} />
            <Label 
              htmlFor={`option-${index}`} 
              className="flex-grow cursor-pointer text-gray-700 font-medium"
            >
              {option}
            </Label>
            {isCorrect(option) && (
              <CheckCircle className="h-5 w-5 text-green-600" />
            )}
            {isIncorrect(option) && (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            {isCorrectAnswer(option) && !isCorrect(option) && isSubmitted && (
              <CheckCircle className="h-5 w-5 text-green-600" />
            )}
          </div>
        ))}
      </RadioGroup>
    </div>
  )
} 