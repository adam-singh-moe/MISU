"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { motion } from "framer-motion"
import { useGrade } from "@/hooks/useGrade"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

export function GradesSelector() {
  const { grade, updateGrade, userGrades, isLoading } = useGrade()
  const { isAuthenticated } = useAuth()
  const [localGrade, setLocalGrade] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Initialize local state from the hook
    if (grade) {
      setLocalGrade(grade)
    }
  }, [grade])

  const handleGradeSelect = (gradeNum: number) => {
    setLocalGrade(gradeNum)
    updateGrade(gradeNum)
    
    // Force a refresh of the current page
    // This ensures the page content updates immediately after grade selection
    if (typeof window !== 'undefined') {
      // Add a slight delay to allow state to update
      setTimeout(() => {
        // Use router.refresh() in Next.js 13+
        router.refresh()
        
        // For more drastic refresh, you could do:
        // window.location.href = window.location.pathname
      }, 100)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="grades-selector"
    >
      <Card className="p-6 bg-white border-2 border-yellow-200 shadow-md">
        <h2 className="text-xl font-bold text-center text-green-700 mb-4">Select Your Grade</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map((gradeNum) => (
            <Button
              key={gradeNum}
              onClick={() => handleGradeSelect(gradeNum)}
              className={`h-16 text-lg font-bold rounded-xl transition-all duration-300 ${
                localGrade === gradeNum
                  ? "bg-yellow-500 hover:bg-yellow-600"
                  : "bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-800"
              }`}
            >
              Grade {gradeNum}
            </Button>
          ))}
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 mb-2">Choose your grade level to see topics for your class</p>
          {!isAuthenticated && (
            <p className="text-xs text-green-700 font-medium">
              No account needed! You can explore all topics without signing in.
            </p>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

