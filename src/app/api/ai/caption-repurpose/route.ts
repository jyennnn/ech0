import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { originalContent, existingCaption, currentCaptions } = await request.json()

    if (!originalContent || !existingCaption) {
      return NextResponse.json({ error: 'Missing required content' }, { status: 400 })
    }

    // Determine which platforms need captions
    const emptyPlatforms = []
    if (!currentCaptions.instagram) emptyPlatforms.push('instagram')
    if (!currentCaptions.linkedin) emptyPlatforms.push('linkedin') 
    if (!currentCaptions.x) emptyPlatforms.push('x')
    if (!currentCaptions.tiktok) emptyPlatforms.push('tiktok')

    if (emptyPlatforms.length === 0) {
      return NextResponse.json({ error: 'All platforms already have captions' }, { status: 400 })
    }

    const systemPrompt = `You're a social media expert who repurposes content across platforms. Take an existing caption and adapt it for other social media platforms.

Platform Guidelines:
- Instagram: 2,200 chars max, engaging with emojis, hashtags, storytelling tone
- LinkedIn: 3,000 chars max, professional insights, thought leadership, business focus
- X (Twitter): 280 chars max, concise, punchy, conversation starters
- TikTok: 2,200 chars max, trendy, fun, hashtag-heavy, younger audience appeal

Repurposing Rules:
- Each platform needs unique copy that's native to that platform
- Don't just shorten or lengthen - completely rewrite for platform culture
- Maintain the core message but adapt tone, style, and format
- Use platform-specific hashtags and language
- Optimize for each platform's audience and algorithm

Generate captions ONLY for the requested platforms: ${emptyPlatforms.join(', ')}

Return your response as a JSON object with this structure:
{
  "captions": {
    ${emptyPlatforms.map(platform => `"${platform}": "Caption for ${platform}..."`).join(',\n    ')}
  }
}

Focus on making each caption feel authentic to its platform while keeping the essence of the original message.`

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Original content: "${originalContent}"

Existing caption to repurpose: "${existingCaption}"

Please create captions for: ${emptyPlatforms.join(', ')}`
        }
      ],
      max_tokens: 1200,
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
    console.error('Caption repurposing error:', error)
    return NextResponse.json(
      { error: 'Failed to repurpose captions' },
      { status: 500 }
    )
  }
}