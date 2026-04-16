import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const ACTIONS_INSTRUCTION = `
もしユーザーの要求が「プロジェクトを作成」「取引を記録」「クライアントを追加」といったアクション実行を含む場合は、
通常の回答の末尾に以下のJSON形式でアクション提案を含めてください（含めない場合は省略）：

<actions>
[{"type": "create_project", "label": "プロジェクトを作成", "data": {"title": "...", "status": "estimate", "amount": 0}},
 {"type": "create_transaction", "label": "取引を記録", "data": {"type": "income", "amount": 0, "date": "YYYY-MM-DD"}},
 {"type": "create_client", "label": "クライアントを追加", "data": {"name": "..."}}]
</actions>

アクション提案が不要な場合は<actions>タグを含めないでください。
`

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { message, projects, transactions, clients, stream: wantStream } = req.body
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

${ACTIONS_INSTRUCTION}

ユーザーの質問: ${message}`

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    if (wantStream) {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')

      const streamResult = await model.generateContentStream(prompt)

      for await (const chunk of streamResult.stream) {
        const text = chunk.text()
        if (text) {
          res.write(`data: ${JSON.stringify({ text })}\n\n`)
        }
      }

      res.write('data: [DONE]\n\n')
      return res.end()
    } else {
      const result = await model.generateContent(prompt)
      const reply = result.response.text()
      return res.status(200).json({ reply })
    }
  } catch (err) {
    console.error('Gemini API error:', err)
    if (wantStream && !res.headersSent) {
      return res.status(500).json({ error: 'AI応答の取得に失敗しました' })
    }
    if (!res.headersSent) {
      return res.status(500).json({ error: 'AI応答の取得に失敗しました' })
    }
    res.end()
  }
}
