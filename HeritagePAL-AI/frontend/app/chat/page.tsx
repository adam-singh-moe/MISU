"use client"

import { MainNavigation } from "@/components/main-navigation"
import { ChatInterface } from "@/components/chat-interface"
import { useGrade } from "@/hooks/useGrade"
import { useSearchParams } from "next/navigation"

export default function ChatPage() {
  const { grade: userGrade } = useGrade()
  const searchParams = useSearchParams()
  const gradeParam = searchParams.get('grade')
  
  // Use the grade param if present, otherwise use the grade from the hook
  const selectedGrade = gradeParam ? parseInt(gradeParam, 10) : userGrade

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-50 to-yellow-50">
      <MainNavigation />

      <main className="flex-grow container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-green-700">
            {selectedGrade ? `Ask HeritagePal - Grade ${selectedGrade}` : 'Ask HeritagePal'}
          </h1>
          <p className="text-gray-600">Chat with your AI tutor about any Social Studies topic</p>
        </header>

        <ChatInterface grade={selectedGrade} />
      </main>

      <footer className="bg-green-700 text-white py-4">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">HeritagePal - Helping Guyanese students learn Social Studies</p>
        </div>
      </footer>
    </div>
  )
}

