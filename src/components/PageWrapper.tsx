import React, { useRef, useEffect, useState } from 'react'
import { animate } from 'animejs'
import { SpeakerHigh, SpeakerSlash } from '@phosphor-icons/react'

interface PageWrapperProps {
  children: React.ReactNode
  className?: string
  title?: string
  description?: string
  showBackground?: boolean
  backgroundImage?: string
  backgroundOpacity?: number
  backgroundAudio?: string
  audioVolume?: number
}

export const PageWrapper: React.FC<PageWrapperProps> = ({
  children,
  className = '',
  title,
  description,
  showBackground = true,
  backgroundImage,
  backgroundOpacity = 0.3,
  backgroundAudio,
  audioVolume = 0.3
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isMuted, setIsMuted] = useState(() => {
    // Load mute preference from localStorage, default to muted
    try {
      const saved = localStorage.getItem('backgroundAudioMuted')
      // Default to muted (true) unless user explicitly enabled audio ('false')
      return saved !== 'false'
    } catch {
      return true
    }
  })

  // Toggle mute state
  const toggleMute = () => {
    const newMutedState = !isMuted
    setIsMuted(newMutedState)
    
    // Save preference to localStorage
    try {
      localStorage.setItem('backgroundAudioMuted', String(newMutedState))
    } catch (error) {
      console.warn('Failed to save mute preference:', error)
    }
    
    // Update audio playback using muted property and pause/play
    if (audioRef.current) {
      const audio = audioRef.current
      audio.muted = newMutedState
      
      if (newMutedState) {
        // Mute: pause the audio
        audio.pause()
        import.meta.env.DEV && console.log('🔇 Audio muted')
      } else {
        // Unmute: try to play the audio
        if (audio.readyState >= 2) {
          audio.play().then(() => {
            import.meta.env.DEV && console.log('🔊 Audio unmuted and playing')
          }).catch((err) => {
            import.meta.env.DEV && console.log('Audio play failed after unmute:', err)
          })
        } else {
          import.meta.env.DEV && console.log('Audio not ready yet, readyState:', audio.readyState)
        }
      }
    }
  }

  useEffect(() => {
    if (backgroundAudio && audioRef.current) {
      const audio = audioRef.current
      audio.volume = audioVolume
      audio.loop = true
      audio.muted = isMuted // Set initial mute state
      
      // Handle audio loading success
      const handleCanPlay = () => {
        // Audio loaded successfully - no need to log
        // Try to play if not muted and audio is ready
        if (!isMuted && audio.readyState >= 2) {
          audio.play().catch((error) => {
            // Only log if it's not a NotAllowedError (which is expected for autoplay)
            if (error.name !== 'NotAllowedError') {
              console.warn('Background audio autoplay prevented:', error.name)
            }
          })
        }
      }
      
      // Handle audio loading errors (e.g., file not found)
      const handleError = () => {
        const error = audio.error
        if (error) {
          // Only log actual errors, not expected autoplay prevention
          // Error codes: 1=MEDIA_ERR_ABORTED, 2=MEDIA_ERR_NETWORK, 3=MEDIA_ERR_DECODE, 4=MEDIA_ERR_SRC_NOT_SUPPORTED
          // Only log decode/format errors in DEV mode
          if (import.meta.env.DEV && error.code !== 1 && error.code !== 2) {
            console.log('Background audio error:', {
              code: error.code,
              message: error.message
            })
          }
        }
      }
      
      audio.addEventListener('canplay', handleCanPlay)
      audio.addEventListener('canplaythrough', handleCanPlay)
      audio.addEventListener('error', handleError)
      
      // Only try to play if not muted
      if (!isMuted) {
        // Try to play audio (may require user interaction due to browser autoplay policies)
        audio.play().then(() => {
          // Audio started playing - no need to log
        }).catch((error) => {
          // Autoplay was prevented - this is normal for background audio
          // Audio will play after user interaction
          // Only log if it's not a NotAllowedError (which is expected)
          if (error.name !== 'NotAllowedError') {
            console.warn('Background audio autoplay prevented:', error.name)
          }
        })

        // Handle user interaction to start audio
        const handleUserInteraction = (_event?: Event) => {
          try {
            if (audio && audio.readyState >= 2 && !isMuted) { // HAVE_CURRENT_DATA or higher
              audio.muted = false
              audio.play().then(() => {
                // Audio started after user interaction - no need to log
              }).catch((err) => {
                // Only log actual errors, not expected autoplay prevention
                if (err.name !== 'NotAllowedError') {
                  console.error('Audio play failed after user interaction:', err)
                }
              })
            } else {
              import.meta.env.DEV && console.log('Audio not ready yet, readyState:', audio?.readyState)
            }
          } catch (error) {
            console.error('Error in handleUserInteraction:', error)
          }
        }

        // Use { once: true } so listeners auto-remove after first interaction
        document.addEventListener('click', handleUserInteraction, { once: true })
        document.addEventListener('touchstart', handleUserInteraction, { once: true })
        document.addEventListener('keydown', handleUserInteraction, { once: true })
      }

      return () => {
        audio.pause()
        audio.removeEventListener('canplay', handleCanPlay)
        audio.removeEventListener('canplaythrough', handleCanPlay)
        audio.removeEventListener('error', handleError)
        // Note: Event listeners with { once: true } auto-remove, but we clean up just in case
      }
    }
  }, [backgroundAudio, audioVolume, isMuted])
  
  // Update audio playback when mute state changes
  useEffect(() => {
    if (audioRef.current && backgroundAudio) {
      const audio = audioRef.current
      audio.muted = isMuted

      if (isMuted) {
        // Mute: pause the audio
        audio.pause()
        import.meta.env.DEV && console.log('🔇 Audio muted via effect')
      } else {
        // Unmute: try to play the audio if ready
        if (audio.readyState >= 2) {
          audio.play().catch((err) => {
            import.meta.env.DEV && console.log('Audio play failed in effect:', err)
          })
          import.meta.env.DEV && console.log('🔊 Audio unmuted via effect')
        }
      }
    }
  }, [isMuted, backgroundAudio])

  // Refs for staggered content animation
  const contentRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)

  // Original entrance animation - smooth reveal with subtle depth
  useEffect(() => {
    if (contentRef.current) {
      // Main content slides up with a soft blur-in
      animate(contentRef.current, {
        opacity: [0, 1],
        translateY: [30, 0],
        filter: ['blur(8px)', 'blur(0px)'],
        duration: 500,
        ease: 'outQuart',
      })
    }

    // Staggered header animation if present
    if (headerRef.current && (title || description)) {
      const headerElements = headerRef.current.querySelectorAll('h1, p')
      if (headerElements.length > 0) {
        animate(headerElements, {
          opacity: [0, 1],
          translateY: [15, 0],
          duration: 400,
          delay: (_el: unknown, i: number) => 150 + i * 80,
          ease: 'outCubic',
        })
      }
    }
  }, [title, description])

  return (
    <div className={`min-h-full ${className}`}>
      {/* Background Audio */}
      {backgroundAudio && (
        <audio
          ref={audioRef}
          src={backgroundAudio}
          preload="auto"
          loop
          muted={isMuted}
          className="hidden"
        />
      )}

      {/* Optional Background */}
      {showBackground && (
        <div className="pointer-events-none fixed inset-0 -z-10">
          {backgroundImage ? (
            <>
              {backgroundImage.endsWith('.mp4') || backgroundImage.endsWith('.webm') ? (
                <video
                  src={backgroundImage}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ opacity: backgroundOpacity }}
                />
              ) : backgroundImage.endsWith('.gif') ? (
                <img
                  src={backgroundImage}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ opacity: backgroundOpacity }}
                />
              ) : (
                <div 
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url(${backgroundImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    opacity: backgroundOpacity,
                  }}
                />
              )}
              {/* Overlay gradient for better text readability when using background image */}
              <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/20 to-background/50" />
            </>
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(60%_40%_at_50%_0%,rgba(14,165,233,0.18),transparent_60%),radial-gradient(40%_30%_at_80%_20%,rgba(139,92,246,0.14),transparent_60%),radial-gradient(30%_30%_at_20%_60%,rgba(234,179,8,0.12),transparent_60%)] dark:bg-[radial-gradient(60%_40%_at_50%_0%,rgba(14,165,233,0.18),transparent_60%),radial-gradient(40%_30%_at_80%_20%,rgba(139,92,246,0.14),transparent_60%),radial-gradient(30%_30%_at_20%_60%,rgba(234,179,8,0.12),transparent_60%)]" />
          )}
        </div>
      )}

      {/* Mute/Unmute Button - Only show if background audio is present */}
      {backgroundAudio && (
        <button
          onClick={toggleMute}
          className="fixed bottom-4 right-4 z-50 p-3 bg-background/80 backdrop-blur-sm rounded-full shadow-lg border border-border hover:bg-background transition-all duration-200 hover:scale-110 active:scale-95"
          aria-label={isMuted ? 'Unmute background audio' : 'Mute background audio'}
          title={isMuted ? 'Unmute background audio' : 'Mute background audio'}
        >
          {isMuted ? (
            <SpeakerSlash className="w-5 h-5 text-muted-foreground" />
          ) : (
            <SpeakerHigh className="w-5 h-5 text-primary" />
          )}
        </button>
      )}

      {/* Page Content */}
      <div
        ref={contentRef}
        className="relative z-10"
        style={{ opacity: 0, transform: 'translateY(20px)' }}
      >
        {/* Optional Page Header - staggered reveal */}
        {(title || description) && (
          <div ref={headerRef} className="mb-6 sm:mb-8">
            {title && (
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-2" style={{ opacity: 0 }}>
                {title}
              </h1>
            )}
            {description && (
              <p className="text-muted-foreground font-body text-base sm:text-lg max-w-3xl" style={{ opacity: 0 }}>
                {description}
              </p>
            )}
          </div>
        )}

        {/* Page Content */}
        {children}
      </div>
    </div>
  )
}
