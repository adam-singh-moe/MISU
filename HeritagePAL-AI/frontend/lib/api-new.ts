import axios from "axios"
import { toast } from "sonner";

// Configure axios instance
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3080/api",
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  // Set a default timeout
  timeout: 10000
})

// Add request interceptor for attaching auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Log request for debugging
    console.log('API Request:', config.method, config.url);
    return config
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error)
  }
)

// Response interceptor for handling token expiration
apiClient.interceptors.response.use(
  (response) => {
    // Log successful response for debugging
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  async (error) => {
    // Log error response for debugging
    console.error('Response error:', error.response?.status, error.config?.url, error.message);
    
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        // Try to refresh token
        const { data } = await axios.post(
          `${apiClient.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        )
        if (data.token) {
          localStorage.setItem("auth_token", data.token)
          apiClient.defaults.headers.common.Authorization = `Bearer ${data.token}`
          return apiClient(originalRequest)
        }
      } catch (refreshError) {
        // If refresh fails, redirect to login
        localStorage.removeItem("auth_token")
        if (typeof window !== "undefined") {
          window.location.href = "/admin"
        }
      }
    }
    return Promise.reject(error)
  }
)

// Auth types
export interface AuthToken {
  token: string
  expiresIn: number
}

export interface User {
  id: string
  email: string
  name?: string
  role: "admin" | "student" | "teacher" | "user"
}

// Content types
export interface Topic {
  id: string
  title: string
  description?: string
  gradeLevel?: number
  allGrades?: number[]
}

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: string
}

export interface Quiz {
  id: string
  title: string
  description: string
  topic: string
  questions: QuizQuestion[]
}

// Helper to handle API errors
const handleApiError = (error: any) => {
  const message = error.response?.data?.message || error.message || 'An error occurred';
  toast.error(message);
  return Promise.reject(error);
};

// Type for API response
export interface ApiResponse<T> {
  data: T;
  loading: boolean;
  error: Error | null;
}

// Helper function to get auth headers
const getAuthHeaders = (): Record<string, string> => {
  const token = authApi.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Auth API
export const authApi = {
  login: async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting login with:', email);
      console.log('API URL:', process.env.NEXT_PUBLIC_API_URL || "http://localhost:3080/api");
      
      const response = await apiClient.post("/auth/login", { email, password }, {
        timeout: 15000, // Increase timeout to 15 seconds
        timeoutErrorMessage: "Server request timed out - backend may be offline or unreachable"
      });
      
      console.log('Login response status:', response.status);
      
      if (response.data && response.data.token) {
        console.log('Login successful, token received');
        localStorage.setItem("auth_token", response.data.token);
        return true;
      } else {
        console.warn('Login response missing token:', response.data);
        return false;
      }
    } catch (error: any) {
      // Improved error logging
      console.error("Login error details:", {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        data: error.response?.data,
        isAxiosError: error.isAxiosError
      });
      
      // Check for network errors explicitly
      if (error.message === "Network Error" || !error.response) {
        console.error("Network error - Backend server may be offline or unreachable");
        toast.error("Cannot connect to server. Please check if the backend is running.");
      } else if (error.response?.status === 401) {
        toast.error("Invalid credentials. Please check your email and password.");
      } else {
        toast.error(error.response?.data?.message || "Login failed. Please try again.");
      }
      
      return false;
    }
  },

  loginStudent: async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting student login with:', email);
      
      const response = await apiClient.post("/users/login", { email, password }, {
        timeout: 15000,
        timeoutErrorMessage: "Server request timed out - backend may be offline or unreachable"
      });
      
      console.log('Student login response status:', response.status);
      
      if (response.data && response.data.token) {
        console.log('Student login successful, token received');
        localStorage.setItem("auth_token", response.data.token);
        return true;
      } else {
        console.warn('Student login response missing token:', response.data);
        return false;
      }
    } catch (error: any) {
      console.error("Student login error details:", {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        data: error.response?.data,
        isAxiosError: error.isAxiosError
      });
      
      if (error.message === "Network Error" || !error.response) {
        toast.error("Cannot connect to server. Please check if the backend is running.");
      } else if (error.response?.status === 401) {
        toast.error("Invalid credentials. Please check your email and password.");
      } else {
        toast.error(error.response?.data?.message || "Login failed. Please try again.");
      }
      
      return false;
    }
  },

  registerStudent: async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting student registration for:', email);
      
      const response = await apiClient.post("/users/register", { 
        name, 
        email, 
        password 
      }, {
        timeout: 15000
      });
      
      console.log('Student registration response status:', response.status);
      
      if (response.data && response.data.token) {
        console.log('Student registration successful, token received');
        localStorage.setItem("auth_token", response.data.token);
        return true;
      } else {
        console.warn('Student registration response missing token:', response.data);
        return false;
      }
    } catch (error: any) {
      console.error("Student registration error details:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Registration failed. Please try again.");
      }
      return false;
    }
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post("/auth/logout")
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      localStorage.removeItem("auth_token")
    }
  },

  getProfile: async (): Promise<User | null> => {
    try {
      console.log('Attempting to get profile...');
      const token = localStorage.getItem("auth_token");
      
      if (!token) {
        console.log('No auth token found, skipping profile request');
        return null;
      }
      
      const response = await apiClient.get("/auth/profile", {
        timeout: 10000, // 10 second timeout
        timeoutErrorMessage: "Server request timed out - backend may be offline",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Profile response status:', response.status);
      return response.data.user || response.data;
    } catch (error: any) {
      console.error("Get profile error:", error.message);
      
      // Check if it's a network error
      if (error.message === "Network Error") {
        console.error("Network error - Backend server may be offline or unreachable");
        toast.error("Cannot connect to server. Please check if the backend is running.");
      } else if (error.response?.status === 401) {
        console.log('Unauthorized - clearing token');
        localStorage.removeItem("auth_token");
      }
      
      return null;
    }
  },

  isAuthenticated: (): boolean => {
    const token = localStorage.getItem("auth_token");
    return !!token;
  },

  getToken: (): string | null => {
    return localStorage.getItem("auth_token");
  },
  
  validateToken: async (): Promise<boolean> => {
    const token = localStorage.getItem("auth_token");
    if (!token) return false;
    
    try {
      const response = await apiClient.get("/auth/profile");
      return response.status === 200;
    } catch (error) {
      console.error("Token validation error:", error);
      return false;
    }
  }
};

// Content API
export const contentApi = {
  // Get topics for filtering content
  getTopics: async (): Promise<Topic[]> => {
    try {
      const response = await apiClient.get("/content/topics")
      // Backend returns an array of topic objects with id and title
      const topicsData = response.data || [];
      
      // Map to the expected format if needed
      return topicsData.map((topic: any) => ({
        id: topic.id || '',
        title: topic.title || topic.name || '', // Handle both title and name properties
        description: topic.description || '',
        gradeLevel: topic.gradeLevel || 0,
        allGrades: topic.allGrades || []
      }));
    } catch (error) {
      console.error("Error fetching topics:", error)
      return []
    }
  },

  // Get quizzes for a specific topic
  getQuizzesByTopic: async (topicId: string): Promise<Quiz[]> => {
    try {
      const response = await apiClient.get(`/content/quizzes?topic=${topicId}`)
      return response.data.quizzes
    } catch (error) {
      console.error("Error fetching quizzes:", error)
      return []
    }
  },
  
  // Get a specific quiz with questions
  getQuiz: async (quizId: string): Promise<Quiz | null> => {
    try {
      const response = await apiClient.get(`/content/quizzes/${quizId}`)
      return response.data.quiz
    } catch (error) {
      console.error("Error fetching quiz:", error)
      return null
    }
  },

  // Generate content on-the-fly (quiz, flashcards, educational content) for a topic
  generateContent: async (topicId: string, grade: number) => {
    try {
      const response = await fetch(`${apiClient.defaults.baseURL}/content/generate?topic_id=${topicId}&grade=${grade}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate content');
      }
      return await response.json();
    } catch (error) {
      console.error("Error generating content:", error);
      return handleApiError(error);
    }
  },

  // Submit chat message
  sendChatMessage: async (message: string): Promise<{message: string}> => {
    try {
      const response = await apiClient.post("/chat", { message })
      return response.data
    } catch (error) {
      console.error("Error sending chat message:", error)
      throw error
    }
  },

  // Methods merged from second declaration
  getTopicContent: async (topic: string, grade?: number) => {
    try {
      const gradeParam = grade ? `?grade=${grade}` : '';
      const response = await fetch(`${apiClient.defaults.baseURL}/content/topic/${topic}${gradeParam}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch content');
      }
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  getContentByGrade: async (grade: number) => {
    try {
      const response = await fetch(`${apiClient.defaults.baseURL}/content/grade/${grade}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch content');
      }
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  generateTopicSummary: async (topic: string, grade: number) => {
    try {
      const response = await fetch(`${apiClient.defaults.baseURL}/content/summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic, grade }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate summary');
      }
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  searchContent: async (query: string, grade?: number) => {
    try {
      const gradeParam = grade ? `&grade=${grade}` : '';
      const response = await fetch(`${apiClient.defaults.baseURL}/content/search?query=${query}${gradeParam}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Search failed');
      }
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  }
}

// Admin API
export const adminApi = {
  // Get all content items
  getAllContent: async () => {
    try {
      const response = await apiClient.get("/admin/content")
      return response.data.content
    } catch (error) {
      console.error("Error fetching content:", error)
      return []
    }
  },

  // Upload content file
  uploadContent: async (formData: FormData) => {
    try {
      const response = await apiClient.post("/admin/content/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      return response.data
    } catch (error) {
      console.error("Error uploading content:", error)
      throw error
    }
  },

  // Generate quiz from content
  generateQuiz: async (contentId: string, params: { topic: string, difficulty: string, questionCount: number }) => {
    try {
      const response = await apiClient.post(`/admin/quizzes/generate`, {
        contentId,
        ...params
      })
      return response.data
    } catch (error) {
      console.error("Error generating quiz:", error)
      throw error
    }
  },

  // Methods merged from second declaration
  getContentById: async (id: string) => {
    try {
      const response = await fetch(`${apiClient.defaults.baseURL}/admin/content/${id}`, {
        headers: {
          ...getAuthHeaders(),
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch content');
      }
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  updateContent: async (id: string, data: any) => {
    try {
      const response = await fetch(`${apiClient.defaults.baseURL}/admin/content/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update content');
      }
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  deleteContent: async (id: string) => {
    try {
      const response = await fetch(`${apiClient.defaults.baseURL}/admin/content/${id}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete content');
      }
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  }
}

// Chat APIs
export const chatApi = {
  sendMessage: async (message: string, sessionId?: string, grade?: number) => {
    try {
      const response = await fetch(`${apiClient.defaults.baseURL}/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, sessionId, grade }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send message');
      }
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  getChatHistory: async (sessionId: string) => {
    try {
      const response = await fetch(`${apiClient.defaults.baseURL}/chat/history/${sessionId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch chat history');
      }
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  getOrCreateSessionId: (): string => {
    if (typeof window !== 'undefined') {
      let sessionId = localStorage.getItem('chat_session_id');
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem('chat_session_id', sessionId);
      }
      return sessionId;
    }
    return crypto.randomUUID();
  },
};

// Quiz APIs
export const quizApi = {
  getAllQuizzes: async (grade?: number, topic?: string, difficulty?: string) => {
    try {
      let url = `${apiClient.defaults.baseURL}/quizzes`;
      const params = new URLSearchParams();
      if (grade) params.append('grade', grade.toString());
      if (topic) params.append('topic', topic);
      if (difficulty) params.append('difficulty', difficulty);
      
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch quizzes');
      }
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  getQuizById: async (id: string) => {
    try {
      const response = await fetch(`${apiClient.defaults.baseURL}/quizzes/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch quiz');
      }
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  generatePracticeExam: async (grade: number, topics?: string[], questionCount?: number) => {
    try {
      const response = await fetch(`${apiClient.defaults.baseURL}/quizzes/practice-exam`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ grade, topics, questionCount }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate practice exam');
      }
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  submitQuizAnswers: async (id: string, answers: number[]) => {
    try {
      const sessionId = chatApi.getOrCreateSessionId(); // Reuse session ID for tracking
      const response = await fetch(`${apiClient.defaults.baseURL}/quizzes/${id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers, sessionId }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit quiz answers');
      }
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  getQuizTopics: async () => {
    try {
      const response = await fetch(`${apiClient.defaults.baseURL}/quizzes/topics`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch quiz topics');
      }
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// Flashcard APIs
export const flashcardApi = {
  getFlashcards: async (grade?: number, topic?: string) => {
    try {
      let url = `${apiClient.defaults.baseURL}/flashcards`;
      const params = new URLSearchParams();
      if (grade) params.append('grade', grade.toString());
      if (topic) params.append('topic', topic);
      
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch flashcards');
      }
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  getFlashcardSets: async (grade?: number, topic?: string) => {
    try {
      let url = `${apiClient.defaults.baseURL}/flashcards/sets`;
      const params = new URLSearchParams();
      if (grade) params.append('grade', grade.toString());
      if (topic) params.append('topic', topic);
      
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch flashcard sets');
      }
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  getFlashcardSetById: async (id: string) => {
    try {
      const response = await fetch(`${apiClient.defaults.baseURL}/flashcards/set/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch flashcard set');
      }
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  generateFlashcards: async (grade: number, topic: string, count?: number) => {
    try {
      const response = await fetch(`${apiClient.defaults.baseURL}/flashcards/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ grade, topic, count }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate flashcards');
      }
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  getFlashcardTopics: async () => {
    try {
      const response = await fetch(`${apiClient.defaults.baseURL}/flashcards/topics`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch flashcard topics');
      }
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },
}; 