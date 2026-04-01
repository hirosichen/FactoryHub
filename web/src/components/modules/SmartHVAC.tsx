import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Users, Wind, BrainCircuit, ArrowRight, Shirt, RefreshCw, Circle } from 'lucide-react'
import { useAutoRefresh } from '@/lib/useAutoRefresh'
import { streamChat, type ChatMessage } from '@/lib/api'
import { cn } from '@/lib/utils'

interface DetectedPerson { id: string; action: string; clothing: 'light' | 'heavy'; confidence: number }
interface ZoneState {
  id: string; name: string; personCount: number; avgActivity: 'low' | 'medium' | 'high'
  clothingRatio: { light: number; heavy: number }; currentTemp: number; targetTemp: number
  aiSuggestedTemp: number; fanSpeed: number; aiFanSpeed: number; comfortIndex: number
  autoMode: boolean; persons: DetectedPerson[]
  // AI vision pairing
  aiSource: { type: 'video' | 'image'; src: string; title: string }
}

const ACTIONS = ['standing', 'walking', 'bending', 'operating', 'inspecting', 'carrying']

const ZONE_CONFIGS = [
  { name: '包子產線區', aiSource: { type: 'video' as const, src: '/assets/yolo-detect-video.mp4', title: 'CAM-01 包子產線' } },
  { name: '水餃產線區', aiSource: { type: 'video' as const, src: '/assets/yolo-zone-dumpling.mp4', title: 'CAM-02 水餃產線' } },
  { name: '饅頭產線區', aiSource: { type: 'video' as const, src: '/assets/yolo-zone-mantou.mp4', title: 'CAM-03 饅頭產線' } },
  { name: '包裝區', aiSource: { type: 'video' as const, src: '/assets/yolo-zone-packaging.mp4', title: 'CAM-04 包裝區' } },
  { name: '品管實驗室', aiSource: { type: 'video' as const, src: '/assets/yolo-zone-qclab.mp4', title: 'CAM-05 品管實驗室' } },
  { name: '倉儲走道', aiSource: { type: 'video' as const, src: '/assets/yolo-zone-warehouse.mp4', title: 'CAM-06 倉儲走道' } },
]

function generateZones(): ZoneState[] {
  return ZONE_CONFIGS.map((config, i) => {
    const personCount = 3 + Math.floor(Math.random() * 8)
    const persons: DetectedPerson[] = Array.from({ length: personCount }, (_, j) => ({
      id: `P${i}${j}`, action: ACTIONS[Math.floor(Math.random() * ACTIONS.length)],
      clothing: Math.random() > 0.35 ? 'light' : 'heavy',
      confidence: Math.round((85 + Math.random() * 14) * 100) / 100,
    }))
    const lightCount = persons.filter(p => p.clothing === 'light').length
    const heavyCount = persons.filter(p => p.clothing === 'heavy').length
    const activityScores = persons.map(p => p.action === 'standing' || p.action === 'inspecting' ? 0.3 : p.action === 'walking' ? 0.5 : p.action === 'carrying' ? 0.9 : 0.6)
    const avgScore = activityScores.reduce((a, b) => a + b, 0) / (activityScores.length || 1)
    const avgActivity = avgScore > 0.65 ? 'high' : avgScore > 0.4 ? 'medium' : 'low'
    const baseTemp = 24
    const aiSuggestedTemp = Math.round((baseTemp + (avgActivity === 'high' ? -1.5 : avgActivity === 'medium' ? -0.5 : 0.5) + (lightCount > heavyCount ? -0.5 : 0.5) + (personCount > 7 ? -1 : personCount > 4 ? -0.5 : 0)) * 10) / 10
    const baseFan = 60
    const aiFanSpeed = Math.min(100, Math.round(baseFan + (personCount - 4) * 3 + (avgActivity === 'high' ? 15 : avgActivity === 'medium' ? 5 : 0)))
    return {
      id: `Z${i}`, name: config.name, personCount, avgActivity,
      clothingRatio: { light: lightCount, heavy: heavyCount },
      currentTemp: Math.round((aiSuggestedTemp + (Math.random() - 0.5) * 2) * 10) / 10,
      targetTemp: 24, aiSuggestedTemp, fanSpeed: baseFan + Math.round(Math.random() * 10), aiFanSpeed,
      comfortIndex: Math.round(70 + Math.random() * 25), autoMode: Math.random() > 0.2, persons,
      aiSource: config.aiSource,
    }
  })
}

export function SmartHVAC() {
  const genZones = useCallback(() => generateZones(), [])
  const { data: zones, isLive, refresh, toggle } = useAutoRefresh<ZoneState[]>(genZones, 6000)
  const [aiAnalysis, setAiAnalysis] = useState('')
  const [loadingAi, setLoadingAi] = useState(false)
  const [clock, setClock] = useState(new Date())

  useEffect(() => { const t = setInterval(() => setClock(new Date()), 1000); return () => clearInterval(t) }, [])

  const totalPersons = zones.reduce((s, z) => s + z.personCount, 0)
  const avgComfort = zones.length ? Math.round(zones.reduce((s, z) => s + z.comfortIndex, 0) / zones.length) : 0

  const getAiAnalysis = async () => {
    setLoadingAi(true); setAiAnalysis('')
    const summary = zones.map(z => `${z.name}: ${z.personCount}人, 活動量${z.avgActivity}, 薄衣${z.clothingRatio.light}/厚衣${z.clothingRatio.heavy}, 現溫${z.currentTemp}°C, AI建議${z.aiSuggestedTemp}°C, 風速${z.aiFanSpeed}%, 舒適度${z.comfortIndex}%`).join('\n')
    const messages: ChatMessage[] = [{ role: 'user', content: `根據 YOLO 視覺偵測的廠區環境數據，提供空調優化建議：\n${summary}\n\n請分析：1.整體舒適度評估 2.哪些區域需要特別調整 3.節能機會 4.人員動線建議` }]
    try {
      await streamChat(messages, 'qwen3-30b-a3b-fp8', '你是食品工廠的 AI 環境調控專家。你使用 YOLO 電腦視覺即時偵測現場人數、衣著厚薄、活動強度，自動計算最佳空調參數。請用繁體中文，條列式回答，包含具體數據。', (chunk) => setAiAnalysis(prev => prev + chunk))
    } catch { setAiAnalysis('AI 分析服務暫時無法使用。') }
    setLoadingAi(false)
  }

  return (
    <div className="p-6 space-y-6 overflow-auto h-full">
      {/* Hero */}
      <div className="relative h-44 rounded-2xl overflow-hidden">
        <video src="/assets/yolo-hvac-hero-video.mp4" autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/15" />
        <div className="relative h-full flex flex-col justify-between p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className="bg-red-600 text-white gap-1 text-[10px]">
                <Circle className="h-1.5 w-1.5 fill-white animate-pulse" /> YOLO v8
              </Badge>
              <Badge className="bg-white/15 text-white/80 text-[10px] backdrop-blur">30 FPS</Badge>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1.5 text-[11px] bg-black/30 backdrop-blur rounded-full px-2.5 py-1">
                {isLive && <span className="relative flex h-[5px] w-[5px]"><span className="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75" /><span className="relative rounded-full h-[5px] w-[5px] bg-green-500" /></span>}
                <span className="text-white/60 font-mono tabular-nums">{clock.toLocaleTimeString('zh-TW', { hour12: false })}</span>
              </div>
              <Button size="sm" variant="ghost" onClick={toggle} className="h-7 w-7 text-white/50 hover:text-white hover:bg-white/10 rounded-full p-0">
                {isLive ? <span className="text-[10px]">||</span> : <span className="text-[10px]">▶</span>}
              </Button>
              <Button size="sm" variant="ghost" onClick={refresh} className="h-7 w-7 text-white/50 hover:text-white hover:bg-white/10 rounded-full p-0">
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div>
            <h2 className="text-[22px] font-semibold text-white tracking-tight">AI 環境調控</h2>
            <p className="text-white/50 text-[13px]">YOLO 視覺偵測 → AI 即時調整空調溫度與風量</p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 text-center">
            <div className="text-3xl font-bold tracking-tight">{totalPersons}</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><Users className="h-3 w-3" /> 偵測人數</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <div className={cn("text-3xl font-bold tracking-tight", avgComfort >= 80 ? "text-green-600" : "text-yellow-600")}>{avgComfort}%</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><Shirt className="h-3 w-3" /> 平均舒適度</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <div className="text-3xl font-bold tracking-tight text-primary">{zones.filter(z => z.autoMode).length}<span className="text-lg text-muted-foreground font-normal">/{zones.length}</span></div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><BrainCircuit className="h-3 w-3" /> AI 自動調控</div>
          </CardContent>
        </Card>
      </div>

      {/* Zone + AI Vision paired cards */}
      <div className="space-y-4">
        {zones.map(zone => (
          <Card key={zone.id} className="overflow-hidden">
            <div className="grid grid-cols-5">
              {/* Left: AI Vision Feed (2/5) */}
              <div className="col-span-2 relative bg-black">
                {zone.aiSource.type === 'video' ? (
                  <video src={zone.aiSource.src} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <img src={zone.aiSource.src} alt={zone.aiSource.title} className="absolute inset-0 w-full h-full object-cover" />
                )}
                <div className="absolute top-2 left-2">
                  <Badge className="bg-black/50 text-white text-[9px] backdrop-blur-sm gap-1">
                    <Circle className="h-1.5 w-1.5 fill-red-500 text-red-500 animate-pulse" /> LIVE
                  </Badge>
                </div>
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2.5">
                  <div className="text-[11px] font-medium text-white">{zone.aiSource.title}</div>
                </div>
              </div>

              {/* Right: Zone Data (3/5) */}
              <CardContent className="col-span-3 p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-medium text-[14px]">{zone.name}</div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <Users className="h-2.5 w-2.5" />{zone.personCount} 人
                      <span>·</span>
                      <Shirt className="h-2.5 w-2.5" />薄{zone.clothingRatio.light} / 厚{zone.clothingRatio.heavy}
                      <span>·</span>
                      活動量{zone.avgActivity === 'high' ? '高' : zone.avgActivity === 'medium' ? '中' : '低'}
                    </div>
                  </div>
                  {zone.autoMode && (
                    <Badge className="bg-green-100 text-green-700 text-[9px] gap-0.5">
                      <BrainCircuit className="h-2.5 w-2.5" /> AI 自動
                    </Badge>
                  )}
                </div>

                {/* Temp + Fan: side by side */}
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="bg-muted/30 rounded-xl p-3">
                    <div className="text-[10px] text-muted-foreground mb-1.5">溫度</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold font-mono">{zone.currentTemp}°</span>
                      <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className={cn("text-xl font-bold font-mono", zone.aiSuggestedTemp < zone.currentTemp ? "text-blue-600" : "text-orange-600")}>
                        {zone.aiSuggestedTemp}°
                      </span>
                    </div>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-3">
                    <div className="text-[10px] text-muted-foreground mb-1.5 flex items-center gap-1"><Wind className="h-2.5 w-2.5" /> 風量</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold font-mono">{zone.fanSpeed}%</span>
                      <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="text-xl font-bold font-mono text-primary">{zone.aiFanSpeed}%</span>
                    </div>
                  </div>
                </div>

                {/* Comfort bar */}
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-muted-foreground">舒適度</span>
                    <span className="font-medium">{zone.comfortIndex}%</span>
                  </div>
                  <Progress value={zone.comfortIndex} className={cn(zone.comfortIndex < 70 && "[&>div]:bg-yellow-500")} />
                </div>
              </CardContent>
            </div>
          </Card>
        ))}
      </div>

      {/* AI Analysis */}
      <Card className="border-primary/20">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-[14px]">AI 環境調控摘要</h3>
              {loadingAi && <Badge variant="secondary" className="text-[10px] animate-pulse">Cloudflare AI 分析中</Badge>}
            </div>
            <Button size="sm" onClick={getAiAnalysis} disabled={loadingAi}>
              {loadingAi ? '分析中...' : '即時 AI 分析'}
            </Button>
          </div>
          {aiAnalysis ? (
            <div className="bg-muted/30 rounded-xl p-4 text-[13px] leading-relaxed whitespace-pre-wrap">
              {aiAnalysis}
              {loadingAi && <span className="inline-block w-1.5 h-4 bg-primary ml-0.5 animate-pulse" />}
            </div>
          ) : !loadingAi ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              點擊「即時 AI 分析」根據當前偵測數據生成調控摘要
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
