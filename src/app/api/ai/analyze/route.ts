import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  console.log('=== API Route Debug Start ===')
  
  try {
    console.log('1. Parsing request body...')
    const requestBody = await request.json()
    console.log('2. Request body parsed:', {
      hasContent: !!requestBody.content,
      contentLength: requestBody.content?.length || 0,
      questionHistoryType: typeof requestBody.questionHistory,
      questionHistoryLength: Array.isArray(requestBody.questionHistory) ? requestBody.questionHistory.length : 'not array'
    })
    
    const { content, questionHistory = [] } = requestBody

    if (!content || content.trim().length < 30) {
      console.log('3. Content too short, returning empty questions')
      return NextResponse.json({ questions: [] })
    }

    console.log('4. Processing questionHistory...')
    // Safely handle questionHistory
    const safeQuestionHistory = Array.isArray(questionHistory) 
      ? questionHistory.filter(q => q && typeof q === 'string' && q.trim().length > 0)
      : []
    
    console.log('5. SafeQuestionHistory:', {
      originalLength: Array.isArray(questionHistory) ? questionHistory.length : 0,
      safeLength: safeQuestionHistory.length,
      safeQuestions: safeQuestionHistory
    })
    
    // Build the history instruction safely
    let historyInstruction = ''
    if (safeQuestionHistory.length > 0) {
      const recentQuestions = safeQuestionHistory.slice(-5) // Only last 5 to avoid overly long prompts
      console.log('6. Building history instruction with recent sparks:', recentQuestions)
      historyInstruction = `\nAvoid repeating these recent words/phrases: ${recentQuestions.join(', ')}`
    }

    console.log('7. Building system prompt...')
    const systemPrompt = `Generate 2-3 related words or short phrases that could spark new thinking about the content. Focus on concepts, perspectives, or connections that might not be obvious.

Examples:
["patterns", "timing", "context"]
["perspective shift", "impact", "ripple effects"]
["hidden connections", "timing", "scale"]

Keep it to single words or 2-3 word phrases. Make them thought-provoking and related to the content.${historyInstruction}

Return: ["word/phrase 1", "word/phrase 2", "word/phrase 3"]`

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
      max_tokens: 40,
      temperature: 1.0,
      top_p: 0.9,
      frequency_penalty: 0.8,
    })

    console.log('10. OpenAI API call successful')

    const aiResponse = response.choices[0]?.message?.content
    console.log('11. AI Response received:', {
      hasResponse: !!aiResponse,
      responseLength: aiResponse?.length || 0,
      response: aiResponse
    })

    if (!aiResponse) {
      console.log('12. No AI response, returning fallback sparks')
      return NextResponse.json({ questions: ["patterns", "timing", "perspective"] })
    }

    console.log('13. Attempting to parse AI response...')

    try {
      // Try to parse as JSON array first
      const questions = JSON.parse(aiResponse.trim())
      console.log('14. JSON parse successful:', questions)
      if (Array.isArray(questions)) {
        console.log('15. Returning parsed questions')
        return NextResponse.json({ questions })
      }
    } catch (parseError) {
      console.log('16. JSON parse failed, extracting manually:', parseError)
      // If not valid JSON, extract words/phrases manually
      const questions = aiResponse
        .split('\n')
        .map(line => line.replace(/^[-*\d."\[\]]\s*/, '').trim().replace(/["\[\],]/g, ''))
        .filter(phrase => phrase.length > 2 && phrase.length < 30) // reasonable length for words/phrases
        .slice(0, 3)

      console.log('17. Manually extracted sparks:', questions)
      return NextResponse.json({ questions: questions.length > 0 ? questions : ["patterns", "timing", "context"] })
    }

  } catch (error) {
    console.error('=== API ERROR ===')
    console.error('Error type:', error?.constructor?.name)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Full error object:', error)
    console.error('=== END API ERROR ===')
    
    return NextResponse.json(
      { questions: ["patterns", "timing", "context"] },
      { status: 200 }
    )
  }
}