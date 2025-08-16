import { Captions } from '@/types/noteEditor'

export class AIService {
  async generateScript(content: string, videoType: string): Promise<string> {
    const response = await fetch('/api/ai/script-generator', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        content,
        videoType 
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to generate script')
    }

    const data = await response.json()
    return data.script
  }

  async generateCaptions(content: string): Promise<Captions> {
    const response = await fetch('/api/ai/caption-generator', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    })

    if (!response.ok) {
      throw new Error('Failed to generate captions')
    }

    const data = await response.json()
    return data.captions
  }

  async generateVisualNotes(script: string): Promise<string> {
    const response = await fetch('/api/ai/visual-notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ script }),
    })

    if (!response.ok) {
      throw new Error('Failed to generate visual notes')
    }

    const data = await response.json()
    return data.visualNotes
  }
}

export const aiService = new AIService()