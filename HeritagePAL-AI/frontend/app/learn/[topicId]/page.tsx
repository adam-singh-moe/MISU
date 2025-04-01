"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { MainNavigation } from "@/components/main-navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { contentApi } from "@/lib/api-new"
import { toast } from "sonner"
import { useGrade } from "@/hooks/useGrade"
import { Flashcards } from "@/components/flashcards"
import { Loader2, BookOpen, Brain, Layers } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default function TopicPage() {
  const { topicId } = useParams()
  const { grade: userGrade } = useGrade()
  const [content, setContent] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedGrade, setSelectedGrade] = useState<number>(userGrade || 3)

  useEffect(() => {
    if (topicId) {
      fetchContent()
    }
  }, [topicId, selectedGrade])

  const fetchContent = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Use the generateContent method to get content on-the-fly
      const generatedContent = await contentApi.generateContent(
        topicId as string, 
        selectedGrade
      )
      
      console.log('Generated content:', generatedContent);
      
      // Initialize default content structure if some parts are missing
      const processedContent = {
        topic: generatedContent?.topic || 'Topic',
        grade: generatedContent?.grade || selectedGrade,
        timestamp: generatedContent?.timestamp || new Date().toISOString(),
        educational_content: {
          title: generatedContent?.educational_content?.title || 'Learning Content',
          description: generatedContent?.educational_content?.description || 'Educational material',
          processed_content: generatedContent?.educational_content?.processed_content || 'No content available'
        },
        quiz: {
          title: generatedContent?.quiz?.title || 'Quiz',
          description: generatedContent?.quiz?.description || 'Test your knowledge',
          questions: []
        },
        flashcard_set: {
          title: generatedContent?.flashcard_set?.title || 'Flashcards',
          description: generatedContent?.flashcard_set?.description || 'Study with flashcards',
          flashcards: []
        }
      };
      
      // Process response to ensure all components are in the expected format
      if (generatedContent) {
        // Handle quiz data if it's a string
        if (generatedContent.quiz && typeof generatedContent.quiz.questions === 'string') {
          try {
            processedContent.quiz.questions = JSON.parse(generatedContent.quiz.questions);
          } catch (err) {
            console.error('Failed to parse quiz questions:', err);
            processedContent.quiz.questions = [];
          }
        } else if (generatedContent.quiz && Array.isArray(generatedContent.quiz.questions)) {
          processedContent.quiz.questions = generatedContent.quiz.questions;
        }
        
        // Handle flashcard data if it's a string
        if (generatedContent.flashcard_set && typeof generatedContent.flashcard_set.flashcards === 'string') {
          try {
            processedContent.flashcard_set.flashcards = JSON.parse(generatedContent.flashcard_set.flashcards);
          } catch (err) {
            console.error('Failed to parse flashcards:', err);
            processedContent.flashcard_set.flashcards = [];
          }
        } else if (generatedContent.flashcard_set && Array.isArray(generatedContent.flashcard_set.flashcards)) {
          processedContent.flashcard_set.flashcards = generatedContent.flashcard_set.flashcards;
        }
        
        // Ensure quiz questions are an array
        if (processedContent.quiz.questions && !Array.isArray(processedContent.quiz.questions)) {
          if (typeof processedContent.quiz.questions === 'object') {
            processedContent.quiz.questions = Object.values(processedContent.quiz.questions);
          } else {
            processedContent.quiz.questions = [];
          }
        }
        
        // Ensure flashcards are an array
        if (processedContent.flashcard_set.flashcards && !Array.isArray(processedContent.flashcard_set.flashcards)) {
          if (typeof processedContent.flashcard_set.flashcards === 'object') {
            processedContent.flashcard_set.flashcards = Object.values(processedContent.flashcard_set.flashcards);
          } else {
            processedContent.flashcard_set.flashcards = [];
          }
        }
      }
      
      setContent(processedContent)
    } catch (err) {
      console.error("Error fetching content:", err)
      setError("Failed to load the topic content. Please try again.")
      toast.error("Failed to load topic content")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGradeChange = (grade: string) => {
    setSelectedGrade(parseInt(grade))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-50 to-yellow-50">
        <MainNavigation />
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-green-600" />
            <span className="ml-2 text-xl text-green-800">Generating learning content...</span>
          </div>
        </main>
      </div>
    )
  }

  if (error || !content) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-50 to-yellow-50">
        <MainNavigation />
        <main className="container mx-auto px-4 py-8">
          <Card className="bg-white border-2 border-red-200 shadow-md p-6 text-center">
            <CardContent className="pt-6">
              <p className="text-gray-700 mb-4">{error || "Something went wrong. Please try again."}</p>
              <Button onClick={fetchContent} className="bg-green-600 hover:bg-green-700">
                Try Again
              </Button>
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
        <div className="flex flex-col md:flex-row justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-green-800 mb-2">{content.topic}</h1>
            <div className="flex items-center">
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 mr-2">
                Grade {content.grade}
              </Badge>
              <span className="text-gray-600">AI-generated learning content</span>
            </div>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="flex items-center space-x-2">
              <span className="text-gray-700">Select Grade:</span>
              <select
                value={selectedGrade}
                onChange={(e) => handleGradeChange(e.target.value)}
                className="rounded-md border-gray-300 bg-white px-3 py-1 text-sm"
              >
                {[1, 2, 3, 4, 5, 6].map((grade) => (
                  <option key={grade} value={grade}>
                    Grade {grade}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <Tabs defaultValue="learn" className="mb-8">
          <TabsList className="bg-green-100 p-1">
            <TabsTrigger value="learn" className="data-[state=active]:bg-white">
              <BookOpen className="mr-2 h-4 w-4" />
              Learn
            </TabsTrigger>
            <TabsTrigger value="quiz" className="data-[state=active]:bg-white">
              <Brain className="mr-2 h-4 w-4" />
              Quiz
            </TabsTrigger>
            <TabsTrigger value="flashcards" className="data-[state=active]:bg-white">
              <Layers className="mr-2 h-4 w-4" />
              Flashcards
            </TabsTrigger>
          </TabsList>

          <TabsContent value="learn" className="mt-6">
            <Card className="bg-white border-2 border-green-100 shadow-md">
              <CardHeader>
                <CardTitle>{content.educational_content.title}</CardTitle>
                <CardDescription>{content.educational_content.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: content.educational_content.processed_content.replace(/\n/g, '<br/>') }} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quiz" className="mt-6">
            <Card className="bg-white border-2 border-yellow-100 shadow-md">
              <CardHeader>
                <CardTitle>{content.quiz.title}</CardTitle>
                <CardDescription>{content.quiz.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-4">
                  {Array.isArray(content.quiz?.questions) && content.quiz.questions.map((question: any, idx: number) => (
                    <div key={idx} className="bg-yellow-50 p-4 rounded-md">
                      <h3 className="font-semibold text-lg mb-2">Question {idx + 1}: {question.question_text}</h3>
                      <ul className="space-y-2">
                        {Array.isArray(question.options) && question.options.map((option: string, optIdx: number) => (
                          <li key={optIdx} className="flex items-start">
                            <div className={`flex-shrink-0 w-6 h-6 rounded-full mr-2 flex items-center justify-center ${optIdx === question.correct_answer ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                              {String.fromCharCode(65 + optIdx)}
                            </div>
                            <span>{option}</span>
                          </li>
                        ))}
                      </ul>
                      {question.explanation && (
                        <div className="mt-2 text-sm text-gray-600">
                          <strong>Explanation:</strong> {question.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="flashcards" className="mt-6">
            <Card className="bg-white border-2 border-blue-100 shadow-md p-6">
              <CardHeader>
                <CardTitle>{content.flashcard_set.title}</CardTitle>
                <CardDescription>{content.flashcard_set.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  {Array.isArray(content.flashcard_set?.flashcards) && content.flashcard_set.flashcards.map((flashcard: any, idx: number) => (
                    <Card key={idx} className="w-full md:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.75rem)] border-2 border-blue-50 hover:border-blue-200 transition-all">
                      <CardHeader className="bg-blue-50 pb-2">
                        <CardTitle className="text-md">{flashcard.term || flashcard.front || ''}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <p>{flashcard.definition || flashcard.back || ''}</p>
                        {flashcard.example && (
                          <p className="mt-2 text-sm text-gray-600">
                            <strong>Example:</strong> {flashcard.example}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-center mt-8">
          <Button
            onClick={fetchContent}
            className="bg-green-600 hover:bg-green-700 mr-4"
          >
            Regenerate Content
          </Button>
          <Button asChild variant="outline" className="text-green-700 border-green-200">
            <Link href="/learn">
              Back to Topics
            </Link>
          </Button>
        </div>
      </main>
    </div>
  )
} 