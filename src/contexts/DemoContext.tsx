import React, { createContext, useContext, useState, ReactNode } from 'react'
import { useConvexAuth } from 'convex/react'
import { Chore } from '../types/chore'
import { User, UserStats } from '../types/user'
import { convexDefaultChores } from '../utils/convexDefaultChores'
import { LEVELS } from '../types/chore'

interface DemoContextType {
  isDemoMode: boolean
  enterDemoMode: () => void
  exitDemoMode: () => void
  getDemoChores: () => Chore[]
  getDemoUsers: () => User[]
  getDemoStats: () => UserStats[]
}

const DemoContext = createContext<DemoContextType | undefined>(undefined)

export const useDemo = () => {
  const context = useContext(DemoContext)
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider')
  }
  return context
}

interface DemoProviderProps {
  children: ReactNode
}

export const DemoProvider: React.FC<DemoProviderProps> = ({ children }) => {
  const { isAuthenticated } = useConvexAuth()
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [demoStats, setDemoStats] = useState<UserStats[]>([])
  const [demoChores, setDemoChores] = useState<Chore[]>([])

  // Exit demo mode when user becomes authenticated
  React.useEffect(() => {
    if (isAuthenticated && isDemoMode) {
      // Clear demo mode without page reload since user is now authenticated
      localStorage.removeItem('demoMode')
      localStorage.removeItem('demoChores')
      setIsDemoMode(false)
      setDemoStats([])
      setDemoChores([])
    }
  }, [isAuthenticated, isDemoMode])

  const enterDemoMode = () => {
    try {
      // Generate demo data once and store it
      const generatedChores = getDemoChores()
      const generatedStats = getDemoStatsFromChores(generatedChores)
      
      setDemoChores(generatedChores)
      setDemoStats(generatedStats)
      
      setIsDemoMode(true)
      // Store demo mode flag in localStorage so it persists across page refreshes
      // Note: Demo mode is a UI state only - it doesn't affect Convex Auth or real data
      try {
        localStorage.setItem('demoMode', 'true')
      } catch {
        // localStorage not available, demo mode still works in memory
      }
    } catch (error) {
      console.error('Error entering demo mode:', error)
      // If demo data generation fails, still set demo mode in state
      setIsDemoMode(true)
    }
  }

  const exitDemoMode = () => {
    try {
      // Clear all demo-specific localStorage data when exiting
      localStorage.removeItem('demoMode')
      localStorage.removeItem('demoChores')
      localStorage.removeItem('chores')
      localStorage.removeItem('userStats')
      localStorage.removeItem('levelPersistence')
      
      // Reset state synchronously
      setIsDemoMode(false)
      setDemoStats([])
      setDemoChores([])
      
      // Clear hash if present
      if (window.location.hash) {
        history.replaceState(null, '', window.location.pathname)
      }
      
      // Reload the page to ensure clean state
      // Using a small delay to ensure localStorage operations complete
      setTimeout(() => {
        window.location.reload()
      }, 0)
    } catch (error) {
      console.error('Error exiting demo mode:', error)
      // If localStorage fails, still exit demo mode in state and refresh
      setIsDemoMode(false)
      setDemoStats([])
      setDemoChores([])
      if (window.location.hash) {
        history.replaceState(null, '', window.location.pathname)
      }
      setTimeout(() => {
        window.location.reload()
      }, 0)
    }
  }

  // Helper function to calculate demo stats from existing chores
  const getDemoStatsFromChores = (chores: Chore[]): UserStats[] => {
    try {
      const demoUsers = getDemoUsers()
      

      
      return demoUsers.map(user => {
        // Get chores for this user
        const userChores = chores.filter(chore => 
          chore.assignedTo === user.id || chore.completedBy === user.id
        )
        const completedChores = userChores.filter(chore => chore.completed)
        
        // Calculate points - use finalPoints if available, otherwise fall back to base points
        const earnedPoints = completedChores.reduce((sum, chore) => {
          // For demo mode, always use finalPoints if available (includes bonus points)
          const pointsToAdd = chore.finalPoints !== undefined ? chore.finalPoints : chore.points
          return sum + pointsToAdd
        }, 0)
        
        // Calculate level based on points
        let currentLevel = 1
        for (let i = LEVELS.length - 1; i >= 0; i--) {
          if (earnedPoints >= LEVELS[i].pointsRequired) {
            currentLevel = LEVELS[i].level
            break
          }
        }
        
        // Calculate level progress
        const currentLevelData = LEVELS.find(level => level.level === currentLevel)
        const nextLevelData = LEVELS.find(level => level.level === currentLevel + 1)
        
        const currentLevelPoints = Math.max(0, earnedPoints - (currentLevelData?.pointsRequired || 0))
        const pointsToNextLevel = nextLevelData 
          ? Math.max(0, nextLevelData.pointsRequired - earnedPoints)
          : 0
        
        // Calculate streaks (simplified for demo)
        const completedDates = completedChores
          .filter(chore => chore.completedAt)
          .map(chore => new Date(chore.completedAt!).setHours(0, 0, 0, 0))
          .sort((a, b) => b - a)
        
        let currentStreak = 0
        let longestStreak = 0
        if (completedDates.length > 0) {
          const today = new Date().setHours(0, 0, 0, 0)
          let tempStreak = 0
          for (let i = 0; i < completedDates.length; i++) {
            if (completedDates[i] === today - (tempStreak * 24 * 60 * 60 * 1000)) {
              tempStreak++
            } else {
              break
            }
          }
          currentStreak = tempStreak
          longestStreak = Math.max(longestStreak, tempStreak)
        }
        
        const stats: UserStats = {
          userId: user.id,
          userName: user.name,
          totalChores: userChores.length,
          completedChores: completedChores.length,
          totalPoints: userChores.reduce((sum, c) => sum + (c.finalPoints || c.points), 0), // Use finalPoints for total
          lifetimePoints: earnedPoints, // In demo mode, lifetime equals earned since no redemptions
          earnedPoints,
          currentStreak,
          longestStreak,
          currentLevel,
          currentLevelPoints,
          pointsToNextLevel,
          lastActive: new Date(),
          efficiencyScore: completedChores.length > 0 ? (completedChores.length / userChores.length) * 100 : 0
        }
        

        
        return stats
      })
    } catch (error) {
      console.error('Error calculating demo stats from chores:', error)
      return []
    }
  }

  const getDemoChores = (): Chore[] => {
    // Return stored demo chores if available in state
    if (demoChores.length > 0) {
      return demoChores
    }

    // Try to restore from localStorage first (preserves completed chores and points)
    try {
      const savedChores = localStorage.getItem('demoChores')
      if (savedChores) {
        const parsedChores = JSON.parse(savedChores)
        // Restore dates properly
        const restoredChores = parsedChores.map((chore: any) => ({
          ...chore,
          createdAt: chore.createdAt ? new Date(chore.createdAt) : new Date(),
          dueDate: chore.dueDate ? new Date(chore.dueDate) : undefined,
          completedAt: chore.completedAt ? new Date(chore.completedAt) : undefined,
        }))
        setDemoChores(restoredChores)
        return restoredChores
      }
    } catch (error) {
      console.error('Error restoring demo chores from localStorage:', error)
    }

    try {

      
      // Create demo chores - start fresh with no completed chores (0 points)
      // Use convexDefaultChores to match what users see when signed in
      const now = new Date()
      const generatedChores = convexDefaultChores.map((chore, index) => {
        // Start with all chores incomplete so users begin with 0 points
        const isCompleted = false
        const createdAt = new Date(now.getTime() - (Math.random() * 7 * 24 * 60 * 60 * 1000)) // Random date within last week
        // Use the dueDate from the chore (already calculated based on category)
        const dueDate = chore.dueDate || new Date(now.getTime() + 24 * 60 * 60 * 1000) // Fallback to tomorrow
        
        // No finalPoints for incomplete chores
        const finalPoints = undefined
        
        return {
          ...chore,
          id: `demo-${index + 1}`,
          createdAt,
          dueDate,
          completed: isCompleted,
          completedAt: undefined,
          completedBy: undefined,
          finalPoints: finalPoints,
          bonusMessage: undefined,
          assignedTo: Math.random() > 0.5 ? 'demo-alex' : 'demo-janice'
        }
      })



      

      
      return generatedChores
    } catch (error) {
      console.error('Error generating demo chores:', error)
      console.error('Error details:', error instanceof Error ? error.message : error)
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      
      // Fallback to basic chores if demo generation fails
      try {
        const fallbackChores = convexDefaultChores.map((chore, index) => ({
          ...chore,
          id: `demo-${index + 1}`,
          createdAt: new Date(),
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Due tomorrow
          completed: false,
          finalPoints: chore.points, // Ensure fallback chores also have finalPoints
          assignedTo: 'demo-alex'
        }))

        return fallbackChores
      } catch (fallbackError) {
        console.error('Fallback demo chores also failed:', fallbackError)
        // Return empty array as last resort
        return []
      }
    }
  }

  const getDemoUsers = (): User[] => {
    return [
      {
        id: 'demo-alex',
        name: 'Alex',
        email: 'alex@demo.com',
        role: 'admin',
        joinedAt: new Date('2024-01-01'),
        avatar: '👨‍💼',
        isActive: true
      },
      {
        id: 'demo-janice',
        name: 'Janice',
        email: 'janice@demo.com',
        role: 'member',
        joinedAt: new Date('2024-01-15'),
        avatar: '👩‍💼',
        isActive: true
      },
      {
        id: 'demo-jordan',
        name: 'Jordan',
        email: 'jordan@demo.com',
        role: 'member',
        joinedAt: new Date('2024-02-01'),
        avatar: '👨‍🎓',
        isActive: true
      },
      {
        id: 'demo-avery',
        name: 'Avery',
        email: 'avery@demo.com',
        role: 'member',
        joinedAt: new Date('2024-02-15'),
        avatar: '👩‍🎨',
        isActive: true
      }
    ]
  }

  // Return stored demo stats instead of recalculating
  const getDemoStats = (): UserStats[] => {
    if (demoStats.length > 0) {

      return demoStats
    } else {

      const newStats = getDemoStatsFromChores(getDemoChores())
      setDemoStats(newStats)
      return newStats
    }
  }

  // Check for demo mode on mount and restore data if needed
  // But don't restore if user is authenticated
  React.useEffect(() => {
    // If authenticated, don't restore demo mode
    if (isAuthenticated) {
      // Clear any stale demo mode from localStorage
      localStorage.removeItem('demoMode')
      return
    }

    try {
      const storedDemoMode = localStorage.getItem('demoMode')

      if (storedDemoMode === 'true') {
        setIsDemoMode(true)

        // Restore demo data - getDemoChores will try localStorage first
        if (demoChores.length === 0) {
          const restoredChores = getDemoChores()
          const restoredStats = getDemoStatsFromChores(restoredChores)
          setDemoChores(restoredChores)
          setDemoStats(restoredStats)
        }
      }
    } catch (error) {
      console.error('Error checking localStorage for demo mode:', error)
      // If localStorage is not available, default to false
      setIsDemoMode(false)
    }
  }, [demoChores.length, isAuthenticated])

  const value: DemoContextType = {
    isDemoMode,
    enterDemoMode,
    exitDemoMode,
    getDemoChores,
    getDemoUsers,
    getDemoStats
  }

  return (
    <DemoContext.Provider value={value}>
      {children}
    </DemoContext.Provider>
  )
}
