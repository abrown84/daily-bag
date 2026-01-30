import React, { memo, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
// Sound disabled for UI interactions - only celebration sounds are enabled
// import { useSoundEffect } from '../../contexts/SoundContext'

interface InteractiveWrapperProps {
  children: React.ReactNode
  className?: string
  onClick?: (e: React.MouseEvent) => void
  disabled?: boolean
  sound?: 'click' | 'success' | 'woosh' | 'none'
  scale?: number
  whileTap?: number
}

/**
 * Wrapper that adds micro-interaction animations to any element
 * Includes tactile feedback (scale) and optional sound
 */
export const InteractiveWrapper = memo<InteractiveWrapperProps>(({
  children,
  className = '',
  onClick,
  disabled = false,
  sound = 'click',
  scale = 1.02,
  whileTap = 0.98
}) => {
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (disabled) return
    onClick?.(e)
  }, [disabled, onClick])

  return (
    <motion.div
      className={className}
      whileHover={disabled ? {} : { scale }}
      whileTap={disabled ? {} : { scale: whileTap }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      onClick={handleClick}
      style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      {children}
    </motion.div>
  )
})

InteractiveWrapper.displayName = 'InteractiveWrapper'

interface PressableCardProps {
  children: React.ReactNode
  className?: string
  onClick?: (e: React.MouseEvent) => void
  disabled?: boolean
}

/**
 * Card with subtle press animation and hover lift effect
 */
export const PressableCard = memo<PressableCardProps>(({
  children,
  className = '',
  onClick,
  disabled = false
}) => {
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (disabled) return
    onClick?.(e)
  }, [disabled, onClick])

  return (
    <motion.div
      className={className}
      whileHover={disabled ? {} : {
        y: -2,
        boxShadow: '0 10px 20px -5px rgba(0, 0, 0, 0.1)'
      }}
      whileTap={disabled ? {} : {
        scale: 0.98,
        y: 0
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      onClick={onClick ? handleClick : undefined}
      style={{ cursor: onClick && !disabled ? 'pointer' : 'default' }}
    >
      {children}
    </motion.div>
  )
})

PressableCard.displayName = 'PressableCard'

interface RippleButtonProps {
  children: React.ReactNode
  className?: string
  onClick?: (e: React.MouseEvent) => void
  disabled?: boolean
}

/**
 * Button with ripple effect on click
 */
export const RippleButton = memo<RippleButtonProps>(({
  children,
  className = '',
  onClick,
  disabled = false
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const rippleRef = useRef<HTMLSpanElement>(null)

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return

    // Create ripple effect
    if (buttonRef.current && rippleRef.current) {
      const button = buttonRef.current
      const rect = button.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      rippleRef.current.style.left = `${x}px`
      rippleRef.current.style.top = `${y}px`
      rippleRef.current.classList.remove('animate-ripple')
      // Trigger reflow
      void rippleRef.current.offsetWidth
      rippleRef.current.classList.add('animate-ripple')
    }

    onClick?.(e)
  }, [disabled, onClick])

  return (
    <button
      ref={buttonRef}
      className={`relative overflow-hidden ${className}`}
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
      <span
        ref={rippleRef}
        className="absolute w-0 h-0 bg-white/30 rounded-full pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
        style={{ opacity: 0 }}
      />
    </button>
  )
})

RippleButton.displayName = 'RippleButton'

interface ShakeOnErrorProps {
  children: React.ReactNode
  trigger: boolean
  className?: string
}

/**
 * Wrapper that shakes when triggered (for error states)
 */
export const ShakeOnError = memo<ShakeOnErrorProps>(({
  children,
  trigger,
  className = ''
}) => {
  return (
    <motion.div
      className={className}
      animate={trigger ? {
        x: [0, -10, 10, -10, 10, 0],
        transition: { duration: 0.4 }
      } : {}}
    >
      {children}
    </motion.div>
  )
})

ShakeOnError.displayName = 'ShakeOnError'

interface SuccessPulseProps {
  children: React.ReactNode
  trigger: boolean
  className?: string
}

/**
 * Wrapper that pulses green when triggered (for success states)
 */
export const SuccessPulse = memo<SuccessPulseProps>(({
  children,
  trigger,
  className = ''
}) => {
  return (
    <motion.div
      className={className}
      animate={trigger ? {
        scale: [1, 1.05, 1],
        transition: { duration: 0.3 }
      } : {}}
    >
      {children}
    </motion.div>
  )
})

SuccessPulse.displayName = 'SuccessPulse'
