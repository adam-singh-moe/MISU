"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import axios from "axios"
import { toast } from "sonner"

interface LearningHistory {
  quizzes: any[]
  flashcards: any[]
  chats: any[]
  topics: any[]
}

export default function StudentDashboard() {
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const [history, setHistory] = useState<LearningHistory>({ 
    quizzes: [], 
    flashcards: [], 
    chats: [], 
    topics: [] 
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // If not authenticated and not loading, redirect to login
    if (!isAuthenticated && !isLoading) {
      router.push("/account")
    } else if (isAuthenticated) {
      fetchLearningHistory()
    }
  }, [isAuthenticated, isLoading, router])

  const fetchLearningHistory = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("auth_token")
      
      // If no token, redirect to login
      if (!token) {
        console.error("No auth token found in localStorage")
        router.push("/account")
        return
      }
      
      console.log("Using token (first few chars):", token?.substring(0, 10) + "...")
      
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3080/api"}/users/learning-history`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      setHistory(response.data)
    } catch (error) {
      console.error("Error fetching learning history:", error)
      
      // Handle 401 Unauthorized errors
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        console.error("Authentication error - invalid or expired token")
        toast.error("Your session has expired. Please log in again.")
        localStorage.removeItem("auth_token") // Clear invalid token
        router.push("/account") // Redirect to login
        return
      }
      
      // Set empty history state for other errors
      setHistory({ 
        quizzes: [], 
        flashcards: [], 
        chats: [], 
        topics: [] 
      })
      
      // Only show toast for network errors, not for expected 400 errors
      // that might happen when a new user has no history yet
      if (axios.isAxiosError(error) && error.message !== "Request failed with status code 400") {
        toast.error("Failed to load your learning history")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push("/")
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-yellow-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-yellow-50 p-4">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-green-700">My Learning Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.name || 'Student'}</p>
          </div>
          <Button 
            variant="outline" 
            className="mt-4 md:mt-0"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>

        <Tabs defaultValue="quizzes" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
            <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
            <TabsTrigger value="chats">Chat Sessions</TabsTrigger>
            <TabsTrigger value="topics">Topics Viewed</TabsTrigger>
          </TabsList>
          
          <TabsContent value="quizzes">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {history.quizzes.length > 0 ? (
                history.quizzes.map((quiz, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">
                        {quiz.quiz?.title || 'Quiz'}
                      </CardTitle>
                      <CardDescription>
                        {new Date(quiz.created_at).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span>Score:</span>
                          <span className="font-medium">{quiz.score}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Topic:</span>
                          <span className="font-medium">{quiz.quiz?.topic || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Correct:</span>
                          <span className="font-medium">{quiz.correct_count} / {quiz.total_questions}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500">You haven't taken any quizzes yet.</p>
                  <Button 
                    className="mt-4 bg-green-600 hover:bg-green-700"
                    onClick={() => router.push('/quizzes')}
                  >
                    Start a Quiz
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="flashcards">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {history.flashcards.length > 0 ? (
                history.flashcards.map((session, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">
                        {session.topic?.title || 'Flashcard Session'}
                      </CardTitle>
                      <CardDescription>
                        {new Date(session.created_at).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span>Cards:</span>
                          <span className="font-medium">{session.flashcard_count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Grade:</span>
                          <span className="font-medium">{session.topic?.grade || 'N/A'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500">You haven't studied any flashcards yet.</p>
                  <Button 
                    className="mt-4 bg-green-600 hover:bg-green-700"
                    onClick={() => router.push('/flashcards')}
                  >
                    Study Flashcards
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="chats">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {history.chats.length > 0 ? (
                history.chats.map((chat, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg truncate">
                        {chat.topic || 'Chat Session'}
                      </CardTitle>
                      <CardDescription>
                        {new Date(chat.created_at).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        className="w-full"
                        variant="outline" 
                        onClick={() => router.push(`/chat?session=${chat.session_id}`)}
                      >
                        Continue Chat
                      </Button>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500">You haven't had any chat sessions yet.</p>
                  <Button 
                    className="mt-4 bg-green-600 hover:bg-green-700"
                    onClick={() => router.push('/chat')}
                  >
                    Start Chatting
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="topics">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {history.topics.length > 0 ? (
                history.topics.map((topicView, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">
                        {topicView.topic?.title || 'Topic'}
                      </CardTitle>
                      <CardDescription>
                        {new Date(topicView.viewed_at).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span>Grade:</span>
                          <span className="font-medium">{topicView.topic?.grade || 'N/A'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500">You haven't viewed any topics yet.</p>
                  <Button 
                    className="mt-4 bg-green-600 hover:bg-green-700"
                    onClick={() => router.push('/learn')}
                  >
                    Explore Topics
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 