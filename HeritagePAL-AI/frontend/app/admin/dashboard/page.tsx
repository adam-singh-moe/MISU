"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Upload, FileText, Plus, List, BookOpen } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { adminApi } from "@/lib/api-new"
import { toast } from "sonner"

export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const router = useRouter()
  const [content, setContent] = useState<any[]>([])
  const [contentLoading, setContentLoading] = useState(true)

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isLoading && !isAuthenticated) {
      router.push("/admin")
    } else {
      fetchContent()
    }
  }, [isLoading, isAuthenticated, router])

  const fetchContent = async () => {
    setContentLoading(true)
    try {
      const data = await adminApi.getAllContent()
      setContent(data || [])
    } catch (error) {
      console.error("Failed to fetch content:", error)
      toast.error("Failed to load educational content")
    } finally {
      setContentLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-yellow-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-yellow-50">
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <Link href="/" className="flex items-center text-green-700 mb-2 hover:underline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Main Site
            </Link>
            <h1 className="text-3xl font-bold text-green-700">Admin Dashboard</h1>
            <p className="text-gray-600">Manage educational content for HeritagePal</p>
          </div>
          <div className="flex items-center">
            <span className="mr-4 text-gray-700">
              Welcome, <span className="font-semibold">{user?.name || user?.email}</span>
            </span>
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-2 border-green-200 shadow-md hover:shadow-lg transition-all">
            <CardHeader className="bg-green-50">
              <CardTitle className="flex items-center text-xl text-green-700">
                <Upload className="mr-2 h-5 w-5" />
                Upload Content
              </CardTitle>
              <CardDescription>Add new educational materials</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-gray-700 mb-4">
                Upload textbooks, worksheets, and curriculum guides for processing.
              </p>
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Upload New Content
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 shadow-md hover:shadow-lg transition-all">
            <CardHeader className="bg-green-50">
              <CardTitle className="flex items-center text-xl text-green-700">
                <BookOpen className="mr-2 h-5 w-5" />
                Manage Topics
              </CardTitle>
              <CardDescription>Create and organize topics</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-gray-700 mb-4">
                Create, edit and manage learning topics for different grade levels.
              </p>
              <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                <Link href="/admin/topics">Manage Topics</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 shadow-md hover:shadow-lg transition-all">
            <CardHeader className="bg-green-50">
              <CardTitle className="flex items-center text-xl text-green-700">
                <FileText className="mr-2 h-5 w-5" />
                View Reports
              </CardTitle>
              <CardDescription>Track student performance</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-gray-700 mb-4">
                View analytics and reports on student usage and performance.
              </p>
              <Button className="w-full bg-green-600 hover:bg-green-700">
                View Reports
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white border-2 border-green-200 rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-green-700 flex items-center">
              <List className="mr-2 h-5 w-5" />
              Educational Content
            </h2>
            <Button className="bg-green-600 hover:bg-green-700" onClick={fetchContent}>
              Refresh
            </Button>
          </div>

          {contentLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-600"></div>
            </div>
          ) : content.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-green-50">
                    <th className="border border-green-200 px-4 py-2 text-left">Title</th>
                    <th className="border border-green-200 px-4 py-2 text-left">Grade</th>
                    <th className="border border-green-200 px-4 py-2 text-left">Topic</th>
                    <th className="border border-green-200 px-4 py-2 text-left">Type</th>
                    <th className="border border-green-200 px-4 py-2 text-left">Date Added</th>
                    <th className="border border-green-200 px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {content.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="border border-green-200 px-4 py-2">{item.title}</td>
                      <td className="border border-green-200 px-4 py-2">{item.grade}</td>
                      <td className="border border-green-200 px-4 py-2">{item.topic}</td>
                      <td className="border border-green-200 px-4 py-2">{item.content_type}</td>
                      <td className="border border-green-200 px-4 py-2">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="border border-green-200 px-4 py-2">
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No content found. Upload some educational materials to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 