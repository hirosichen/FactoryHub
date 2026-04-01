export interface Module {
  id: string
  name: string
  nameEn: string
  description: string
  icon: string
  type: 'dashboard' | 'chat' | 'interactive' | 'system'
  systemPrompt?: string
  defaultModel?: string
}

export const MODELS = [
  { id: 'qwen3-30b-a3b-fp8', name: 'Qwen3 30B', description: '快速回應，適合一般對話' },
  { id: 'llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout 17B', description: '深度推理，適合複雜分析' },
] as const

export const modules: Module[] = [
  {
    id: 'production',
    name: '產線監控',
    nameEn: 'Production Monitor',
    description: '即時產線狀態監控、產量追蹤、OEE 分析',
    icon: '🏭',
    type: 'dashboard',
  },
  {
    id: 'quality',
    name: '品質管理',
    nameEn: 'Quality Control',
    description: 'AI 品質檢測、異常分析、SPC 管制圖',
    icon: '🔬',
    type: 'dashboard',
  },
  {
    id: 'coldchain',
    name: '冷鏈管理',
    nameEn: 'Cold Chain',
    description: '倉儲溫控監控、冷鏈物流追蹤、異常警報',
    icon: '🧊',
    type: 'dashboard',
  },
  {
    id: 'maintenance',
    name: '設備維護',
    nameEn: 'Maintenance AI',
    description: 'AI 預測性維護、設備健康監控、自動工單',
    icon: '🔧',
    type: 'dashboard',
  },
  {
    id: 'inventory',
    name: '物料叫料',
    nameEn: 'Inventory System',
    description: '原料庫存管理、自動叫料、供應鏈追蹤',
    icon: '📦',
    type: 'interactive',
  },
  {
    id: 'assistant',
    name: '智能助理',
    nameEn: 'AI Assistant',
    description: '食品法規諮詢、配方建議、生產排程協助',
    icon: '🤖',
    type: 'chat',
    defaultModel: 'qwen3-30b-a3b-fp8',
    systemPrompt: `你是奇美食品的 AI 智能助理。你需要以專業、精確的態度回答關於食品製造的問題。

關於奇美食品的基本資訊：
- 奇美食品為台灣知名冷凍食品製造商，以冷凍包子、水餃等產品聞名
- 工廠採用自動化產線，搭配嚴格的 HACCP 食品安全管理系統
- 產品涵蓋冷凍麵食、調理食品、烘焙產品等多個品類
- 重視食品安全與品質管控，通過 ISO 22000、FSSC 22000 等國際認證
- 致力於綠色製造，推動節能減碳與永續發展

請用繁體中文回答，語氣專業但易懂。涉及食品安全法規時請特別謹慎。`,
  },
  {
    id: 'recipe',
    name: '配方優化',
    nameEn: 'Recipe Optimizer',
    description: '根據成本、口感、營養需求優化配方',
    icon: '📋',
    type: 'chat',
    defaultModel: 'llama-4-scout-17b-16e-instruct',
    systemPrompt: `你是奇美食品的配方研發 AI 顧問。根據需求提供配方優化建議。

你的專長包括：
- 冷凍麵食（包子、水餃、饅頭）的配方調整
- 原料替代方案（考慮成本、供應穩定性、口感影響）
- 營養標示計算與法規合規
- 製程參數對成品品質的影響分析
- 新產品開發的配方建議

請提供具體的配方比例建議，標註關鍵製程參數，並說明每項調整的理由。使用繁體中文。`,
  },
  {
    id: 'smart-hvac',
    name: 'AI 環境調控',
    nameEn: 'Smart HVAC',
    description: 'YOLO 偵測人數衣著動作，AI 即時調整空調溫度風量',
    icon: '🌡️',
    type: 'dashboard',
  },
  {
    id: 'cctv',
    name: '即時監控',
    nameEn: 'Live CCTV',
    description: '廠區即時影像監控、AI 事件偵測',
    icon: '📹',
    type: 'dashboard',
  },
  {
    id: 'appstore',
    name: '應用市集',
    nameEn: 'App Store',
    description: '探索 AI 智慧模組，一鍵安裝到您的平台',
    icon: '🛒',
    type: 'system',
  },
  {
    id: 'datasources',
    name: '數據來源',
    nameEn: 'Data Sources',
    description: '系統連線狀態、API 端點管理、資料同步監控',
    icon: '🔗',
    type: 'system',
  },
]
