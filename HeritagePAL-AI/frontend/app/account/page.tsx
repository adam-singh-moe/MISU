"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function StudentAccount() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login, register, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If already authenticated, redirect to dashboard
    if (isAuthenticated && !authLoading) {
      router.push("/account/dashboard")
    }
  }, [isAuthenticated, authLoading, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!email || !password) {
        toast.error("Please enter both email and password")
        return
      }

      console.log("Attempting student login with:", email)
      // Use the same login function but specify the role is for students
      const success = await login(email, password)
      console.log("Login result:", success ? "Success" : "Failed")
      
      if (success) {
        router.push("/account/dashboard")
        toast.success("Welcome back! Your learning progress will now be saved.")
      } else {
        toast.error("Invalid credentials. Please try again.")
      }
    } catch (error) {
      console.error("Login error details:", error)
      toast.error("An error occurred during login. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!name || !email || !password || !confirmPassword) {
        toast.error("Please fill in all fields")
        return
      }

      if (password !== confirmPassword) {
        toast.error("Passwords do not match")
        return
      }

      console.log("Attempting student registration for:", email)
      
      // Here we'll call a different API endpoint for student registration
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3080/api"}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password
        }),
      });

      console.log("Registration response status:", response.status)
      const data = await response.json();
      console.log("Registration response data:", data)

      if (!response.ok) {
        toast.error(data.message || "Registration failed");
        return false;
      }

      if (data.token) {
        console.log("Registration successful, token received")
        // Store the token
        localStorage.setItem("auth_token", data.token);
        // Update auth context
        await register(name, email, password);
        toast.success("Registration successful! You can now track your learning progress.");
        router.push("/account/dashboard");
        return true;
      } else {
        console.warn("No token received in response")
        toast.warning("Registration completed but automatic login failed. Please login manually.");
        return false;
      }
    } catch (error) {
      console.error("Registration error details:", error);
      toast.error("Registration failed. Please try again.");
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-yellow-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (isAuthenticated) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-green-50 to-yellow-50">
      <div className="mb-8 text-center">
        <Image
          src="/logo.png"
          alt="HeritagePal Logo"
          width={200}
          height={80}
          className="mx-auto mb-4"
        />
        <h1 className="text-3xl font-bold text-green-700">Student Account</h1>
        <p className="text-gray-600">Create an account to save your progress</p>
      </div>

      <Card className="w-[380px] shadow-lg">
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <CardHeader>
              <CardTitle className="text-xl text-center text-green-700">Login</CardTitle>
              <CardDescription className="text-center">
                Login to track your learning progress
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Logging in...
                    </div>
                  ) : (
                    "Login"
                  )}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="register">
            <CardHeader>
              <CardTitle className="text-xl text-center text-green-700">Register</CardTitle>
              <CardDescription className="text-center">
                Create an account to save your progress
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleRegister}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-name">Your Name</Label>
                  <Input
                    id="reg-name"
                    type="text"
                    placeholder="Your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Creating account...
                    </div>
                  ) : (
                    "Register"
                  )}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
} 