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
    const systemPrompt = `You're a thoughtful friend helping someone explore their ideas through conversation. Your goal is to:

1. Ask perspective-shifting questions that help them see their thoughts from different angles
2. Help them clarify and organize their thinking 
3. Build confidence in their ideas through gentle exploration
4. Be conversational and supportive, not formal or clinical

Keep responses short (1-2 sentences), natural, and focused on one main question or insight at a time.${contextInstruction}

If this is the start of conversation, begin by acknowledging their thoughts and asking one thoughtful question about what interests you most.`

    console.log('6. System prompt created, length:', systemPrompt.length)
    console.log('7. Making OpenAI API call...')

    const messages = [
      {
        role: "system",
        content: systemPrompt
      }
    ]

    // Add conversation history if it exists
    if (conversationContext) {
      messages.push({
        role: "user", 
        content: `Previous conversation:\n${conversationContext}\n\nOriginal content: "${originalContent}"`
      })
    } else {
      // First message in conversation
      messages.push({
        role: "user",
        content: `"${originalContent}"`
      })
    }

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      max_tokens: 80,
      temperature: 0.9,
      top_p: 0.95,
      frequency_penalty: 0.6,
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
        response: "That's really interesting! What made you start thinking about this particular topic?" 
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
      { response: "I'd love to hear more about what you're thinking. What aspect interests you most?" },
      { status: 200 }
    )
  }
}