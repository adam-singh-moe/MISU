"use client"

import { useState } from "react"
import { MainNavigation } from "@/components/main-navigation"
import { Card } from "@/components/ui/card"
import { Flashcards } from "@/components/flashcards"
import { TopicSelector } from "@/components/topic-selector"
import { useGrade } from "@/hooks/useGrade"
import { useSearchParams } from "next/navigation"

export default function FlashcardsPage() {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const { grade: userGrade } = useGrade()
  const searchParams = useSearchParams()
  const gradeParam = searchParams.get('grade')
  
  // Use the grade param if present, otherwise use the grade from the hook
  const selectedGrade = gradeParam ? parseInt(gradeParam, 10) : userGrade

  const handleTopicSelect = (topicId: string) => {
    setSelectedTopic(topicId)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-50 to-yellow-50">
      <MainNavigation />

      <main className="flex-grow container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-green-700">
            {selectedGrade ? `Grade ${selectedGrade} Flashcards` : 'Flashcards'}
          </h1>
          <p className="text-gray-600">Practice key terms and concepts with interactive flashcards</p>
        </header>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Select a Topic</h2>
          <TopicSelector onSelect={handleTopicSelect} gradeFilter={selectedGrade} />
        </div>

        {selectedTopic ? (
          <Card className="bg-white border-2 border-yellow-200 shadow-md p-6">
            <Flashcards topicId={selectedTopic} />
          </Card>
        ) : (
          <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-600">Please select a topic to view flashcards</p>
          </div>
        )}
      </main>

      <footer className="bg-green-700 text-white py-4">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">HeritagePal - Helping Guyanese students learn Social Studies</p>
        </div>
      </footer>
    </div>
  )
}

