import React, { useEffect, useRef, memo, useCallback, useState } from 'react'
import { animate, createTimeline, stagger, utils, createSpring } from 'animejs'
import { createPortal } from 'react-dom'

interface FlyingPoint {
  id: string
  value: number
  startX: number
  startY: number
  type: 'points' | 'bonus' | 'streak'
}

interface FlyingPointsProps {
  targetRef: React.RefObject<HTMLElement>
  onPointLanded?: (value: number) => void
}

interface FlyingPointsHandle {
  launch: (point: Omit<FlyingPoint, 'id'>) => void
}

// Spring presets
const springs = {
  launch: createSpring({ mass: 1, stiffness: 200, damping: 15 }),
  land: createSpring({ mass: 1, stiffness: 300, damping: 20 }),
}

/**
 * Enhanced flying points with coins, trails, and particle effects
 * Uses anime.js v4 for smooth, physics-based animations
 */
export const FlyingPoints = memo(
  React.forwardRef<FlyingPointsHandle, FlyingPointsProps>(
    ({ targetRef, onPointLanded }, ref) => {
      const [points, setPoints] = useState<FlyingPoint[]>([])
      const [landingEffects, setLandingEffects] = useState<{ id: string; x: number; y: number }[]>([])
      const containerRef = useRef<HTMLDivElement>(null)

      const launch = useCallback((point: Omit<FlyingPoint, 'id'>) => {
        // For large values, split into multiple coins
        const coinCount = Math.min(5, Math.ceil(point.value / 20))
        const valuePerCoin = Math.ceil(point.value / coinCount)

        for (let i = 0; i < coinCount; i++) {
          const id = `point-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          const coinValue = i === coinCount - 1
            ? point.value - (valuePerCoin * (coinCount - 1))
            : valuePerCoin

          // Stagger the launches slightly
          setTimeout(() => {
            setPoints(prev => [...prev, {
              ...point,
              id,
              value: coinValue,
              // Add slight position offset for multi-coin burst
              startX: point.startX + utils.random(-20, 20),
              startY: point.startY + utils.random(-15, 15),
            }])
          }, i * 60)
        }
      }, [])

      React.useImperativeHandle(ref, () => ({ launch }), [launch])

      // Animate each new point
      useEffect(() => {
        if (points.length === 0 || !targetRef.current) return

        const target = targetRef.current.getBoundingClientRect()
        const targetX = target.left + target.width / 2
        const targetY = target.top + target.height / 2

        points.forEach((point) => {
          const coinElement = document.getElementById(`coin-${point.id}`)
          const trailElement = document.getElementById(`trail-${point.id}`)
          const valueElement = document.getElementById(`value-${point.id}`)

          if (!coinElement) return

          const dx = targetX - point.startX
          const dy = targetY - point.startY

          // Create a nice arc - higher arc for longer distances
          const distance = Math.sqrt(dx * dx + dy * dy)
          const arcHeight = Math.min(150, distance * 0.4)

          // Control points for bezier-like motion
          const midX = point.startX + dx * 0.5
          const midY = point.startY + dy * 0.3 - arcHeight

          // Main coin animation
          const tl = createTimeline({
            defaults: { ease: 'outQuart' },
            onComplete: () => {
              // Trigger landing effect
              const landingId = `land-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
              setLandingEffects(prev => [...prev, { id: landingId, x: targetX, y: targetY }])

              // Clean up after animation
              setTimeout(() => {
                setLandingEffects(prev => prev.filter(e => e.id !== landingId))
              }, 600)

              onPointLanded?.(point.value)
              setPoints(prev => prev.filter(p => p.id !== point.id))
            }
          })

          // Initial pop with spring
          tl.add(coinElement, {
            scale: [0, 1.3, 1],
            rotate: ['0deg', `${utils.random(-20, 20)}deg`],
            duration: 200,
            ease: springs.launch,
          })

          // Show value label
          if (valueElement) {
            tl.add(valueElement, {
              opacity: [0, 1],
              scale: [0.5, 1],
              translateY: [10, 0],
              duration: 150,
              ease: 'outBack',
            }, '-=100')
          }

          // Arc motion - first half (up and out)
          tl.add(coinElement, {
            translateX: midX - point.startX,
            translateY: midY - point.startY,
            rotate: `${utils.random(180, 360)}deg`,
            duration: 350,
            ease: 'outQuad',
          })

          // Arc motion - second half (down to target)
          tl.add(coinElement, {
            translateX: targetX - point.startX,
            translateY: targetY - point.startY,
            rotate: `${utils.random(540, 720)}deg`,
            scale: [1, 0.6],
            duration: 300,
            ease: 'inQuad',
          })

          // Fade out value as it travels
          if (valueElement) {
            tl.add(valueElement, {
              opacity: 0,
              scale: 0.5,
              duration: 200,
            }, '-=250')
          }

          // Trail effect - follows with delay
          if (trailElement) {
            const trailParticles = trailElement.children
            animate(trailParticles, {
              translateX: () => [0, (targetX - point.startX) + utils.random(-30, 30)],
              translateY: () => [0, (targetY - point.startY) + utils.random(-30, 30)],
              scale: [1, 0],
              opacity: [0.8, 0],
              duration: 700,
              delay: stagger(30, { from: 'first' }),
              ease: 'outQuart',
            })
          }
        })
      }, [points, targetRef, onPointLanded])

      // Animate landing effects
      useEffect(() => {
        landingEffects.forEach(effect => {
          const element = document.getElementById(effect.id)
          if (!element) return

          const particles = element.children
          animate(particles, {
            translateX: () => utils.random(-40, 40),
            translateY: () => utils.random(-40, 40),
            scale: [1, 0],
            opacity: [1, 0],
            duration: 500,
            delay: stagger(20, { from: 'center' }),
            ease: 'outQuart',
          })
        })
      }, [landingEffects])

      const getPointStyles = (type: FlyingPoint['type']) => {
        switch (type) {
          case 'bonus':
            return {
              coin: 'from-amber-300 via-yellow-400 to-amber-500',
              glow: 'rgba(251, 191, 36, 0.6)',
              text: 'text-amber-900',
            }
          case 'streak':
            return {
              coin: 'from-purple-400 via-pink-400 to-purple-500',
              glow: 'rgba(168, 85, 247, 0.6)',
              text: 'text-purple-900',
            }
          default:
            return {
              coin: 'from-yellow-300 via-amber-400 to-yellow-500',
              glow: 'rgba(255, 215, 0, 0.6)',
              text: 'text-yellow-900',
            }
        }
      }

      if (points.length === 0 && landingEffects.length === 0) return null

      return createPortal(
        <div
          ref={containerRef}
          className="fixed inset-0 pointer-events-none z-[100]"
          aria-hidden="true"
        >
          {/* Flying coins */}
          {points.map((point) => {
            const styles = getPointStyles(point.type)
            const coinSize = Math.min(48, 32 + point.value / 10)

            return (
              <div
                key={point.id}
                className="absolute"
                style={{
                  left: point.startX,
                  top: point.startY,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {/* Trail particles */}
                <div
                  id={`trail-${point.id}`}
                  className="absolute inset-0"
                >
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute rounded-full"
                      style={{
                        width: 6 + i * 2,
                        height: 6 + i * 2,
                        left: -3 - i,
                        top: -3 - i,
                        background: styles.glow,
                        boxShadow: `0 0 ${8 + i * 2}px ${styles.glow}`,
                      }}
                    />
                  ))}
                </div>

                {/* Main coin */}
                <div
                  id={`coin-${point.id}`}
                  className={`relative flex items-center justify-center font-bold rounded-full bg-gradient-to-br ${styles.coin}`}
                  style={{
                    width: coinSize,
                    height: coinSize,
                    boxShadow: `
                      0 4px 15px ${styles.glow},
                      inset 0 -3px 6px rgba(0,0,0,0.25),
                      inset 0 3px 6px rgba(255,255,255,0.4)
                    `,
                    fontSize: coinSize * 0.4,
                    color: '#8B6914',
                    textShadow: '0 1px 0 rgba(255,255,255,0.5)',
                    transform: 'scale(0)',
                  }}
                >
                  $
                  {/* Shine effect */}
                  <div
                    className="absolute inset-0 rounded-full overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%)',
                    }}
                  />
                </div>

                {/* Value label */}
                <div
                  id={`value-${point.id}`}
                  className={`absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap font-bold text-sm px-2 py-0.5 rounded-full bg-white/90 shadow-lg ${styles.text}`}
                  style={{ opacity: 0 }}
                >
                  +{point.value}
                </div>
              </div>
            )
          })}

          {/* Landing burst effects */}
          {landingEffects.map(effect => (
            <div
              key={effect.id}
              id={effect.id}
              className="absolute"
              style={{
                left: effect.x,
                top: effect.y,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {/* Burst particles */}
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width: 8,
                    height: 8,
                    left: -4,
                    top: -4,
                    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                    boxShadow: '0 0 8px rgba(255, 215, 0, 0.8)',
                  }}
                />
              ))}
              {/* Central flash */}
              <div
                className="absolute rounded-full"
                style={{
                  width: 20,
                  height: 20,
                  left: -10,
                  top: -10,
                  background: 'radial-gradient(circle, rgba(255,215,0,0.8) 0%, transparent 70%)',
                }}
              />
            </div>
          ))}
        </div>,
        document.body
      )
    }
  )
)

FlyingPoints.displayName = 'FlyingPoints'

// Hook for using FlyingPoints
export function useFlyingPoints(targetRef: React.RefObject<HTMLElement>) {
  const flyingPointsRef = useRef<FlyingPointsHandle>(null)
  const [totalLanded, setTotalLanded] = useState(0)

  const launchPoints = useCallback((
    value: number,
    startX: number,
    startY: number,
    type: 'points' | 'bonus' | 'streak' = 'points'
  ) => {
    flyingPointsRef.current?.launch({ value, startX, startY, type })
  }, [])

  const handlePointLanded = useCallback((value: number) => {
    setTotalLanded(prev => prev + value)
  }, [])

  const FlyingPointsComponent = useCallback(() => (
    <FlyingPoints
      ref={flyingPointsRef}
      targetRef={targetRef}
      onPointLanded={handlePointLanded}
    />
  ), [targetRef, handlePointLanded])

  return {
    launchPoints,
    totalLanded,
    FlyingPointsComponent
  }
}
