"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { contentApi, Topic } from "@/lib/api-new"
import { toast } from "sonner"
import { useGrade } from "@/hooks/useGrade"
import { useSearchParams } from "next/navigation"

interface TopicSelectorProps {
  onSelect: (topicId: string) => void
  gradeFilter?: number
}

export function TopicSelector({ onSelect, gradeFilter }: TopicSelectorProps) {
  const [topics, setTopics] = useState<Topic[]>([])
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { grade: userGrade } = useGrade()
  const searchParams = useSearchParams()
  const gradeParam = searchParams.get('grade')
  
  // Use explicit grade filter, URL param, user grade from hook, or no filter
  const selectedGrade = gradeFilter 
    ? gradeFilter 
    : gradeParam 
      ? parseInt(gradeParam, 10) 
      : userGrade;

  useEffect(() => {
    fetchTopics()
  }, [])

  const fetchTopics = async () => {
    setIsLoading(true)
    try {
      const topicsData = await contentApi.getTopics()
      setTopics(topicsData)
    } catch (error) {
      console.error("Failed to fetch topics:", error)
      toast.error("Failed to load topics")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelect = (topicId: string) => {
    setSelectedTopicId(topicId)
    onSelect(topicId)
  }

  // Filter topics by selected grade if available
  const filteredTopics = selectedGrade
    ? topics.filter(topic => {
        // Handle different grade formats
        const topicGrade = typeof topic.gradeLevel === 'string' 
          ? parseInt(topic.gradeLevel, 10) 
          : topic.gradeLevel;
        return topicGrade === selectedGrade;
      })
    : topics;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, index) => (
          <Card key={index} className="border border-gray-200">
            <CardContent className="p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3 mt-2" />
              <Skeleton className="h-8 w-full mt-4" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (filteredTopics.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 mb-4">
          {selectedGrade 
            ? `No topics available for Grade ${selectedGrade}.` 
            : 'No topics available.'}
        </p>
        <Button onClick={fetchTopics} className="bg-green-600 hover:bg-green-700">
          Refresh
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredTopics.map((topic) => (
        <Card 
          key={topic.id} 
          className={`border-2 cursor-pointer transition-all hover:shadow-md ${
            selectedTopicId === topic.id ? "border-green-600 bg-green-50" : "border-gray-200"
          }`}
          onClick={() => handleSelect(topic.id)}
        >
          <CardContent className="p-4">
            <h3 className="font-medium text-lg mb-1 text-green-700">{topic.title}</h3>
            <p className="text-gray-600 text-sm mb-2">
              {topic.description || "Explore this educational topic"}
            </p>
            <p className="text-xs text-gray-500">
              Grade level: {typeof topic.gradeLevel === 'string' ? topic.gradeLevel : topic.gradeLevel || 'All grades'}
            </p>
            <Button 
              className={`w-full mt-3 ${
                selectedTopicId === topic.id 
                  ? "bg-green-600 hover:bg-green-700" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              variant={selectedTopicId === topic.id ? "default" : "outline"}
            >
              {selectedTopicId === topic.id ? "Selected" : "Select"}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

