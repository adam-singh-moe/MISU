"use client"

import { useState, useEffect } from "react"
import { MainNavigation } from "@/components/main-navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { TopicSelector } from "@/components/topic-selector"
import { QuizCard } from "@/components/quiz-card"
import { quizApi } from "@/lib/api-new"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { useGrade } from "@/hooks/useGrade"
import { useSearchParams } from "next/navigation"

export default function QuizzesPage() {
  const { grade: userGrade } = useGrade()
  const searchParams = useSearchParams()
  const gradeParam = searchParams.get('grade')
  
  // Use the grade param if present, otherwise use the grade from the hook
  const initialGrade = gradeParam ? parseInt(gradeParam, 10) : userGrade

  const [quizzes, setQuizzes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTopic, setSelectedTopic] = useState<string>("")
  const [selectedGrade, setSelectedGrade] = useState<number | undefined>(initialGrade || undefined)

  useEffect(() => {
    // Fetch quizzes on initial load, using the grade from URL or user profile
    fetchQuizzes(undefined, initialGrade)
  }, [initialGrade])

  const fetchQuizzes = async (topic?: string, grade?: number) => {
    setIsLoading(true)
    try {
      const data = await quizApi.getAllQuizzes(grade, topic)
      setQuizzes(data)
    } catch (error) {
      console.error("Failed to fetch quizzes:", error)
      toast.error("Failed to load quizzes. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTopicChange = (topic: string) => {
    setSelectedTopic(topic)
  }

  const handleFindQuizzes = () => {
    fetchQuizzes(selectedTopic, selectedGrade)
  }

  const pageTitle = selectedGrade 
    ? `Grade ${selectedGrade} Quizzes` 
    : 'Quizzes';

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-50 to-yellow-50">
      <MainNavigation />

      <main className="flex-grow container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-green-700">{pageTitle}</h1>
          <p className="text-gray-600">Test your knowledge with fun interactive quizzes</p>
        </header>

        <div className="mb-8">
          <Card className="bg-white border-2 border-yellow-200 shadow-md">
            <CardHeader className="bg-yellow-100 rounded-t-lg">
              <CardTitle className="text-xl text-green-700">Find a Quiz</CardTitle>
              <CardDescription>Select a topic to find related quizzes</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <TopicSelector onSelect={handleTopicChange} gradeFilter={selectedGrade} />
                <div className="flex flex-col md:flex-row gap-4">
                  <select 
                    className="border border-gray-300 rounded-md px-3 py-2"
                    onChange={(e) => setSelectedGrade(e.target.value ? Number(e.target.value) : undefined)}
                    value={selectedGrade || ""}
                  >
                    <option value="">All Grades</option>
                    {[1, 2, 3, 4, 5, 6].map((grade) => (
                      <option key={grade} value={grade}>
                        Grade {grade}
                      </option>
                    ))}
                  </select>
                  <Button 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleFindQuizzes}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Find Quizzes"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-2xl font-bold text-green-700 mb-6">
          {selectedGrade ? `Grade ${selectedGrade} Quizzes` : 'Available Quizzes'}
        </h2>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          </div>
        ) : quizzes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {quizzes.map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">
              {selectedGrade 
                ? `No quizzes found for Grade ${selectedGrade}. Try changing your filters or check back later!`
                : 'No quizzes found. Try changing your filters or check back later!'}
            </p>
          </div>
        )}

        <Card className="bg-white border-2 border-green-200 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl text-green-700">Practice Exam</CardTitle>
            <CardDescription>Prepare for your Social Studies exam</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              Try our practice exam that covers all the topics from your grade level. This will help you prepare for
              your actual Social Studies exam.
            </p>
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <Link href={selectedGrade ? `/quizzes/practice-exam?grade=${selectedGrade}` : "/quizzes/practice-exam"}>
                Start Practice Exam
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>

      <footer className="bg-green-700 text-white py-4">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">HeritagePal - Helping Guyanese students learn Social Studies</p>
        </div>
      </footer>
    </div>
  )
}

