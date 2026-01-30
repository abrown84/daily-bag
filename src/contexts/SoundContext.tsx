import React, { createContext, useContext, useState, useCallback, useRef, useEffect, memo } from 'react'

type SoundType = 'click' | 'success' | 'levelUp' | 'points' | 'bonus' | 'error' | 'woosh' | 'cashRegister'

interface SoundContextType {
  soundEnabled: boolean
  setSoundEnabled: (enabled: boolean) => void
  playSound: (type: SoundType) => void
  volume: number
  setVolume: (volume: number) => void
}

const SoundContext = createContext<SoundContextType | null>(null)

// Map sound types to audio file paths
const SOUND_FILES: Record<SoundType, string> = {
  click: '/sounds/click.mp3',
  success: '/sounds/success.mp3',
  levelUp: '/sounds/level-up.mp3',
  points: '/sounds/points.mp3',
  bonus: '/sounds/bonus.mp3',
  error: '/sounds/error.mp3',
  woosh: '/sounds/woosh.mp3',
  cashRegister: '/sounds/cash-register.mp3'
}

interface SoundProviderProps {
  children: React.ReactNode
}

export const SoundProvider = memo<SoundProviderProps>(({ children }) => {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    // Load preference from localStorage, default to false (off)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('soundEnabled')
      return saved === 'true'
    }
    return false
  })
  const [volume, setVolume] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('soundVolume')
      return saved ? parseFloat(saved) : 0.1
    }
    return 0.1
  })

  // Preloaded audio elements cache
  const audioCache = useRef<Map<SoundType, HTMLAudioElement>>(new Map())

  // Debounce tracking - prevent same sound from spamming
  const lastPlayedRef = useRef<Map<SoundType, number>>(new Map())
  const DEBOUNCE_MS = 150 // Minimum time between same sound

  // Preload all sounds on mount
  useEffect(() => {
    const entries = Object.entries(SOUND_FILES) as [SoundType, string][]
    entries.forEach(([type, path]) => {
      const audio = new Audio(path)
      audio.preload = 'auto'
      audioCache.current.set(type, audio)
    })

    // Cleanup on unmount
    return () => {
      audioCache.current.forEach(audio => {
        audio.pause()
        audio.src = ''
      })
      audioCache.current.clear()
    }
  }, [])

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('soundEnabled', String(soundEnabled))
  }, [soundEnabled])

  useEffect(() => {
    localStorage.setItem('soundVolume', String(volume))
  }, [volume])

  const playSound = useCallback((type: SoundType) => {
    if (!soundEnabled) return

    // Check debounce - prevent same sound from playing too quickly
    const now = Date.now()
    const lastPlayed = lastPlayedRef.current.get(type) || 0
    if (now - lastPlayed < DEBOUNCE_MS) return
    lastPlayedRef.current.set(type, now)

    try {
      const cachedAudio = audioCache.current.get(type)
      if (!cachedAudio) return

      // Clone the audio element to allow overlapping sounds
      const audio = cachedAudio.cloneNode(true) as HTMLAudioElement
      audio.volume = volume

      // Clean up after playback
      audio.onended = () => {
        audio.src = ''
      }

      audio.play().catch(error => {
        // Silently fail if audio isn't available (e.g., autoplay blocked)
        console.debug('Sound playback failed:', error)
      })
    } catch (error) {
      // Silently fail if audio isn't available
      console.debug('Sound playback failed:', error)
    }
  }, [soundEnabled, volume])

  const value: SoundContextType = {
    soundEnabled,
    setSoundEnabled,
    playSound,
    volume,
    setVolume
  }

  return (
    <SoundContext.Provider value={value}>
      {children}
    </SoundContext.Provider>
  )
})

SoundProvider.displayName = 'SoundProvider'

export function useSound() {
  const context = useContext(SoundContext)
  if (!context) {
    throw new Error('useSound must be used within a SoundProvider')
  }
  return context
}

// Simple hook for components that just need to play sounds
export function useSoundEffect() {
  const { playSound, soundEnabled } = useSound()
  return { playSound, soundEnabled }
}
