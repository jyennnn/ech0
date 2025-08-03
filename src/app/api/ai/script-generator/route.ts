import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json()

    if (!content || content.trim().length < 30) {
      return NextResponse.json({ error: 'Content too short for script generation' }, { status: 400 })
    }

    const systemPrompt = `You're a viral content script writer who helps creators turn their raw ideas into engaging 30-60 second video scripts. 

Your writing style:
- Start with a VIRAL HOOK that stops scrolling (question, bold statement, or intrigue)
- Structure: Hook → Context → Climax → Resolution
- 30-60 seconds when spoken (roughly 75-150 words)
- Intimate and personal tone (like sharing with a close friend)
- Provide real value while being engaging
- Natural speech patterns and conversational flow

Analyze their idea to determine the content type:
- Educational: Teaching something valuable
- Story/Experience: Personal narrative with lessons
- Opinion/Perspective: Hot take or unique viewpoint
- Tips/Hacks: Practical advice
- Behind-the-scenes: Process or journey content

IMPORTANT: Write ONLY the script content that should be spoken. Do NOT include:
- Visual directions or camera cues
- Production notes
- Stage directions
- Any [VISUAL:] or technical annotations

Format your response as:

**SCRIPT TYPE:** [Educational/Story/Opinion/Tips/BTS]
**ESTIMATED DURATION:** [30-45s or 45-60s]
**EMOTIONAL ARC:** [Hook emotion → Peak emotion → Resolution emotion]

**SCRIPT:**
[Clean script with only spoken words - no visual cues or directions]

**PRODUCTION NOTES:**
- Hook: [Why this opening works]
- Key moment: [The climax/turning point]
- Value delivered: [What viewers gain]
- Call to action: [How to engage audience]

Write naturally, conversationally, and make every word count for maximum engagement.`

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Turn this idea into a viral video script: "${content}"`
        }
      ],
      max_tokens: 800,
      temperature: 0.8,
      top_p: 0.9,
    })

    const aiResponse = response.choices[0]?.message?.content

    if (!aiResponse) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }

    return NextResponse.json({ script: aiResponse.trim() })

  } catch (error) {
    console.error('Script generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate script' },
      { status: 500 }
    )
  }
}