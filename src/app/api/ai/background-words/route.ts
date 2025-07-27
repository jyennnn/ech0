import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  console.log('=== Background Words API Debug Start ===')
  
  try {
    console.log('1. Parsing request body...')
    const requestBody = await request.json()
    console.log('2. Request body parsed:', {
      hasContent: !!requestBody.content,
      contentLength: requestBody.content?.length || 0,
      previousWordsLength: Array.isArray(requestBody.previousWords) ? requestBody.previousWords.length : 0
    })
    
    const { content, previousWords = [] } = requestBody

    if (!content || content.trim().length < 50) {
      console.log('3. Content too short for background words, returning empty')
      return NextResponse.json({ words: [] })
    }

    console.log('4. Processing previous words...')
    // Safely handle previous words for avoiding repetition
    const safePreviousWords = Array.isArray(previousWords) 
      ? previousWords.filter(w => w && typeof w === 'string' && w.trim().length > 0)
      : []
    
    console.log('5. SafePreviousWords:', {
      originalLength: Array.isArray(previousWords) ? previousWords.length : 0,
      safeLength: safePreviousWords.length,
      recentWords: safePreviousWords.slice(-8) // Show last 8 for context
    })
    
    // Build the history instruction safely
    let historyInstruction = ''
    if (safePreviousWords.length > 0) {
      const recentWords = safePreviousWords.slice(-8) // Only last 8 to avoid overly long prompts
      console.log('6. Building history instruction with recent words:', recentWords)
      historyInstruction = `\nAvoid repeating these recent words: ${recentWords.join(', ')}`
    }

    console.log('7. Building system prompt...')
    const systemPrompt = `Generate 5-6 educational trigger words that could inspire deeper thinking, research, or highlight key topics related to the content. Focus on:

- Concepts worth exploring further
- Research topics or fields of study
- Broader themes or patterns
- Different perspectives or angles
- Technical terms or methodologies

Examples:
["psychology", "data patterns", "user behavior", "cognitive bias", "market trends", "systems thinking"]
["research methods", "social dynamics", "historical context", "cultural impact", "economic factors"]

Keep words/phrases short (1-3 words), educational, and thought-provoking.${historyInstruction}

Return: ["word1", "word2", "word3", "word4", "word5", "word6"]`

    console.log('8. System prompt created, length:', systemPrompt.length)
    console.log('9. Making OpenAI API call...')

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `"${content}"`
        }
      ],
      max_tokens: 25, // Very small for just 5-6 words
      temperature: 0.8,
      top_p: 0.9,
      frequency_penalty: 0.7,
    })

    console.log('10. OpenAI API call successful')

    const aiResponse = response.choices[0]?.message?.content
    console.log('11. AI Response received:', {
      hasResponse: !!aiResponse,
      responseLength: aiResponse?.length || 0,
      response: aiResponse
    })

    if (!aiResponse) {
      console.log('12. No AI response, returning fallback words')
      return NextResponse.json({ words: ["research", "patterns", "context", "perspective", "systems"] })
    }

    console.log('13. Attempting to parse AI response...')
    try {
      // Try to parse as JSON array first
      const words = JSON.parse(aiResponse.trim())
      console.log('14. JSON parse successful:', words)
      if (Array.isArray(words)) {
        console.log('15. Returning parsed words')
        return NextResponse.json({ words: words.slice(0, 6) }) // Ensure max 6 words
      }
    } catch (parseError) {
      console.log('16. JSON parse failed, extracting manually:', parseError)
      // If not valid JSON, extract words/phrases manually
      const words = aiResponse
        .split('\n')
        .map(line => line.replace(/^[-*\d."\[\]]\s*/, '').trim().replace(/["\[\],]/g, ''))
        .filter(word => word.length > 2 && word.length < 25) // reasonable length for educational words
        .slice(0, 6)

      console.log('17. Manually extracted words:', words)
      return NextResponse.json({ words: words.length > 0 ? words : ["research", "patterns", "context", "perspective", "systems"] })
    }

  } catch (error) {
    console.error('=== BACKGROUND WORDS API ERROR ===')
    console.error('Error type:', error?.constructor?.name)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Full error object:', error)
    console.error('=== END BACKGROUND WORDS API ERROR ===')
    
    return NextResponse.json(
      { words: ["research", "patterns", "context", "perspective", "systems"] },
      { status: 200 }
    )
  }
}