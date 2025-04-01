import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BookOpen } from "lucide-react"

interface Topic {
  id: number | string
  title: string
  grade: number
  description?: string
  icon?: string
  difficulty?: string
}

interface TopicCardProps {
  topic: Topic
}

export function TopicCard({ topic }: TopicCardProps) {
  const difficultyColors = {
    easy: "bg-green-100 text-green-800 border-green-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    hard: "bg-red-100 text-red-800 border-red-200",
    default: "bg-blue-100 text-blue-800 border-blue-200"
  }

  const difficultyLabels = {
    easy: "Easy",
    medium: "Medium",
    hard: "Challenging",
    default: "Standard"
  }

  const difficultyColor = topic.difficulty ? difficultyColors[topic.difficulty] : difficultyColors.default;
  const difficultyLabel = topic.difficulty ? difficultyLabels[topic.difficulty] : difficultyLabels.default;

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border-2 border-green-100">
      <CardHeader className="bg-green-50 pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <span className="text-3xl">{topic.icon}</span>
            <h3 className="font-bold text-lg text-green-700">{topic.title}</h3>
          </div>
          <Badge variant="outline" className={difficultyColor}>
            {difficultyLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <p className="text-gray-700">{topic.description}</p>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <Button asChild variant="outline" className="text-green-700 border-green-200">
          <Link href={`/learn/${topic.id}`}>
            <BookOpen className="mr-2 h-4 w-4" />
            Start Learning
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm" className="text-gray-500">
          <Link href={`/quizzes/topic/${topic.id}`}>Practice Quiz</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

