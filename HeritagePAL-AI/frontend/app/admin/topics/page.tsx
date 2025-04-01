"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Edit, Trash2, BookOpen } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

// Schema for topic form validation
const topicSchema = z.object({
  name: z.string().min(2, { message: "Topic name must be at least 2 characters" }),
  grade: z.coerce.number().min(1).max(6),
  description: z.string().optional(),
})

type TopicFormValues = z.infer<typeof topicSchema>

// Topic interface matching our simplified database schema
interface Topic {
  id: string
  name: string
  grade: number
  description?: string
}

// Add after your interface declaration
const topicsApi = {
  getTopics: async () => {
    const response = await fetch('/api/topics');
    return await response.json();
  },
  createTopic: async (data: TopicFormValues) => {
    const response = await fetch('/api/topics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await response.json();
  },
  updateTopic: async (id: string, data: TopicFormValues) => {
    const response = await fetch(`/api/topics/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await response.json();
  },
  deleteTopic: async (id: string) => {
    const response = await fetch(`/api/topics/${id}`, {
      method: 'DELETE'
    });
    return await response.json();
  }
};

export default function TopicsManagement() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null)

  // Set up form with react-hook-form
  const form = useForm<TopicFormValues>({
    resolver: zodResolver(topicSchema),
    defaultValues: {
      name: "",
      grade: 1,
      description: "",
    },
  })

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isLoading && !isAuthenticated) {
      router.push("/admin")
    } else {
      fetchTopics()
    }
  }, [isLoading, isAuthenticated, router])

  // Reset form when editingTopic changes
  useEffect(() => {
    if (editingTopic) {
      form.reset({
        name: editingTopic.name,
        grade: editingTopic.grade,
        description: editingTopic.description || "",
      })
    } else {
      form.reset({
        name: "",
        grade: 1,
        description: "",
      })
    }
  }, [editingTopic, form])

  const fetchTopics = async () => {
    setLoading(true)
    try {
      const response = await topicsApi.getTopics()
      setTopics(response.data || [])
    } catch (error) {
      console.error("Failed to fetch topics:", error)
      toast.error("Failed to load topics")
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (values: TopicFormValues) => {
    try {
      if (editingTopic) {
        // Update existing topic
        await topicsApi.updateTopic(editingTopic.id, values)
        toast.success("Topic updated successfully")
      } else {
        // Create new topic
        await topicsApi.createTopic(values)
        toast.success("Topic created successfully")
      }
      
      setOpenDialog(false)
      setEditingTopic(null)
      fetchTopics() // Refresh the topics list
    } catch (error) {
      console.error("Error saving topic:", error)
      toast.error("Failed to save topic")
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this topic? This action cannot be undone.")) {
      try {
        await topicsApi.deleteTopic(id)
        toast.success("Topic deleted successfully")
        fetchTopics() // Refresh the topics list
      } catch (error) {
        console.error("Error deleting topic:", error)
        toast.error("Failed to delete topic")
      }
    }
  }

  const openAddDialog = () => {
    setEditingTopic(null)
    setOpenDialog(true)
  }

  const openEditDialog = (topic: Topic) => {
    setEditingTopic(topic)
    setOpenDialog(true)
  }

  // Loading state
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
            <Link href="/admin/dashboard" className="flex items-center text-green-700 mb-2 hover:underline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-green-700">Topics Management</h1>
            <p className="text-gray-600">Create and manage topics for different grade levels</p>
          </div>
          <div>
            <Button 
              onClick={openAddDialog} 
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="mr-2 h-4 w-4" /> Add New Topic
            </Button>
          </div>
        </header>

        <Card className="border-2 border-green-200 shadow-md">
          <CardHeader className="bg-green-50">
            <CardTitle className="text-xl text-green-700 flex items-center">
              <BookOpen className="mr-2 h-5 w-5" />
              Topics List
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-600"></div>
              </div>
            ) : topics.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-green-50">
                      <th className="border border-green-200 px-4 py-2 text-left">Name</th>
                      <th className="border border-green-200 px-4 py-2 text-left">Grade</th>
                      <th className="border border-green-200 px-4 py-2 text-left">Description</th>
                      <th className="border border-green-200 px-4 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topics.map((topic) => (
                      <tr key={topic.id} className="hover:bg-gray-50">
                        <td className="border border-green-200 px-4 py-2">{topic.name}</td>
                        <td className="border border-green-200 px-4 py-2">{topic.grade}</td>
                        <td className="border border-green-200 px-4 py-2">{topic.description || "—"}</td>
                        <td className="border border-green-200 px-4 py-2">
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openEditDialog(topic)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDelete(topic.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
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
                <p className="text-gray-600">No topics found. Create a new topic to get started.</p>
                <Button 
                  onClick={openAddDialog}
                  variant="outline" 
                  className="mt-4"
                >
                  <Plus className="mr-2 h-4 w-4" /> Add First Topic
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Topic Form Dialog */}
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingTopic ? "Edit Topic" : "Add New Topic"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Topic Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter topic name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grade Level</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value.toString()}
                        value={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select grade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6].map((grade) => (
                            <SelectItem key={grade} value={grade.toString()}>
                              Grade {grade}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter a brief description of the topic"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setOpenDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    {editingTopic ? "Update Topic" : "Create Topic"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
} 