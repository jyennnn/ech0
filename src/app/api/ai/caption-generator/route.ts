import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json()

    if (!content || content.trim().length < 30) {
      return NextResponse.json({ error: 'Content too short for caption generation' }, { status: 400 })
    }

    const systemPrompt = `You're a social media expert who creates platform-optimized captions. Generate captions for Instagram, LinkedIn, X (Twitter), and TikTok based on the provided content.

Platform Guidelines:
- Instagram: 2,200 chars max, engaging with emojis, hashtags, storytelling tone
- LinkedIn: 3,000 chars max, professional insights, thought leadership, business focus
- X (Twitter): 280 chars max, concise, punchy, conversation starters
- TikTok: 2,200 chars max, trendy, fun, hashtag-heavy, younger audience appeal

Content Adaptation Rules:
- Each platform should have unique copy, not just shortened versions
- Use platform-specific language and tone
- Include relevant hashtags for each platform
- Optimize for engagement and platform algorithms
- Keep the core message but adapt presentation style

Return your response as a JSON object with this exact structure:
{
  "captions": {
    "instagram": "Instagram caption here...",
    "linkedin": "LinkedIn post here...", 
    "x": "X post here...",
    "tiktok": "TikTok caption here..."
  }
}

Make each caption native to its platform while maintaining the essence of the original content.`

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Create platform-optimized social media captions for this content:\n\n"${content}"`
        }
      ],
      max_tokens: 1500,
      temperature: 0.8,
      top_p: 0.9,
    })

    const aiResponse = response.choices[0]?.message?.content

    if (!aiResponse) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }

    try {
      // Parse the JSON response from AI
      const parsedResponse = JSON.parse(aiResponse)
      
      if (!parsedResponse.captions) {
        throw new Error('Invalid response structure')
      }

      return NextResponse.json(parsedResponse)
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      return NextResponse.json({ error: 'Invalid AI response format' }, { status: 500 })
    }

  } catch (error) {
    console.error('Caption generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate captions' },
      { status: 500 }
    )
  }
}