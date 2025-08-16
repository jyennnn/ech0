import { useRef, useCallback } from 'react'
import { ContentStates, GenerationStates } from '../types/noteEditor'
import { aiService } from '@/services/aiService'

// Visual notes timing constants
const TYPING_ANIMATION_SPEED = 25    // 25ms between each character when typing visual notes
const VISUAL_NOTE_PAUSE_MS = 500     // 500ms pause between visual note insertions

export const useVisualNotes = (
  scriptTextareaRef: React.RefObject<HTMLTextAreaElement>,
  setContentStates: React.Dispatch<React.SetStateAction<ContentStates>>,
  setGenerationStates: React.Dispatch<React.SetStateAction<GenerationStates>>
) => {
  const typingTimeoutsRef = useRef<NodeJS.Timeout[]>([])

  const addVisualNotes = useCallback(async (scriptContent: string) => {
    if (!scriptContent.trim()) {
      alert('Generate a script first before adding visual notes.')
      return
    }

    setGenerationStates((prev) => ({ ...prev, visualNotes: true }))
    
    try {
      const enhancedScript = await aiService.generateVisualNotes(scriptContent)
      
      if (enhancedScript) {
        typeVisualNotesIntoScript(enhancedScript, scriptContent)
      } else {
        setGenerationStates((prev) => ({ ...prev, visualNotes: false }))
      }
    } catch (error) {
      console.error('Visual notes generation failed:', error)
      alert('Failed to generate visual notes. Please try again.')
      setGenerationStates((prev) => ({ ...prev, visualNotes: false }))
    }
  }, [setGenerationStates])

  const stopAddingVisualNotes = useCallback(() => {
    typingTimeoutsRef.current.forEach(timeout => clearTimeout(timeout))
    typingTimeoutsRef.current = []
    
    setGenerationStates((prev) => ({ ...prev, visualNotes: false }))
    
    if (scriptTextareaRef.current) {
      scriptTextareaRef.current.readOnly = false
    }
  }, [scriptTextareaRef, setGenerationStates])

  const typeVisualNotesIntoScript = useCallback(async (enhancedScript: string, originalScript: string) => {
    const finalScript = enhancedScript.trim()
    
    if (!finalScript) {
      setGenerationStates((prev) => ({ ...prev, visualNotes: false }))
      return
    }
    
    const visualNotes: Array<{insertAfterText: string, content: string}> = []
    const lines = finalScript.split('\n')
    let textSoFar = ''
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      if (line.startsWith('[VISUAL:')) {
        if (textSoFar.trim()) {
          visualNotes.push({
            insertAfterText: textSoFar.trim(),
            content: line
          })
        }
      } else if (line.length > 0) {
        textSoFar += (textSoFar ? '\n' : '') + line
      }
    }
    
    let currentContent = originalScript.trim()
    let noteIndex = 0
    
    const insertNextVisualNote = () => {
      if (noteIndex >= visualNotes.length) {
        setGenerationStates((prev) => ({ ...prev, visualNotes: false }))
        if (scriptTextareaRef.current) {
          scriptTextareaRef.current.readOnly = false
        }
        return
      }
      
      const visualNote = visualNotes[noteIndex]
      const insertAfterText = visualNote.insertAfterText
      let insertionPoint = currentContent.indexOf(insertAfterText)
      
      if (insertionPoint === -1) {
        const sentences = insertAfterText.split(/[.!?]+/).filter(s => s.trim())
        if (sentences.length > 0) {
          const lastSentence = sentences[sentences.length - 1].trim()
          const sentencePatterns = [
            lastSentence + '.',
            lastSentence + '!', 
            lastSentence + '?'
          ]
          
          for (const pattern of sentencePatterns) {
            const patternIndex = currentContent.indexOf(pattern)
            if (patternIndex !== -1) {
              insertionPoint = patternIndex + pattern.length
              break
            }
          }
        }
      }
      
      if (insertionPoint === -1) {
        noteIndex++
        insertNextVisualNote()
        return
      }
      
      const insertPosition = insertAfterText.length > 0 ? insertionPoint + insertAfterText.length : insertionPoint
      const beforeText = currentContent.substring(0, insertPosition)
      const afterText = currentContent.substring(insertPosition)
      
      currentContent = beforeText + '\n'
      setContentStates((prev) => ({ ...prev, script: currentContent }))
      
      let charIndex = 0
      const visualNoteText = visualNote.content
      
      const typeChar = () => {
        if (charIndex < visualNoteText.length) {
          const partialVisualNote = visualNoteText.substring(0, charIndex + 1)
          setContentStates((prev) => ({ ...prev, script: beforeText + '\n' + partialVisualNote + afterText }))
          charIndex++
          
          setTimeout(() => {
            if (scriptTextareaRef.current) {
              const textarea = scriptTextareaRef.current
              const shouldAutoScroll = textarea.scrollTop >= textarea.scrollHeight - textarea.clientHeight - 100
              if (shouldAutoScroll) {
                textarea.scrollTop = textarea.scrollHeight
              }
            }
          }, 10)
          
          const timeout = setTimeout(typeChar, TYPING_ANIMATION_SPEED)
          typingTimeoutsRef.current.push(timeout)
        } else {
          currentContent = beforeText + '\n' + visualNoteText + afterText
          noteIndex++
          const timeout = setTimeout(insertNextVisualNote, VISUAL_NOTE_PAUSE_MS)
          typingTimeoutsRef.current.push(timeout)
        }
      }
      
      const timeout = setTimeout(typeChar, 300)
      typingTimeoutsRef.current.push(timeout)
    }
    
    insertNextVisualNote()
  }, [scriptTextareaRef, setContentStates, setGenerationStates])

  return {
    addVisualNotes,
    stopAddingVisualNotes
  }
}