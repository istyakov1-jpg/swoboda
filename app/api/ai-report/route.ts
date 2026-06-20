import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json()

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await res.json()
    const text = data.content?.[0]?.text ?? '{}'

    let report
    try {
      report = JSON.parse(text.replace(/```json|```/g, '').trim())
    } catch {
      report = {
        archetype: 'Осторожный игрок',
        traits: ['Осторожный', 'Методичный', 'Стабильный'],
        strengths: ['Контролируешь расходы', 'Не паникуешь в кризис'],
        weaknesses: ['Упускаешь возможности', 'Слишком осторожен с кредитом'],
        business_parallel: 'Ты строишь медленно но надёжно. В реальном бизнесе это работает — но конкуренты с плечом обгоняют.',
        main_recommendation: 'Попробуй взять один актив в кредит и посмотри как работает плечо на практике.',
        fin_iq: 62,
      }
    }

    return NextResponse.json({ report })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
