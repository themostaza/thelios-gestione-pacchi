'use client'

import React, { useState, useEffect, useCallback } from 'react'

interface DecryptedTextProps {
  text: string
  speed?: number
  maxIterations?: number
  characters?: string
  className?: string
  parentClassName?: string
  encryptedClassName?: string
  animateOn?: 'hover' | 'view' | 'always'
  revealDirection?: 'left' | 'right' | 'center'
  isProcessing?: boolean
}

const DecryptedText: React.FC<DecryptedTextProps> = ({
  text,
  speed = 100,
  maxIterations = 20,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()',
  className = '',
  parentClassName = '',
  encryptedClassName = '',
  animateOn = 'always',
  revealDirection = 'left',
  isProcessing = true
}) => {
  const [displayText, setDisplayText] = useState('')
  const [isAnimating, setIsAnimating] = useState(false)
  const [hasRevealed, setHasRevealed] = useState(false)

  const generateRandomText = useCallback((length: number): string => {
    let result = ''
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return result
  }, [characters])

  useEffect(() => {
    if (animateOn === 'always') {
      if (isProcessing) {
        // Continuous random animation during processing
        setIsAnimating(true)
        const animate = () => {
          if (!isProcessing) {
            setIsAnimating(false)
            return
          }
          setDisplayText(generateRandomText(text.length))
          setTimeout(animate, speed)
        }
        animate()
      } else if (!hasRevealed) {
        // Reveal the final text when processing is done
        setIsAnimating(true)
        let iteration = 0
        
        const reveal = () => {
          if (iteration >= maxIterations) {
            setDisplayText(text)
            setIsAnimating(false)
            setHasRevealed(true)
            return
          }

          const progress = iteration / maxIterations
          const currentLength = Math.floor(text.length * progress)
          
          let newText = ''
          for (let i = 0; i < text.length; i++) {
            if (i < currentLength) {
              newText += text[i]
            } else {
              newText += generateRandomText(1)
            }
          }

          setDisplayText(newText)
          iteration++
          setTimeout(reveal, speed)
        }
        
        reveal()
      }
    }
  }, [animateOn, isProcessing, hasRevealed, text, speed, maxIterations, characters, generateRandomText])

  const getRevealStyle = () => {
    if (revealDirection === 'center') {
      return { textAlign: 'center' as const }
    }
    return {}
  }

  return (
    <div
      className={`decrypted-text ${parentClassName}`}
      style={getRevealStyle()}
    >
      <span
        className={`${className} ${isAnimating && !hasRevealed ? encryptedClassName : ''}`}
        style={{
          fontFamily: 'monospace',
          letterSpacing: '0.1em',
          transition: 'all 0.1s ease'
        }}
      >
        {displayText || generateRandomText(text.length)}
      </span>
    </div>
  )
}

export default DecryptedText 