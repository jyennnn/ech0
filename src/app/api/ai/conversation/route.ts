import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  console.log('=== Conversation API Debug Start ===')
  
  try {
    console.log('1. Parsing request body...')
    const requestBody = await request.json()
    console.log('2. Request body parsed:', {
      hasOriginalContent: !!requestBody.originalContent,
      hasBackgroundWords: Array.isArray(requestBody.backgroundWords),
      conversationLength: Array.isArray(requestBody.conversation) ? requestBody.conversation.length : 0
    })
    
    const { originalContent, backgroundWords = [], conversation = [] } = requestBody

    if (!originalContent || originalContent.trim().length < 30) {
      console.log('3. Original content too short, returning error')
      return NextResponse.json({ error: 'Content too short for conversation' }, { status: 400 })
    }

    console.log('4. Building conversation context...')
    
    // Build context with background words
    let contextInstruction = ''
    if (backgroundWords.length > 0) {
      contextInstruction = `\nBackground research words generated: ${backgroundWords.join(', ')}`
    }

    // Build conversation history
    let conversationContext = ''
    if (conversation.length > 0) {
      conversationContext = conversation.map((msg: { role: string; content: string }) => {
        return `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`
      }).join('\n')
    }

    console.log('5. Building system prompt...')
    const systemPrompt = `You're a curious friend who loves exploring ideas. Use dependency grammar - keep closely related words near each other for easy comprehension.

AVOID formulaic patterns like:
- "It sounds like..."
- "What specific..."
- "Can you tell me more about..."
- "That's interesting..."
- "I'm curious about..."

Instead, respond naturally by:
- Picking up specific words they used and building directly on them
- Asking about contradictions you notice
- Questioning assumptions without announcing you're doing it
- Connecting their words to unexpected ideas
- Using natural speech patterns and casual interjections

Structure responses for easy understanding - put related concepts close together. Jump right into the interesting part instead of using conversation starters.${contextInstruction}

Examples:
Bad: "That's interesting! What specific aspect of productivity appeals to you?"
Good: "Productivity... but you mentioned feeling scattered. Does being productive actually help with that scattered feeling, or make it worse?"

Bad: "It sounds like you're exploring creativity. Can you tell me more?"
Good: "Wait, you said 'structured creativity' - isn't that kind of contradictory? How do you structure something that's supposed to be spontaneous?"`

    console.log('6. System prompt created, length:', systemPrompt.length)
    console.log('7. Making OpenAI API call...')

    const messages: Array<{role: 'system' | 'user' | 'assistant', content: string}> = [
      {
        role: "system" as const,
        content: systemPrompt
      }
    ]

    // Add conversation history if it exists
    if (conversationContext) {
      messages.push({
        role: "user" as const, 
        content: `Previous conversation:\n${conversationContext}\n\nOriginal content: "${originalContent}"`
      })
    } else {
      // First message in conversation
      messages.push({
        role: "user" as const,
        content: `"${originalContent}"`
      })
    }

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      max_tokens: 150,
      temperature: 1.1,
      top_p: 0.95,
      frequency_penalty: 0.3,
      presence_penalty: 0.2,
    })

    console.log('8. OpenAI API call successful')

    const aiResponse = response.choices[0]?.message?.content
    console.log('9. AI Response received:', {
      hasResponse: !!aiResponse,
      responseLength: aiResponse?.length || 0,
      response: aiResponse
    })

    if (!aiResponse) {
      console.log('10. No AI response, returning fallback')
      return NextResponse.json({ 
        response: "Oh interesting! There's something in what you wrote that really caught my attention. What got you thinking about this in the first place?" 
      })
    }

    console.log('11. Returning AI response')
    return NextResponse.json({ response: aiResponse.trim() })

  } catch (error) {
    console.error('=== CONVERSATION API ERROR ===')
    console.error('Error type:', error?.constructor?.name)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Full error object:', error)
    console.error('=== END CONVERSATION API ERROR ===')
    
    return NextResponse.json(
      { response: "Hmm, I'm having trouble connecting right now, but I'm really curious about what you're thinking. Want to try telling me more?" },
      { status: 200 }
    )
  }
}