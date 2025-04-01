"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { HeritagePalMascot } from "@/components/heritage-pal-mascot"
import { Menu, X, User } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export function MainNavigation() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { isAuthenticated, user } = useAuth()

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Learn", path: "/learn" },
    { name: "Flashcards", path: "/flashcards" },
    { name: "Quizzes", path: "/quizzes" },
    { name: "Chat", path: "/chat" },
  ]

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <HeritagePalMascot size="small" />
            <span className="font-bold text-xl text-green-700">
              Heritage<span className="text-yellow-500">Pal</span>
            </span>
          </Link>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex space-x-1 items-center">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                className={`rounded-full px-4 ${
                  pathname === item.path
                    ? "bg-green-100 text-green-700 font-medium"
                    : "text-gray-700 hover:bg-green-50 hover:text-green-700"
                }`}
                asChild
              >
                <Link href={item.path}>{item.name}</Link>
              </Button>
            ))}
            
            {/* Account button */}
            <Button
              variant="ghost"
              className={`rounded-full px-4 ml-2 ${
                pathname === "/account"
                  ? "bg-green-100 text-green-700 font-medium"
                  : "text-gray-700 hover:bg-green-50 hover:text-green-700"
              }`}
              asChild
            >
              <Link href="/account" className="flex items-center gap-1">
                <User size={18} />
                {isAuthenticated ? (
                  <span className="max-w-[100px] truncate">{user?.name || 'Account'}</span>
                ) : (
                  'Login'
                )}
              </Link>
            </Button>
          </div>
        </div>

        {/* Mobile navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  variant="ghost"
                  className={`justify-start ${
                    pathname === item.path ? "bg-green-100 text-green-700 font-medium" : "text-gray-700"
                  }`}
                  asChild
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Link href={item.path}>{item.name}</Link>
                </Button>
              ))}
              
              {/* Mobile Account button */}
              <Button
                variant="ghost"
                className={`justify-start ${
                  pathname === "/account" ? "bg-green-100 text-green-700 font-medium" : "text-gray-700"
                }`}
                asChild
                onClick={() => setIsMenuOpen(false)}
              >
                <Link href="/account" className="flex items-center gap-1">
                  <User size={18} />
                  {isAuthenticated ? (
                    <span className="max-w-[140px] truncate">{user?.name || 'Account'}</span>
                  ) : (
                    'Login'
                  )}
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

