import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { message, projects, transactions, clients } = req.body
  if (!message) return res.status(400).json({ error: 'message は必須です' })

  const prompt = `あなたはフリーランス業務管理アシスタントです。
以下はユーザーの現在のデータです。このデータを参照して質問に回答してください。
金額は円で、カンマ区切りで表示してください。
データにない情報を推測で答えないでください。

【案件一覧】
${JSON.stringify(projects ?? [])}

【入出金一覧】
${JSON.stringify(transactions ?? [])}

【クライアント一覧】
${JSON.stringify(clients ?? [])}

ユーザーの質問: ${message}`

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent(prompt)
    const reply = result.response.text()
    return res.status(200).json({ reply })
  } catch (err) {
    console.error('Gemini API error:', err)
    return res.status(500).json({ error: 'AI応答の取得に失敗しました' })
  }
}
