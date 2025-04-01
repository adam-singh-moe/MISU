"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { authApi } from "./api-new"
import { toast } from "sonner"

export interface User {
  id: string
  email: string
  name?: string
  role: "admin" | "student" | "teacher" | "user"
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  checkAuthStatus: () => Promise<void>
  register: (name: string, email: string, password: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check auth status for all routes to maintain user state
    if (typeof window !== 'undefined') {
      checkAuthStatus();
    }
  }, []);

  const checkAuthStatus = async () => {
    setIsLoading(true);
    // Only check auth status if there's a token in localStorage
    const token = authApi.getToken();
    if (!token) {
      console.log('No auth token found, skipping profile check');
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }
    
    try {
      console.log('Checking auth status with token:', token.substring(0, 10) + '...');
      
      // First, try to get admin profile
      let userData = null;
      
      try {
        userData = await authApi.getProfile();
      } catch (adminError) {
        console.log('Not an admin user, trying regular user profile');
        // If admin profile fails, try getting regular user profile
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3080/api"}/users/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            userData = await response.json();
          } else if (response.status === 401) {
            // Unauthorized - clear the token
            console.log('Token unauthorized, clearing from localStorage');
            localStorage.removeItem('auth_token');
            throw new Error('Invalid authentication token');
          }
        } catch (userError) {
          console.error('Error getting user profile:', userError);
        }
      }
      
      if (userData) {
        console.log('User authenticated:', userData);
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        console.log('No user data returned, clearing token');
        localStorage.removeItem('auth_token');
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Auth status check failed:", error);
      localStorage.removeItem('auth_token');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      console.log('Starting login process for:', email)
      
      // Determine if this is an admin login or student login based on the URL
      const isAdminLogin = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
      console.log('Login type:', isAdminLogin ? 'Admin Login' : 'Student Login');
      
      let success = false;
      
      if (isAdminLogin) {
        // Admin login flow
        try {
          success = await authApi.login(email, password);
        } catch (adminError) {
          console.error('Admin login failed:', adminError);
          toast.error("Admin login failed. Please check your credentials.");
          return false;
        }
      } else {
        // Student login flow - don't try admin login first
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3080/api"}/users/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });
          
          const data = await response.json();
          
          if (response.ok && data.token) {
            localStorage.setItem("auth_token", data.token);
            success = true;
          } else {
            console.error('Student login failed:', data);
            toast.error(data.message || "Login failed. Please check your credentials.");
            return false;
          }
        } catch (userError) {
          console.error('Student login error:', userError);
          toast.error("Login failed. Please try again.");
          return false;
        }
      }
      
      if (success) {
        console.log('Login successful, checking auth status')
        await checkAuthStatus()
        toast.success("Login successful")
        return true
      } else {
        console.error("Login failed - success was false")
        toast.error("Login failed. Please check your credentials and try again.")
        return false
      }
    } catch (error) {
      console.error("Login error in auth context:", error)
      toast.error("Login failed. Please try again.")
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      await authApi.logout()
      setUser(null)
      setIsAuthenticated(false)
      toast.success("Logged out successfully")
    } catch (error) {
      console.error("Logout error:", error)
      toast.error("Failed to logout properly")
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true)
    try {
      console.log('Starting registration process for:', email)
      
      // Check if the registration is happening from admin page
      const isAdminRegistration = typeof window !== 'undefined' && 
        window.location.pathname.startsWith('/admin');
      
      const endpoint = isAdminRegistration 
        ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3080/api"}/auth/register`
        : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3080/api"}/users/register`;
        
      // Call the register API
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role: isAdminRegistration ? 'admin' : 'user'
        }),
      });

      const data = await response.json();
      console.log('Registration response:', response.status, data)

      if (!response.ok) {
        toast.error(data.message || "Registration failed");
        return false;
      }

      if (data.token) {
        console.log('Token received, storing in localStorage')
        localStorage.setItem("auth_token", data.token);
        await checkAuthStatus();
        toast.success(data.message || "Registration successful");
        return true;
      } else {
        console.warn('No token received in registration response:', data)
        toast.warning(data.message || "Registration completed but automatic login failed. Please login manually.");
        return false;
      }
    } catch (error) {
      console.error("Registration error in auth context:", error);
      toast.error("Registration failed. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        logout,
        checkAuthStatus,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
} 