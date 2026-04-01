export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// Simulate streaming by emitting text character by character
async function simulateStream(text: string, onChunk: (text: string) => void, signal?: AbortSignal): Promise<void> {
  const words = text.split('')
  let i = 0
  while (i < words.length) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    const chunk = words.slice(i, i + 3).join('')
    onChunk(chunk)
    i += 3
    await new Promise(r => setTimeout(r, 15))
  }
}

// Demo fallback responses keyed by partial prompt match
const DEMO_RESPONSES: Record<string, string> = {
  '產線數據': `根據目前產線數據分析，提出以下建議：

1. **L3 饅頭線稼動率偏低** — 目前僅 78%，建議降低線速至 80% 以減少待機損耗，預計節電 12%
2. **L1 包子線 OEE 可優化** — 當前 82.5%，建議切換至節能模式（降低蒸汽壓力 0.2 MPa），可提升至 87% 且不影響品質
3. **L2 水餃線表現最佳** — OEE 88.5%，建議作為標竿複製其排程模式至其他產線`,

  '品質': `批次品質分析報告：

1. **重量偏差** — 此批次重量偏離標準值 2.3%，可能原因：計量泵校正偏移或原料含水率變化
2. **外觀分數偏低** — 建議檢查成型模具磨損狀況，上次更換已超過 15 天
3. **改善步驟** — (1) 立即校正計量泵 (2) 抽檢下 3 批次確認趨勢 (3) 排程模具清潔
4. **是否可延後** — 不建議，連續 2 批偏差需立即處理以符合 HACCP 管制點要求`,

  '冷鏈': `冷鏈環境分析建議：

1. **急速冷凍庫 A 壓縮機負載偏高 (85%)** — 建議開啟 B 庫分擔負載，預計降至 62%
2. **冷藏暫存區溫度波動** — 出貨碼頭門開啟頻率過高，建議啟用氣簾裝置減少冷量外洩
3. **除霜排程優化** — 目前固定每 4 小時，AI 建議改為根據蒸發器結霜感測器觸發，預估節電 18%
4. **倉儲空間** — 冷凍儲存區 2 僅用 41%，建議整合至儲存區 1 以關閉一台壓縮機`,

  '設備': `設備診斷分析：

1. **可能原因** — 軸承潤滑不足導致振動值上升，連續運轉 2,400 小時未補充潤滑脂
2. **建議處理步驟** — (1) 停機補充高溫潤滑脂 200ml (2) 更換密封圈 (3) 振動感測器校正
3. **是否可延後** — 最多延後 3 天，超過則有軸承抱死風險，將導致產線停擺 8 小時以上
4. **預防措施** — 建立自動潤滑排程，每 1,500 運轉小時自動提醒，預估年節省維修費 NT$48,000`,

  '原料庫存': `未來 7 天需求預測與採購建議：

1. **高麗菜 [緊急]** — 現有庫存低於安全量，預測 3 天內耗盡，建議立即採購 2,400 kg（3 天用量）
2. **豬絞肉 [注意]** — 可用天數僅 1.8 天，前置時間 1 天，建議今日下單 4,500 kg
3. **中筋麵粉** — 庫存充足但下週有促銷出貨量預計增加 30%，建議提前補貨 9,600 kg
4. **蔥花（冷凍）** — 可用天數 3 天，前置時間 2 天，建議明日下單 600 kg
5. **預估總採購金額** — NT$287,500，建議合併下單以獲得量價折扣約 NT$12,000`,

  '空調': `AI 環境調控綜合分析：

1. **包子產線區人數最多 (12人)** — 活動量高，薄衣居多，建議溫度降至 22°C，風量提升至 78%
2. **品管實驗室人員穿厚外套** — 建議溫度維持 24°C 不調整，避免檢驗人員不適
3. **倉儲走道人流稀疏** — 建議風量降至 40% 節能模式，預估省電 25%
4. **整體節能效果** — 透過 AI 分區調控，預估比統一溫控節省 18% 冷氣電費，月省約 NT$15,000`,
}

function findDemoResponse(messages: ChatMessage[]): string | null {
  const lastMsg = messages[messages.length - 1]?.content ?? ''
  for (const [key, response] of Object.entries(DEMO_RESPONSES)) {
    if (lastMsg.includes(key)) return response
  }
  // Generic fallback
  return null
}

export async function streamChat(
  messages: ChatMessage[],
  model: string,
  systemPrompt: string,
  onChunk: (text: string) => void,
  signal?: AbortSignal
): Promise<void> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, model, systemPrompt }),
      signal,
    })

    if (!response.ok) {
      throw new Error('API error')
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let hasContent = false
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const text = decoder.decode(value, { stream: true })
      if (text) hasContent = true
      onChunk(text)
    }

    // If streaming returned empty, use demo fallback
    if (!hasContent) {
      const fallback = findDemoResponse(messages)
      if (fallback) await simulateStream(fallback, onChunk, signal)
    }
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
    // On any error, fall back to demo response with simulated streaming
    const fallback = findDemoResponse(messages)
    if (fallback) {
      await simulateStream(fallback, onChunk, signal)
    } else {
      throw err
    }
  }
}
