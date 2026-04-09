import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { message, userId } = req.body
  if (!message || !userId) return res.status(400).json({ error: 'message と userId は必須です' })

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const [{ data: projects }, { data: transactions }, { data: clients }] = await Promise.all([
    supabase.from('projects').select('*').eq('user_id', userId),
    supabase.from('transactions').select('*').eq('user_id', userId),
    supabase.from('clients').select('*').eq('user_id', userId),
  ])

  const systemPrompt = `あなたはフリーランス業務管理アシスタントです。
以下はユーザーの現在のデータです。このデータを参照して質問に回答してください。
金額は円で、カンマ区切りで表示してください。
データにない情報を推測で答えないでください。

【案件一覧】
${JSON.stringify(projects ?? [])}

【入出金一覧】
${JSON.stringify(transactions ?? [])}

【クライアント一覧】
${JSON.stringify(clients ?? [])}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
    })

    const reply = response.content[0].text
    return res.status(200).json({ reply })
  } catch (err) {
    console.error('Anthropic API error:', err)
    return res.status(500).json({ error: 'AI応答の取得に失敗しました' })
  }
}
