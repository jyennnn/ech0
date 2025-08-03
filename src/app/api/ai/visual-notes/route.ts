import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { script } = await request.json()

    if (!script || script.trim().length < 50) {
      return NextResponse.json({ error: 'Script too short for visual notes generation' }, { status: 400 })
    }

    const systemPrompt = `You're a video production assistant who adds visual/filming directions to scripts. Your job is to take an existing script and enhance it by inserting visual notes after every 2 sentences.

IMPORTANT RULES:
1. Insert a visual note after every 2 sentences
2. Keep the original script text EXACTLY as it is
3. Add visual notes in this format: [VISUAL: specific direction]
4. Make visual notes practical for solo content creators
5. Return the COMPLETE script with visual notes inserted

Your visual notes should include:
- Camera angles (close-up, medium shot, wide shot)
- Hand gestures and body language
- Facial expressions and energy level
- B-roll or cutaway suggestions
- Props or visual elements to show
- Transitions and pacing cues

Example format:
"First sentence here. Second sentence here.
[VISUAL: Close-up shot, lean forward slightly, use hand gesture to emphasize key point]
Third sentence continues. Fourth sentence ends this section.
[VISUAL: Cut to medium shot, show prop or visual aid, maintain eye contact with camera]"

Count sentences carefully and insert visual notes consistently after every 2 sentences. Be specific and actionable.`

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Add visual/filming notes to this script:\n\n${script}`
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
      top_p: 0.9,
    })

    const aiResponse = response.choices[0]?.message?.content

    if (!aiResponse) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }

    return NextResponse.json({ enhancedScript: aiResponse.trim() })

  } catch (error) {
    console.error('Visual notes generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate visual notes' },
      { status: 500 }
    )
  }
}