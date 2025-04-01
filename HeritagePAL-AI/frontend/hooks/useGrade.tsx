"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';

// Define Grade type
export type Grade = {
  id: string;
  level: number;
  name: string;
  description?: string;
};

export function useGrade() {
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [userGrades, setUserGrades] = useState<Grade[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [forceUpdateCounter, setForceUpdateCounter] = useState<number>(0);
  const { user, isAuthenticated } = useAuth();

  // Force a re-render of components using this hook
  const forceUpdate = useCallback(() => {
    setForceUpdateCounter(prev => prev + 1);
  }, []);

  // Load grades from API and/or localStorage on mount
  useEffect(() => {
    const loadGrades = async () => {
      setIsLoading(true);
      
      try {
        // Try to get stored grade ID first
        const storedGradeId = localStorage.getItem('selectedGradeId');
        // For anonymous users, we also store the grade level directly
        const storedGradeLevel = localStorage.getItem('selectedGradeLevel');
        
        // Always fetch all available grades for both authenticated and anonymous users
        const allGradesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3080/api"}/grades`);
        if (allGradesResponse.ok) {
          const allGrades = await allGradesResponse.json();
          setUserGrades(allGrades);
          
          // If we have a stored grade ID, try to find that grade
          if (storedGradeId) {
            const foundGrade = allGrades.find(g => g.id === storedGradeId);
            if (foundGrade) {
              setSelectedGrade(foundGrade);
            }
          } 
          // Fall back to level for anonymous users
          else if (storedGradeLevel && !isAuthenticated) {
            const level = parseInt(storedGradeLevel, 10);
            const foundGrade = allGrades.find(g => g.level === level);
            if (foundGrade) {
              setSelectedGrade(foundGrade);
              localStorage.setItem('selectedGradeId', foundGrade.id);
            }
          }
        }
        
        // If user is authenticated, get their assigned grades
        if (isAuthenticated && user) {
          // Fetch user's grades from API
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3080/api"}/users/${user.id}/grades`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
          });
          
          if (response.ok) {
            const userAssignedGrades = await response.json();
            // If user has specific assigned grades, use those instead of all grades
            if (userAssignedGrades.length > 0) {
              setUserGrades(userAssignedGrades);
              
              // If we have a stored grade ID, try to find that grade
              if (storedGradeId) {
                const foundGrade = userAssignedGrades.find(g => g.id === storedGradeId);
                if (foundGrade) {
                  setSelectedGrade(foundGrade);
                } else {
                  // If stored grade not found, select the first available grade
                  setSelectedGrade(userAssignedGrades[0]);
                  localStorage.setItem('selectedGradeId', userAssignedGrades[0].id);
                }
              } else if (userAssignedGrades.length > 0) {
                // No stored grade, select the first available
                setSelectedGrade(userAssignedGrades[0]);
                localStorage.setItem('selectedGradeId', userAssignedGrades[0].id);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading grades:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadGrades();
  }, [isAuthenticated, user, forceUpdateCounter]);

  // Update selected grade - accepts either a Grade object or a simple number
  const updateGrade = useCallback((gradeInput: Grade | number | null): void => {
    if (gradeInput === null) {
      setSelectedGrade(null);
      localStorage.removeItem('selectedGradeId');
      localStorage.removeItem('selectedGradeLevel');
      forceUpdate();
      return;
    }
    
    // Handle number input (grade level) for anonymous users
    if (typeof gradeInput === 'number') {
      // Try to find the grade by level
      const foundGrade = userGrades.find(g => g.level === gradeInput);
      if (foundGrade) {
        setSelectedGrade(foundGrade);
        localStorage.setItem('selectedGradeId', foundGrade.id);
        localStorage.setItem('selectedGradeLevel', gradeInput.toString());
      } else {
        // If we couldn't find the grade, just store the level
        localStorage.setItem('selectedGradeLevel', gradeInput.toString());
      }
      forceUpdate();
      return;
    }
    
    // Handle Grade object
    setSelectedGrade(gradeInput);
    localStorage.setItem('selectedGradeId', gradeInput.id);
    localStorage.setItem('selectedGradeLevel', gradeInput.level.toString());
    forceUpdate();
  }, [userGrades, forceUpdate]);

  // Helper getter that returns just the grade level number for easier component use
  const grade = selectedGrade ? selectedGrade.level : null;

  return { 
    selectedGrade, 
    grade,
    userGrades, 
    isLoading, 
    updateGrade,
    forceUpdate
  };
} 