import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Clock, Award } from "lucide-react"

interface Quiz {
  id: number
  title: string
  description: string
  questions: number
  difficulty: "easy" | "medium" | "hard"
  estimatedTime: string
  topicId: number
}

interface QuizCardProps {
  quiz: Quiz
}

export function QuizCard({ quiz }: QuizCardProps) {
  const difficultyColors = {
    easy: "bg-green-100 text-green-800 border-green-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    hard: "bg-red-100 text-red-800 border-red-200",
  }

  const difficultyLabels = {
    easy: "Easy",
    medium: "Medium",
    hard: "Challenging",
  }

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border-2 border-green-100">
      <CardHeader className="bg-green-50 pb-2">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-lg text-green-700">{quiz.title}</h3>
          <Badge variant="outline" className={difficultyColors[quiz.difficulty]}>
            {difficultyLabels[quiz.difficulty]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <p className="text-gray-700 mb-4">{quiz.description}</p>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center">
            <Award className="mr-1 h-4 w-4" />
            <span>{quiz.questions} questions</span>
          </div>
          <div className="flex items-center">
            <Clock className="mr-1 h-4 w-4" />
            <span>{quiz.estimatedTime}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Button asChild className="w-full bg-green-600 hover:bg-green-700">
          <Link href={`/quizzes/${quiz.id}`}>Start Quiz</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

