import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { originalContent, conversation } = await request.json()

    // Analyze conversation depth and emotional progression
    const conversationDepth = conversation.length
    const lastUserMessage = conversation.filter((msg: any) => msg.type === 'user').slice(-1)[0]?.content || ""
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You're helping someone develop their content idea through conversation. Be an enthusiastic content creation buddy.

React to what they just said, then ask one practical question to help them move closer to creating actual content - like how to structure it, what the hook should be, or what format would work best.

Keep it natural and conversational, like a friend excited about their creative project.`
        },
        {
          role: "user",
          content: `Original idea: "${originalContent}"

${conversation.map((msg: any) => {
  const speaker = msg.type === 'ai' ? 'You' : 'Them'
  return `${speaker}: ${msg.content}`
}).join('\n')}

Them: ${lastUserMessage}`
        }
      ],
      max_tokens: 80,
      temperature: 1.0,
      top_p: 0.95,
      frequency_penalty: 0.6,
    })

    const aiResponse = response.choices[0]?.message?.content

    if (!aiResponse) {
      return NextResponse.json({ response: "I love the direction this is going! What's the best way to structure this as content?" })
    }

    // Let AI respond naturally, no JSON required
    const aiResponseText = aiResponse.trim()
    return NextResponse.json({ response: aiResponseText })

  } catch (error) {
    console.error('OpenAI API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate follow-up response' },
      { status: 500 }
    )
  }
}