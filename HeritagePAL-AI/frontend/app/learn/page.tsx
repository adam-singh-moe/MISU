"use client"

import { useState, useEffect } from "react"
import { MainNavigation } from "@/components/main-navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TopicCard } from "@/components/topic-card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { contentApi } from "@/lib/api-new"
import { toast } from "sonner"
import { useGrade } from "@/hooks/useGrade"
import { useSearchParams } from "next/navigation"

interface ApiTopic {
  id: string
  title: string
  description?: string
  gradeLevel?: string | number
}

interface DisplayTopic {
  id: string
  title: string
  name: string
  description?: string
  difficulty: "easy" | "medium" | "hard"
  icon?: string
  grade: number
  gradeLevel?: number
  allGrades?: number[]
}

export default function LearnPage() {
  const [topics, setTopics] = useState<DisplayTopic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { grade: userGrade } = useGrade()
  const searchParams = useSearchParams()
  const gradeParam = searchParams.get('grade')
  const [error, setError] = useState<string | null>(null)
  
  // Use the grade param if present, otherwise use the grade from the hook
  const selectedGrade = gradeParam ? parseInt(gradeParam, 10) : userGrade

  useEffect(() => {
    const fetchTopics = async () => {
      setIsLoading(true)
      try {
        const data = await contentApi.getTopics()
        
        // Transform API topics to the format expected by TopicCard
        const transformedTopics = (data || []).map((topic: ApiTopic) => {
          // Assign difficulty based on grade level or other logic
          let difficulty: "easy" | "medium" | "hard" = "medium";
          
          // Handle different grade formats and defaults
          let grade = 0;
          if (topic.gradeLevel !== undefined) {
            grade = typeof topic.gradeLevel === 'string' 
              ? parseInt(topic.gradeLevel, 10) || 0
              : topic.gradeLevel;
          }
          
          if (grade <= 3) difficulty = "easy";
          else if (grade >= 5) difficulty = "hard";
          
          return {
            id: topic.id,
            title: topic.title,
            name: topic.title,
            description: topic.description,
            difficulty,
            grade,
            icon: "📚", // Default icon
            gradeLevel: typeof topic.gradeLevel === 'string' ? parseInt(topic.gradeLevel, 10) : topic.gradeLevel,
            allGrades: typeof topic.gradeLevel === 'string' ? [parseInt(topic.gradeLevel, 10)] : undefined
          };
        });
        
        setTopics(transformedTopics)
      } catch (err) {
        setError('Failed to load topics')
        console.error('Error loading topics:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTopics()
  }, [])

  // Filter topics by selected grade if available
  const filteredTopics = selectedGrade 
    ? topics.filter(topic => topic.grade === selectedGrade)
    : topics;

  const easyTopics = filteredTopics.filter(topic => topic.difficulty === "easy")
  const mediumTopics = filteredTopics.filter(topic => topic.difficulty === "medium")
  const hardTopics = filteredTopics.filter(topic => topic.difficulty === "hard")

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-50 to-yellow-50">
        <MainNavigation />
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
        </div>
      </div>
    )
  }

  if (filteredTopics.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-50 to-yellow-50">
        <MainNavigation />
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-green-800 mb-8">
            {selectedGrade ? `Grade ${selectedGrade} Topics` : 'Learn By Topic'}
          </h1>
          <Card className="bg-white border-2 border-yellow-200 shadow-md p-6 text-center">
            <CardContent className="pt-6">
              <p className="text-gray-700 mb-4">
                {selectedGrade 
                  ? `No topics available for Grade ${selectedGrade} at this time. Please check back later.`
                  : 'No topics available at this time. Please check back later.'}
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-50 to-yellow-50">
      <MainNavigation />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-green-800 mb-8">
          {selectedGrade ? `Grade ${selectedGrade} Topics` : 'Learn By Topic'}
        </h1>

        <Tabs defaultValue="all" className="mb-8">
          <TabsList className="bg-green-100 p-1">
            <TabsTrigger value="all" className="data-[state=active]:bg-white">
              All Topics
            </TabsTrigger>
            <TabsTrigger value="easy" className="data-[state=active]:bg-white">
              Easy
            </TabsTrigger>
            <TabsTrigger value="medium" className="data-[state=active]:bg-white">
              Medium
            </TabsTrigger>
            <TabsTrigger value="hard" className="data-[state=active]:bg-white">
              Challenging
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTopics.map((topic) => (
                <TopicCard key={topic.id} topic={topic} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="easy" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {easyTopics.map((topic) => (
                <TopicCard key={topic.id} topic={topic} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="medium" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mediumTopics.map((topic) => (
                <TopicCard key={topic.id} topic={topic} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="hard" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hardTopics.map((topic) => (
                <TopicCard key={topic.id} topic={topic} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <Card className="bg-white border-2 border-yellow-200 shadow-md">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <h3 className="text-xl font-semibold text-green-800 mb-2">
                  Need a Custom Learning Path?
                </h3>
                <p className="text-gray-600">
                  Our AI-powered chat assistant can help you create a personalized learning plan.
                </p>
              </div>
              <Button asChild className="bg-green-600 hover:bg-green-700">
                <Link href={`/chat?grade=${selectedGrade}`}>Chat with Heritage Pal</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

