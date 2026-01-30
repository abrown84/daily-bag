import React, { useState, useEffect, useRef, useCallback } from 'react'
import { animate, createTimeline, stagger, utils, createSpring } from 'animejs'
import { useStats } from '../hooks/useStats'
import { useAuth } from '../hooks/useAuth'
import { LEVELS } from '../types/chore'
import { X, ShareNetwork, Sparkle, CurrencyDollar } from '@phosphor-icons/react'
import { toast } from 'sonner'

// Spring presets for different feels
const springs = {
  bouncy: createSpring({ mass: 1, stiffness: 180, damping: 12 }),
  snappy: createSpring({ mass: 1, stiffness: 300, damping: 20 }),
  wobbly: createSpring({ mass: 1, stiffness: 150, damping: 8 }),
}

export const LevelUpCelebration: React.FC = () => {
  const { getUserStats } = useStats()
  const { user } = useAuth()
  const [showCelebration, setShowCelebration] = useState(false)
  const [currentLevel, setCurrentLevel] = useState(1)

  const containerRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const iconRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const levelNumRef = useRef<HTMLDivElement>(null)
  const levelNumValueRef = useRef<HTMLSpanElement>(null)
  const levelNameRef = useRef<HTMLDivElement>(null)
  const rewardsRef = useRef<HTMLDivElement>(null)
  const confettiRef = useRef<HTMLDivElement>(null)
  const coinsRef = useRef<HTMLDivElement>(null)
  const shockwaveRef = useRef<HTMLDivElement>(null)
  const fireworksRef = useRef<HTMLDivElement>(null)
  const starsRef = useRef<HTMLDivElement>(null)
  const particlesRef = useRef<HTMLDivElement>(null)

  const timelineRef = useRef<ReturnType<typeof createTimeline> | null>(null)
  const lastProcessedLevel = useRef<number>(1)

  const userStats = user ? getUserStats(user.id) : null
  const currentUserLevel = userStats?.currentLevel || 1

  const handleClose = useCallback(() => {
    // Exit animation timeline
    const exitTl = createTimeline({
      defaults: { duration: 400 }
    })

    if (modalRef.current) {
      exitTl.add(modalRef.current, {
        scale: [1, 0.8],
        opacity: [1, 0],
        translateY: [0, 30],
        ease: 'inBack',
      })
    }

    if (overlayRef.current) {
      exitTl.add(overlayRef.current, {
        opacity: [1, 0],
        ease: 'inQuart',
      }, '-=400')
    }

    exitTl.then(() => {
      setShowCelebration(false)
    })
  }, [])

  const startCelebrationSequence = useCallback((level: number) => {
    setShowCelebration(true)
    setCurrentLevel(level)

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const tl = createTimeline({
          defaults: { duration: 600 }
        })
        timelineRef.current = tl

        // Set initial states using utils.set
        if (overlayRef.current) utils.set(overlayRef.current, { opacity: 0 })
        if (modalRef.current) utils.set(modalRef.current, { opacity: 0, scale: 0.3 })
        if (iconRef.current) utils.set(iconRef.current, { opacity: 0, scale: 0 })
        if (titleRef.current) utils.set(titleRef.current, { opacity: 0, translateY: 100 })
        if (levelNumRef.current) utils.set(levelNumRef.current, { opacity: 0, scale: 0 })
        if (levelNameRef.current) utils.set(levelNameRef.current, { opacity: 0, translateX: -50 })
        if (rewardsRef.current) utils.set(rewardsRef.current, { opacity: 0, translateY: 40 })

        // Screen flash
        if (containerRef.current) {
          tl.add(containerRef.current, {
            backgroundColor: ['rgba(255, 215, 0, 0)', 'rgba(255, 215, 0, 0.3)', 'rgba(255, 215, 0, 0)'],
            duration: 300,
            ease: 'outQuad',
          })
        }

        // Shockwave rings - staggered scale animation
        if (shockwaveRef.current) {
          const rings = shockwaveRef.current.children
          tl.add(rings, {
            scale: [0, 4],
            opacity: [1, 0],
            duration: 1000,
            delay: stagger(100),
            ease: 'outQuart',
          }, 0)
        }

        // Overlay fade in
        if (overlayRef.current) {
          tl.add(overlayRef.current, {
            opacity: [0, 1],
            duration: 500,
            ease: 'outCubic',
          }, 0)
        }

        // Modal SLAM with spring physics
        if (modalRef.current) {
          tl.add(modalRef.current, {
            scale: [0.3, 1],
            opacity: [0, 1],
            rotate: ['-5deg', '0deg'],
            duration: 800,
            ease: springs.bouncy,
          }, 0)
        }

        // Confetti burst - animate each piece with stagger
        if (confettiRef.current) {
          const confetti = confettiRef.current.children
          tl.add(confetti, {
            translateY: () => [0, utils.random(400, 800)],
            translateX: () => utils.random(-200, 200),
            rotate: () => utils.random(360, 1080),
            opacity: [1, 1, 0],
            scale: [0, 1, 0.5],
            duration: () => utils.random(2000, 3000),
            delay: stagger(20, { from: 'center' }),
            ease: 'outQuart',
          }, 200)
        }

        // Icon BURST with spring
        if (iconRef.current) {
          tl.add(iconRef.current, {
            scale: [0, 1],
            rotate: ['0deg', '360deg'],
            opacity: [0, 1],
            duration: 800,
            ease: springs.wobbly,
          }, 300)
        }

        // Coin explosion from center
        if (coinsRef.current) {
          const coins = coinsRef.current.children
          tl.add(coins, {
            translateX: (_: Element, i: number) => {
              const angle = (i / 20) * Math.PI * 2
              return Math.cos(angle) * utils.random(100, 180)
            },
            translateY: (_: Element, i: number) => {
              const angle = (i / 20) * Math.PI * 2
              return Math.sin(angle) * utils.random(100, 180)
            },
            rotate: () => utils.random(360, 720),
            scale: [0, 1, 0],
            opacity: [1, 1, 0],
            duration: 1200,
            delay: stagger(25),
            ease: 'outQuart',
          }, 500)
        }

        // Title SLAM with spring
        if (titleRef.current) {
          tl.add(titleRef.current, {
            translateY: [100, 0],
            scale: [0.5, 1],
            opacity: [0, 1],
            duration: 600,
            ease: springs.snappy,
          }, 500)
        }

        // Level number with counter animation
        if (levelNumRef.current) {
          tl.add(levelNumRef.current, {
            scale: [0, 1],
            opacity: [0, 1],
            duration: 600,
            ease: springs.bouncy,
          }, 650)
        }

        // Animate the number counting up
        if (levelNumValueRef.current) {
          const target = { value: 0 }
          tl.add(target, {
            value: level,
            duration: 500,
            ease: 'outQuart',
            onUpdate: () => {
              if (levelNumValueRef.current) {
                levelNumValueRef.current.textContent = Math.round(target.value).toString()
              }
            }
          }, 700)
        }

        // Fireworks - each burst with staggered particles
        if (fireworksRef.current) {
          const bursts = fireworksRef.current.children
          Array.from(bursts).forEach((burst, burstIndex) => {
            const particles = burst.children
            tl.add(particles, {
              translateX: (_: Element, i: number) => {
                const angle = (i / 12) * Math.PI * 2
                return Math.cos(angle) * utils.random(30, 60)
              },
              translateY: (_: Element, i: number) => {
                const angle = (i / 12) * Math.PI * 2
                return Math.sin(angle) * utils.random(30, 60)
              },
              scale: [1, 0],
              opacity: [1, 0],
              duration: 800,
              delay: stagger(10),
              ease: 'outQuart',
            }, 900 + burstIndex * 150)
          })
        }

        // Level name slide in
        if (levelNameRef.current) {
          tl.add(levelNameRef.current, {
            translateX: [-50, 0],
            opacity: [0, 1],
            duration: 500,
            ease: springs.snappy,
          }, 850)
        }

        // Rewards cascade
        if (rewardsRef.current) {
          tl.add(rewardsRef.current, {
            translateY: [40, 0],
            opacity: [0, 1],
            duration: 500,
            ease: 'outCubic',
          }, 1000)
        }

        // Floating stars - continuous animation
        if (starsRef.current) {
          const stars = starsRef.current.children
          animate(stars, {
            translateY: [0, -15, 0],
            scale: [1, 1.2, 1],
            opacity: [0.6, 1, 0.6],
            duration: 3000,
            delay: stagger(200),
            loop: true,
            ease: 'inOutSine',
          })
        }

        // Ambient particles - continuous float
        if (particlesRef.current) {
          const particles = particlesRef.current.children
          animate(particles, {
            translateY: () => [0, utils.random(-30, -50), 0],
            translateX: () => [0, utils.random(-15, 15), 0],
            opacity: [0.3, 1, 0.3],
            duration: () => utils.random(3000, 5000),
            delay: stagger(100, { from: 'random' }),
            loop: true,
            ease: 'inOutSine',
          })
        }

        // Icon continuous pulse
        if (iconRef.current) {
          animate(iconRef.current, {
            scale: [1, 1.1, 1],
            duration: 2000,
            delay: 1500,
            ease: 'inOutSine',
            loop: true,
          })
        }

        // Auto close after 7 seconds
        setTimeout(() => {
          handleClose()
        }, 7000)
      })
    })
  }, [handleClose])

  const handleShare = useCallback(async () => {
    const levelData = LEVELS.find(level => level.level === currentLevel)
    const shareText = `🎉 I just reached Level ${currentLevel} - ${levelData?.name || 'Champion'}! 🏆\n\n💰 Making chores pay off with Daily Bag!`

    const shareData = {
      title: `Level ${currentLevel} Achievement!`,
      text: shareText,
      url: window.location.origin,
    }

    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData)
        toast.success('Shared successfully!')
      } else {
        await navigator.clipboard.writeText(`${shareText}\n\n${window.location.origin}`)
        toast.success('Copied to clipboard!')
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(`${shareText}\n\n${window.location.origin}`)
          toast.success('Copied to clipboard!')
        } catch {
          toast.error('Could not share')
        }
      }
    }
  }, [currentLevel])

  useEffect(() => {
    const handleLevelUp = (event: CustomEvent) => {
      const { newLevel } = event.detail
      if (newLevel > lastProcessedLevel.current) {
        lastProcessedLevel.current = newLevel
        startCelebrationSequence(newLevel)
      }
    }

    window.addEventListener('levelUp', handleLevelUp as EventListener)
    return () => {
      window.removeEventListener('levelUp', handleLevelUp as EventListener)
    }
  }, [startCelebrationSequence])

  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showCelebration) {
        handleClose()
      }
      if ((e.key === 'f' || e.key === 'F') && !showCelebration && !e.ctrlKey && !e.metaKey) {
        const testLevel = currentUserLevel || 2
        lastProcessedLevel.current = testLevel - 1
        startCelebrationSequence(testLevel)
      }
    }

    document.addEventListener('keydown', handleKeyboard)
    return () => document.removeEventListener('keydown', handleKeyboard)
  }, [showCelebration, currentUserLevel, startCelebrationSequence, handleClose])

  // Cleanup animations on unmount
  useEffect(() => {
    return () => {
      if (timelineRef.current) {
        timelineRef.current.pause()
      }
    }
  }, [])

  if (!showCelebration) return null

  const levelData = LEVELS.find(level => level.level === currentLevel)

  const getLevelIcon = () => (
    <img
      src="/dailybag-transparent.png"
      alt="Daily Bag"
      className="w-24 h-24 md:w-32 md:h-32 object-contain"
      style={{ filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.8))' }}
    />
  )

  // Pre-generate random values for confetti using utils.random
  const confettiData = Array.from({ length: 80 }, (_, i) => ({
    left: utils.random(0, 100),
    size: utils.random(8, 18),
    color: ['#FFD700', '#FFA500', '#6366F1', '#4F46E5', '#F59E0B', '#FBBF24', '#A855F7', '#EC4899'][i % 8],
    shape: ['circle', 'square', 'star'][i % 3],
  }))

  // Pre-generate coin data
  const coinData = Array.from({ length: 20 }, () => ({
    size: utils.random(28, 48),
  }))

  // Firework positions
  const fireworkData = [
    { x: '20%', y: '25%', color: '#FFD700' },
    { x: '80%', y: '20%', color: '#6366F1' },
    { x: '15%', y: '60%', color: '#F59E0B' },
    { x: '85%', y: '55%', color: '#A855F7' },
    { x: '50%', y: '15%', color: '#EC4899' },
  ]

  // Star positions
  const starData = Array.from({ length: 15 }, () => ({
    x: utils.random(5, 95),
    y: utils.random(5, 95),
    size: utils.random(12, 28),
  }))

  // Particle data
  const particleData = Array.from({ length: 30 }, (_, i) => ({
    x: utils.random(0, 100),
    y: utils.random(0, 100),
    size: utils.random(2, 6),
    colorType: i % 3,
  }))

  return (
    <div ref={containerRef} className="fixed inset-0 z-50">
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0 backdrop-blur-lg"
        style={{
          background: `
            radial-gradient(ellipse at 50% 30%, rgba(255, 215, 0, 0.15) 0%, transparent 50%),
            linear-gradient(135deg, rgba(79, 70, 229, 0.9) 0%, rgba(30, 27, 75, 0.98) 40%, rgba(55, 48, 163, 0.95) 100%)
          `,
        }}
      />

      {/* Shockwave rings */}
      <div ref={shockwaveRef} className="absolute inset-0 pointer-events-none flex items-center justify-center">
        {[100, 200, 350].map((size, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: size,
              height: size,
              border: '3px solid rgba(255, 215, 0, 0.6)',
              boxShadow: '0 0 20px rgba(255, 215, 0, 0.4), inset 0 0 20px rgba(255, 215, 0, 0.2)',
              transform: 'scale(0)',
            }}
          />
        ))}
      </div>

      {/* Confetti */}
      <div ref={confettiRef} className="absolute inset-0 pointer-events-none overflow-hidden">
        {confettiData.map((c, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${c.left}%`,
              top: '-20px',
              width: c.size,
              height: c.shape === 'square' ? c.size * 1.5 : c.size,
              backgroundColor: c.color,
              borderRadius: c.shape === 'circle' ? '50%' : '2px',
              opacity: 0,
              ...(c.shape === 'star' && {
                clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
              }),
            }}
          />
        ))}
      </div>

      {/* Coin burst */}
      <div ref={coinsRef} className="absolute inset-0 pointer-events-none flex items-center justify-center">
        {coinData.map((c, i) => (
          <div
            key={i}
            className="absolute flex items-center justify-center font-bold"
            style={{
              width: c.size,
              height: c.size,
              marginLeft: -c.size / 2,
              marginTop: -c.size / 2,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 40%, #FFD700 60%, #B8860B 100%)',
              boxShadow: '0 4px 15px rgba(255, 215, 0, 0.7), inset 0 -3px 6px rgba(0,0,0,0.3), inset 0 3px 6px rgba(255,255,255,0.4)',
              fontSize: c.size * 0.45,
              color: '#8B6914',
              textShadow: '0 1px 0 rgba(255,255,255,0.5)',
              opacity: 0,
            }}
          >
            $
          </div>
        ))}
      </div>

      {/* Fireworks */}
      <div ref={fireworksRef} className="absolute inset-0 pointer-events-none">
        {fireworkData.map((fw, fwIndex) => (
          <div key={fwIndex} className="absolute" style={{ left: fw.x, top: fw.y }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: 6,
                  height: 6,
                  backgroundColor: fw.color,
                  boxShadow: `0 0 8px ${fw.color}`,
                  left: -3,
                  top: -3,
                }}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Floating stars */}
      <div ref={starsRef} className="absolute inset-0 pointer-events-none">
        {starData.map((s, i) => (
          <div
            key={i}
            className="absolute"
            style={{ left: `${s.x}%`, top: `${s.y}%` }}
          >
            <Sparkle
              weight="fill"
              style={{
                width: s.size,
                height: s.size,
                color: '#FFD700',
                filter: 'drop-shadow(0 0 6px rgba(255, 215, 0, 0.8))',
              }}
            />
          </div>
        ))}
      </div>

      {/* Ambient particles */}
      <div ref={particlesRef} className="absolute inset-0 pointer-events-none">
        {particleData.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              background: p.colorType === 0
                ? 'rgba(255, 215, 0, 0.8)'
                : p.colorType === 1
                  ? 'rgba(99, 102, 241, 0.6)'
                  : 'rgba(168, 85, 247, 0.6)',
              boxShadow: p.colorType === 0
                ? '0 0 10px rgba(255, 215, 0, 1)'
                : '0 0 8px rgba(99, 102, 241, 0.8)',
            }}
          />
        ))}
      </div>

      {/* Main modal container */}
      <div className="w-full h-full flex items-center justify-center">
        <div
          ref={modalRef}
          className="relative max-w-md mx-4 p-6 md:p-8 text-center overflow-visible"
          style={{
            background: 'linear-gradient(160deg, rgba(30, 27, 75, 0.97) 0%, rgba(55, 48, 163, 0.95) 50%, rgba(79, 70, 229, 0.93) 100%)',
            backdropFilter: 'blur(20px)',
            border: '3px solid transparent',
            borderImage: 'linear-gradient(135deg, #FFD700, #FFA500, #FFD700) 1',
            borderRadius: '28px',
            boxShadow: `
              0 0 80px rgba(255, 215, 0, 0.4),
              0 0 120px rgba(99, 102, 241, 0.3),
              0 30px 60px -15px rgba(0, 0, 0, 0.5),
              inset 0 1px 0 rgba(255, 255, 255, 0.15)
            `,
          }}
        >
          {/* Animated border glow */}
          <div
            className="absolute -inset-[3px] rounded-[28px] -z-10 animate-border-glow"
            style={{
              background: 'linear-gradient(135deg, #FFD700, #6366F1, #FFD700, #A855F7, #FFD700)',
              backgroundSize: '400% 400%',
            }}
          />

          {/* Corner sparkles */}
          {['-top-3 -left-3', '-top-3 -right-3', '-bottom-3 -left-3', '-bottom-3 -right-3'].map((pos, i) => (
            <div key={i} className={`absolute ${pos} w-8 h-8`}>
              <Sparkle weight="fill" className="w-full h-full text-yellow-400" style={{ filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.8))' }} />
            </div>
          ))}

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-200 hover:scale-110"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-white/80" />
          </button>

          {/* Level icon with glow ring */}
          <div ref={iconRef} className="mb-4 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-36 h-36 md:w-44 md:h-44 rounded-full animate-pulse-glow"
                style={{
                  background: 'radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, transparent 70%)',
                }}
              />
            </div>
            <div className="relative inline-block p-3 rounded-full bg-gradient-to-br from-yellow-400/30 to-amber-600/20 border-2 border-yellow-400/50">
              {getLevelIcon()}
            </div>
          </div>

          {/* Title with shimmer */}
          <h1
            ref={titleRef}
            className="text-4xl md:text-5xl font-black mb-3 animate-shimmer"
            style={{
              background: 'linear-gradient(135deg, #FFD700 0%, #FFF 25%, #FFD700 50%, #FFA500 75%, #FFD700 100%)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              letterSpacing: '-0.02em',
              textShadow: '0 0 40px rgba(255, 215, 0, 0.5)',
            }}
          >
            LEVEL UP!
          </h1>

          {/* Level number badge with animated counter */}
          <div
            ref={levelNumRef}
            className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 text-white text-3xl md:text-4xl font-black mb-3 rounded-2xl relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #F59E0B 100%)',
              boxShadow: `
                0 10px 40px rgba(255, 215, 0, 0.5),
                inset 0 2px 0 rgba(255, 255, 255, 0.4),
                inset 0 -2px 0 rgba(0, 0, 0, 0.15)
              `,
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div className="absolute inset-0 animate-shine" style={{
              background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.4) 50%, transparent 60%)',
            }} />
            <span ref={levelNumValueRef}>0</span>
          </div>

          {/* Level name */}
          <div
            ref={levelNameRef}
            className="text-lg md:text-xl font-bold text-yellow-200 mb-4"
            style={{ textShadow: '0 2px 10px rgba(255, 215, 0, 0.4)' }}
          >
            {levelData?.icon} {levelData?.name}
          </div>

          {/* Rewards */}
          <div
            ref={rewardsRef}
            className="rounded-xl p-4 mb-5"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 215, 0, 0.25)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <CurrencyDollar weight="fill" className="w-4 h-4 text-yellow-400" />
              <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-wider">
                Rewards Unlocked
              </h3>
              <CurrencyDollar weight="fill" className="w-4 h-4 text-yellow-400" />
            </div>
            <ul className="space-y-1.5">
              {levelData?.rewards.map((reward, index) => (
                <li key={index} className="flex items-center justify-center gap-2 text-white/90">
                  <Sparkle weight="fill" className="w-3 h-3 text-yellow-400/70" />
                  <span className="text-sm">{reward}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Share button */}
          <button
            onClick={handleShare}
            className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl text-indigo-900 font-bold transition-all duration-200 hover:scale-105 active:scale-95 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
              boxShadow: '0 4px 20px rgba(255, 215, 0, 0.5)',
            }}
          >
            <div className="absolute inset-0 animate-shine" style={{
              background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)',
            }} />
            <ShareNetwork weight="bold" className="w-5 h-5 relative z-10" />
            <span className="relative z-10">Share Achievement</span>
          </button>

          <div className="mt-4 text-xs text-white/40">
            Press ESC to close
          </div>
        </div>
      </div>

      <style>{`
        @keyframes border-glow {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-border-glow {
          animation: border-glow 3s ease infinite;
        }

        @keyframes pulse-glow {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        @keyframes shimmer {
          0% { background-position: 200% 50%; }
          100% { background-position: -200% 50%; }
        }
        .animate-shimmer {
          animation: shimmer 2s linear infinite;
        }

        @keyframes shine {
          0% { transform: translateX(-100%); }
          50%, 100% { transform: translateX(100%); }
        }
        .animate-shine {
          animation: shine 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
