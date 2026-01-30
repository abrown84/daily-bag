import React, { useState, useEffect, useRef, useMemo } from 'react'
import { createTimeline, stagger, utils, createSpring } from 'animejs'
import { Sparkle } from '@phosphor-icons/react'
import { useSoundEffect } from '../contexts/SoundContext'

// Spring presets for satisfying motion
const springs = {
  pop: createSpring({ mass: 1, stiffness: 400, damping: 15 }),
  bounce: createSpring({ mass: 1, stiffness: 200, damping: 12 }),
}

interface PopupCelebration {
  id: string
  points: number
  choreTitle: string
  x: number
  y: number
  timestamp: number
  type?: 'points' | 'bonus' | 'streak' | 'level'
  color?: string
}

interface ChorePopupCelebrationProps {
  celebrations: PopupCelebration[]
  onRemove: (id: string) => void
}

export const ChorePopupCelebration: React.FC<ChorePopupCelebrationProps> = ({
  celebrations,
  onRemove
}) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {celebrations.map((celebration) => (
        <CoinPopupItem
          key={celebration.id}
          celebration={celebration}
          onRemove={onRemove}
        />
      ))}
    </div>
  )
}

interface CoinPopupItemProps {
  celebration: PopupCelebration
  onRemove: (id: string) => void
}

const CoinPopupItem: React.FC<CoinPopupItemProps> = ({ celebration, onRemove }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const coinRef = useRef<HTMLDivElement>(null)
  const valueRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const sparklesRef = useRef<HTMLDivElement>(null)
  const burstRef = useRef<HTMLDivElement>(null)
  const { playSound } = useSoundEffect()

  // Generate movement for arc trajectory
  const movement = useMemo(() => ({
    driftX: utils.random(-40, 40),
    arcHeight: utils.random(60, 100),
    rotation: utils.random(360, 720),
  }), [])

  useEffect(() => {
    const container = containerRef.current
    const coin = coinRef.current
    const value = valueRef.current
    const glow = glowRef.current
    const sparkles = sparklesRef.current
    const burst = burstRef.current

    if (!container || !coin) return

    // Play cash register sound for main coins (not bonus)
    if (celebration.type !== 'bonus') {
      playSound('cashRegister')
    }

    // Main timeline for coordinated animation
    const tl = createTimeline({
      defaults: { ease: 'outQuart' },
      onComplete: () => {
        onRemove(celebration.id)
      }
    })

    // Initial burst/flash
    if (burst) {
      tl.add(burst, {
        scale: [0, 3],
        opacity: [0.8, 0],
        duration: 400,
        ease: 'outQuart',
      }, 0)
    }

    // Coin slam in with spring
    tl.add(coin, {
      scale: [0, 1.4, 1],
      rotate: ['0deg', '45deg', '0deg'],
      opacity: [0, 1],
      duration: 400,
      ease: springs.pop,
    }, 0)

    // Value pop up above coin
    if (value) {
      tl.add(value, {
        scale: [0, 1.2, 1],
        opacity: [0, 1],
        translateY: [20, -10, 0],
        duration: 350,
        ease: springs.bounce,
      }, 100)
    }

    // Glow pulse
    if (glow) {
      tl.add(glow, {
        scale: [0.5, 1.5, 1.2],
        opacity: [0, 0.6, 0.3],
        duration: 500,
        ease: 'outQuart',
      }, 50)
    }

    // Sparkle burst
    if (sparkles) {
      const sparkleEls = sparkles.children
      tl.add(sparkleEls, {
        translateX: (_: Element, i: number) => {
          const angle = (i / sparkleEls.length) * Math.PI * 2
          return Math.cos(angle) * utils.random(40, 70)
        },
        translateY: (_: Element, i: number) => {
          const angle = (i / sparkleEls.length) * Math.PI * 2
          return Math.sin(angle) * utils.random(40, 70)
        },
        scale: [0, 1.5, 0],
        opacity: [1, 1, 0],
        rotate: () => utils.random(0, 360),
        duration: 600,
        delay: stagger(30, { from: 'center' }),
        ease: 'outQuart',
      }, 100)
    }

    // Float up with arc
    tl.add(container, {
      translateY: [0, -movement.arcHeight],
      translateX: [0, movement.driftX],
      duration: 800,
      ease: 'outQuad',
    }, 300)

    // Coin spin during float
    tl.add(coin, {
      rotate: [`0deg`, `${movement.rotation}deg`],
      scale: [1, 0.8],
      duration: 800,
      ease: 'outQuad',
    }, 300)

    // Fade out
    tl.add(container, {
      opacity: [1, 0],
      scale: [1, 0.6],
      duration: 400,
      ease: 'inQuart',
    }, 900)

    return () => {
      tl.pause()
    }
  }, [celebration.id, celebration.type, onRemove, movement, playSound])

  const getStyles = () => {
    const type = celebration.type || 'points'
    const points = celebration.points

    if (type === 'bonus') {
      return {
        coinBg: 'from-emerald-300 via-green-400 to-emerald-500',
        glow: 'rgba(52, 211, 153, 0.6)',
        textColor: 'text-emerald-900',
      }
    }
    if (type === 'streak') {
      return {
        coinBg: 'from-orange-300 via-amber-400 to-orange-500',
        glow: 'rgba(251, 146, 60, 0.6)',
        textColor: 'text-orange-900',
      }
    }
    if (type === 'level') {
      return {
        coinBg: 'from-purple-300 via-violet-400 to-purple-500',
        glow: 'rgba(167, 139, 250, 0.6)',
        textColor: 'text-purple-900',
      }
    }

    // Default gold coin - Daily Bag theme
    if (points >= 50) {
      return {
        coinBg: 'from-yellow-200 via-amber-400 to-yellow-500',
        glow: 'rgba(255, 215, 0, 0.8)',
        textColor: 'text-amber-900',
      }
    }
    return {
      coinBg: 'from-yellow-300 via-amber-400 to-yellow-500',
      glow: 'rgba(255, 215, 0, 0.6)',
      textColor: 'text-amber-900',
    }
  }

  const styles = getStyles()
  const coinSize = Math.min(72, Math.max(48, 48 + celebration.points / 3))
  const sparkleCount = celebration.points >= 30 ? 10 : celebration.points >= 15 ? 7 : 5

  return (
    <div
      ref={containerRef}
      className="absolute pointer-events-none"
      style={{
        left: celebration.x,
        top: celebration.y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Initial burst flash */}
      <div
        ref={burstRef}
        className="absolute rounded-full"
        style={{
          width: coinSize,
          height: coinSize,
          left: '50%',
          top: '50%',
          marginLeft: -coinSize / 2,
          marginTop: -coinSize / 2,
          background: `radial-gradient(circle, ${styles.glow} 0%, transparent 70%)`,
          opacity: 0,
        }}
      />

      {/* Glow ring */}
      <div
        ref={glowRef}
        className="absolute rounded-full"
        style={{
          width: coinSize * 1.5,
          height: coinSize * 1.5,
          left: '50%',
          top: '50%',
          marginLeft: -coinSize * 0.75,
          marginTop: -coinSize * 0.75,
          background: `radial-gradient(circle, ${styles.glow} 0%, transparent 60%)`,
          opacity: 0,
        }}
      />

      {/* Main coin */}
      <div
        ref={coinRef}
        className={`relative flex items-center justify-center font-bold rounded-full bg-gradient-to-br ${styles.coinBg}`}
        style={{
          width: coinSize,
          height: coinSize,
          boxShadow: `
            0 6px 20px ${styles.glow},
            inset 0 -4px 8px rgba(0,0,0,0.25),
            inset 0 4px 8px rgba(255,255,255,0.5)
          `,
          fontSize: coinSize * 0.35,
          color: '#8B6914',
          textShadow: '0 1px 0 rgba(255,255,255,0.6)',
          opacity: 0,
        }}
      >
        $
        {/* Coin shine */}
        <div
          className="absolute inset-0 rounded-full overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 40%)',
          }}
        />
        {/* Inner ring */}
        <div
          className="absolute rounded-full border-2 border-amber-600/30"
          style={{
            width: coinSize - 8,
            height: coinSize - 8,
          }}
        />
      </div>

      {/* Value label */}
      <div
        ref={valueRef}
        className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap font-black text-xl px-3 py-1 rounded-full bg-white/95 shadow-lg ${styles.textColor}`}
        style={{
          top: -coinSize / 2 - 16,
          opacity: 0,
          textShadow: '0 1px 2px rgba(0,0,0,0.1)',
        }}
      >
        +{celebration.points}
      </div>

      {/* Sparkle burst */}
      <div ref={sparklesRef} className="absolute inset-0">
        {[...Array(sparkleCount)].map((_, i) => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2"
            style={{
              marginLeft: -6,
              marginTop: -6,
            }}
          >
            <Sparkle
              weight="fill"
              className="w-3 h-3 text-yellow-300"
              style={{
                filter: 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.8))',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// Hook to manage popup celebrations
export const usePopupCelebrations = () => {
  const [celebrations, setCelebrations] = useState<PopupCelebration[]>([])

  const addCelebration = (
    points: number,
    choreTitle: string,
    x: number,
    y: number,
    type?: 'points' | 'bonus' | 'streak' | 'level'
  ) => {
    const popup: PopupCelebration = {
      id: `celebration-${Date.now()}-${Math.random()}`,
      points,
      choreTitle,
      x: x + utils.random(-15, 15),
      y: y + utils.random(-15, 15),
      timestamp: Date.now(),
      type: type || 'points'
    }

    setCelebrations(prev => [...prev, popup])

    // Add bonus mini-coins for high values
    if (points >= 25 && type !== 'bonus') {
      const bonusCount = points >= 50 ? 3 : 2
      for (let i = 0; i < bonusCount; i++) {
        setTimeout(() => {
          const bonusPopup: PopupCelebration = {
            id: `bonus-${Date.now()}-${Math.random()}`,
            points: Math.floor(points * 0.15),
            choreTitle,
            x: x + utils.random(-80, 80),
            y: y + utils.random(-60, 60),
            timestamp: Date.now(),
            type: 'bonus'
          }
          setCelebrations(prev => [...prev, bonusPopup])
        }, 80 + i * 60)
      }
    }
  }

  const removeCelebration = (id: string) => {
    setCelebrations(prev => prev.filter(c => c.id !== id))
  }

  return {
    celebrations,
    addCelebration,
    removeCelebration
  }
}
