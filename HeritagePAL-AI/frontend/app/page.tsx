"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { GradesSelector } from "@/components/grades-selector"
import { HeritagePalMascot } from "@/components/heritage-pal-mascot"
import { useGrade } from "@/hooks/useGrade"
import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"

export default function Home() {
  const { grade, isLoading, updateGrade } = useGrade()
  const { isAuthenticated } = useAuth()
  const [key, setKey] = useState<number>(0)

  // Force re-render when grade changes
  useEffect(() => {
    setKey(prevKey => prevKey + 1)
  }, [grade])

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-yellow-50">
      <div className="container mx-auto px-4 py-8">
        <header className="flex flex-col items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            <HeritagePalMascot />
            <h1 className="text-4xl md:text-5xl font-bold text-green-700 text-center">
              Heritage<span className="text-yellow-500">Pal</span>
            </h1>
          </div>
          <p className="text-lg text-center mt-2 text-gray-700">Your friendly guide to Guyanese Social Studies!</p>
        </header>

        {!grade && <GradesSelector />}

        <AnimatePresence mode="wait">
          {grade && (
            <motion.section
              key={`grade-content-${grade}-${key}`}
              className="mt-12"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
            >
              <h2 className="text-2xl font-bold text-green-700 mb-6 text-center">
                Start Learning for Grade {grade}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <LearningCard
                  title="Learn Topics"
                  description="Explore Social Studies topics with fun explanations"
                  href={`/learn?grade=${grade}`}
                  color="bg-green-100 hover:bg-green-200"
                  icon="📚"
                />
                <LearningCard
                  title="Flashcards"
                  description="Practice key terms and concepts with flashcards"
                  href={`/flashcards?grade=${grade}`}
                  color="bg-yellow-100 hover:bg-yellow-200"
                  icon="🔄"
                />
                <LearningCard
                  title="Quizzes"
                  description="Test your knowledge with interactive quizzes"
                  href={`/quizzes?grade=${grade}`}
                  color="bg-red-100 hover:bg-red-200"
                  icon="❓"
                />
                <LearningCard
                  title="Ask HeritagePal"
                  description="Chat with your AI tutor about any Social Studies topic"
                  href={`/chat?grade=${grade}`}
                  color="bg-blue-100 hover:bg-blue-200"
                  icon="💬"
                />
              </div>
              
              {!isAuthenticated && (
                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-md p-4 text-center">
                  <p className="text-sm text-yellow-700">
                    You're browsing as a guest. <Link href="/account" className="font-bold underline">Create an account</Link> to save your learning progress!
                  </p>
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>

        {grade && (
          <motion.div
            className="mt-6 flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button 
              variant="outline" 
              onClick={() => {
                if (updateGrade) updateGrade(null);
              }}
              className="border-green-500 text-green-700 hover:bg-green-50"
            >
              Change Grade
            </Button>
          </motion.div>
        )}

        <section className="mt-12 mb-8">
          <Card className="p-6 bg-white border-2 border-green-200 shadow-md">
            <h2 className="text-xl font-bold text-green-700 mb-4">For Teachers & Parents</h2>
            <p className="text-gray-700 mb-4">
              HeritagePal helps students learn Guyanese Social Studies through interactive lessons, quizzes, and more.
              All content is based on the official curriculum and available without an account.
            </p>
            <div className="flex flex-col sm:flex-row justify-between gap-2 items-center">
              <p className="text-sm text-green-600">
                <strong>Creating an account</strong> lets students save their learning progress.
              </p>
              <div className="flex gap-2">
                <Button asChild variant="outline" className="border-green-500 text-green-700 hover:bg-green-50">
                  <Link href="/account">Student Account</Link>
                </Button>
                <Button asChild variant="outline" className="border-green-500 text-green-700 hover:bg-green-50">
                  <Link href="/admin">Admin Login</Link>
                </Button>
              </div>
            </div>
          </Card>
        </section>
      </div>

      <footer className="bg-green-700 text-white py-4 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">HeritagePal - Helping Guyanese students learn Social Studies</p>
        </div>
      </footer>
    </main>
  )
}

interface LearningCardProps {
  title: string
  description: string
  href: string
  color: string
  icon: string
}

function LearningCard({ title, description, href, color, icon }: LearningCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Link href={href}>
        <Card
          className={`p-6 transition-all duration-300 h-full flex flex-col ${color} border-none shadow-md hover:shadow-lg`}
        >
          <div className="text-4xl mb-4">{icon}</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
          <p className="text-gray-700">{description}</p>
        </Card>
      </Link>
    </motion.div>
  )
}

