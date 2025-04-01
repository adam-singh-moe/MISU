"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, RotateCw } from "lucide-react"
import { contentApi, flashcardApi } from "@/lib/api-new"
import { toast } from "sonner"
import { useGrade } from "@/hooks/useGrade"

interface Flashcard {
  id?: string
  front?: string
  back?: string
  term?: string
  definition?: string
}

interface FlashcardsProps {
  topicId: string
}

export function Flashcards({ topicId }: FlashcardsProps) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { grade: userGrade } = useGrade()

  useEffect(() => {
    fetchFlashcards()
  }, [topicId])

  const fetchFlashcards = async () => {
    setIsLoading(true)
    try {
      // Generate content on-the-fly using the AI model
      const generatedContent = await contentApi.generateContent(topicId, userGrade || 3);
      
      console.log('Generated flashcards data:', generatedContent?.flashcard_set?.flashcards);
      
      if (generatedContent && generatedContent.flashcard_set && generatedContent.flashcard_set.flashcards) {
        // Check if flashcards is an array or parse it if it's a string
        let flashcardsData = generatedContent.flashcard_set.flashcards;
        
        // If it's a string, try to parse it as JSON
        if (typeof flashcardsData === 'string') {
          try {
            flashcardsData = JSON.parse(flashcardsData);
          } catch (err) {
            console.error('Failed to parse flashcards string:', err);
          }
        }
        
        // Ensure flashcardsData is an array
        if (!Array.isArray(flashcardsData)) {
          // If it's an object with numeric keys, convert to array
          if (flashcardsData && typeof flashcardsData === 'object') {
            flashcardsData = Object.values(flashcardsData);
          } else {
            // Create a single-item array if it's a valid flashcard object
            flashcardsData = flashcardsData && typeof flashcardsData === 'object' ? [flashcardsData] : [];
          }
        }
        
        // Transform flashcards to expected format
        const transformedFlashcards = flashcardsData.map((card, index) => ({
          id: `card-${index}`,
          front: card.term || card.front || '',
          back: card.definition || card.back || ''
        }));
        
        setFlashcards(transformedFlashcards);
      } else {
        setFlashcards([]);
        toast.error("Failed to generate flashcards");
      }
    } catch (error) {
      console.error("Failed to generate flashcards:", error)
      toast.error("Failed to generate flashcards")
      setFlashcards([])
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrevious = () => {
    setFlipped(false)
    setCurrentIndex(currentIndex === 0 ? flashcards.length - 1 : currentIndex - 1)
  }

  const handleNext = () => {
    setFlipped(false)
    setCurrentIndex(currentIndex === flashcards.length - 1 ? 0 : currentIndex + 1)
  }

  const handleFlip = () => {
    setFlipped(!flipped)
  }

  const handleRestart = () => {
    setCurrentIndex(0)
    setFlipped(false)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (flashcards.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 mb-4">No flashcards available for this topic.</p>
        <Button onClick={fetchFlashcards} className="bg-green-600 hover:bg-green-700">Refresh</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-lg mb-8">
        <div
          className={`relative h-64 w-full perspective cursor-pointer ${
            flipped ? "rotate-y-180" : ""
          }`}
          onClick={handleFlip}
        >
          <div
            className={`absolute inset-0 backface-hidden duration-500 ${
              flipped ? "rotate-y-180 opacity-0 pointer-events-none" : ""
            }`}
          >
            <Card className="h-full flex items-center justify-center bg-green-50 border-2 border-green-200">
              <CardContent className="text-center p-6">
                <h3 className="text-xl font-bold text-green-700 mb-2">Term</h3>
                <p className="text-2xl text-gray-800">{flashcards[currentIndex]?.front}</p>
              </CardContent>
            </Card>
          </div>
          <div
            className={`absolute inset-0 backface-hidden duration-500 ${
              flipped ? "" : "rotate-y-180 opacity-0 pointer-events-none"
            }`}
          >
            <Card className="h-full flex items-center justify-center bg-yellow-50 border-2 border-yellow-200">
              <CardContent className="text-center p-6">
                <h3 className="text-xl font-bold text-yellow-700 mb-2">Definition</h3>
                <p className="text-2xl text-gray-800">{flashcards[currentIndex]?.back}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center w-full max-w-lg">
        <Button
          onClick={handlePrevious}
          className="bg-green-600 hover:bg-green-700"
          aria-label="Previous Card"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        <div className="text-center">
          <span className="text-gray-600">
            {currentIndex + 1} of {flashcards.length}
          </span>
          <Button
            onClick={handleRestart}
            variant="ghost"
            size="sm"
            className="ml-2 text-gray-500"
            aria-label="Restart"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>

        <Button
          onClick={handleNext}
          className="bg-green-600 hover:bg-green-700"
          aria-label="Next Card"
        >
          Next
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

