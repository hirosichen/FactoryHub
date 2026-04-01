import { useState, useCallback } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Factory, TrendingUp, AlertTriangle, BrainCircuit, Activity, Gauge, Maximize2 } from 'lucide-react'
import { generateProductionData, generateProductionLines, type ProductionDataPoint, type ProductionLine } from '@/lib/mock-data'
import { useAutoRefresh } from '@/lib/useAutoRefresh'
import { LiveIndicator } from '@/components/LiveIndicator'
import { streamChat, type ChatMessage } from '@/lib/api'
import { ModuleConfigButton, ModuleConfigPanel } from '@/components/ModuleConfigPanel'
import { ModuleHero } from '@/components/ModuleHero'
import { cn } from '@/lib/utils'

function StatusBadge({ status }: { status: ProductionLine['status'] }) {
  const map = {
    running: { label: '運轉中', className: 'bg-green-600 text-white' },
    idle: { label: '待機', className: 'bg-gray-500 text-white' },
    alert: { label: '異常', className: 'bg-red-600 text-white' },
  }
  const s = map[status]
  return <Badge className={s.className}>{s.label}</Badge>
}

export function ProductionMonitor() {
  const genData = useCallback(() => generateProductionData(), [])
  const genLines = useCallback(() => generateProductionLines(), [])
  const { data, lastUpdated, isLive, refresh: refreshData, toggle } = useAutoRefresh<ProductionDataPoint[]>(genData, 5000)
  const { data: lines, refresh: refreshLines } = useAutoRefresh<ProductionLine[]>(genLines, 5000)
  const [aiInsight, setAiInsight] = useState('')
  const [loadingInsight, setLoadingInsight] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)
  const [executedActions, setExecutedActions] = useState<Set<string>>(new Set())
  const [executingActions, setExecutingActions] = useState<Set<string>>(new Set())

  const executeAction = (actionId: string) => {
    setExecutingActions(prev => new Set(prev).add(actionId))
    setTimeout(() => {
      setExecutingActions(prev => { const next = new Set(prev); next.delete(actionId); return next })
      setExecutedActions(prev => new Set(prev).add(actionId))
    }, 1500)
  }

  const refresh = () => { refreshData(); refreshLines() }

  const totalOutput = data.reduce((s, d) => s + d.output, 0)
  const totalDefects = data.reduce((s, d) => s + d.defects, 0)
  const overallYield = totalOutput > 0 ? Math.round((1 - totalDefects / totalOutput) * 10000) / 100 : 0
  const avgOee = lines.filter(l => l.status === 'running').reduce((s, l) => s + l.oee, 0) / (lines.filter(l => l.status === 'running').length || 1)

  const getAiInsight = async () => {
    setLoadingInsight(true)
    setAiInsight('')
    const lineSummary = lines.map(l => `${l.name}(${l.product}): 狀態${l.status}, 產量${l.currentOutput}/${l.capacity}, OEE=${l.oee}%`).join('\n')
    const summary = `今日總產量 ${totalOutput.toLocaleString()} 件，不良數 ${totalDefects} 件，良率 ${overallYield}%，平均OEE ${avgOee.toFixed(1)}%\n\n各產線狀態：\n${lineSummary}`
    const messages: ChatMessage[] = [{ role: 'user', content: `請根據以下工廠產線數據，提供3點具體的產能優化建議：\n${summary}` }]
    try {
      await streamChat(messages, 'qwen3-30b-a3b-fp8', '你是奇美食品的智慧製造AI顧問。請用繁體中文提供簡潔、可執行的產線優化建議。用條列式回答。', (chunk) => {
        setAiInsight(prev => prev + chunk)
      })
    } catch {
      setAiInsight('AI 分析服務暫時無法使用，請稍後再試。')
    }
    setLoadingInsight(false)
  }

  return (
    <div className="p-6 space-y-6 overflow-auto h-full">
      <ModuleHero
        video="/assets/hero-factory-video.mp4" image="/assets/hero-factory.jpg"
        title="產線監控中心"
        subtitle="PLC 即時採集產線數據，AI 自動辨識產能瓶頸與良率趨勢"
        techTags={[
          { label: 'OPC-UA / Modbus', color: 'blue' },
          { label: 'PLC 即時採集', color: 'green' },
          { label: 'AI 瓶頸預測', color: 'purple' },
          { label: 'OEE 自動分析', color: 'orange' },
        ]}
      >
        <ModuleConfigButton onClick={() => setConfigOpen(true)} />
        <LiveIndicator lastUpdated={lastUpdated} isLive={isLive} onToggle={toggle} onRefresh={refresh} />
      </ModuleHero>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Factory className="h-4 w-4" /> 今日總產量
            </div>
            <div className="text-2xl font-bold">{totalOutput.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">件</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <TrendingUp className="h-4 w-4" /> 良率
            </div>
            <div className={cn("text-2xl font-bold", overallYield >= 98 ? "text-green-600" : overallYield >= 95 ? "text-yellow-600" : "text-red-600")}>
              {overallYield}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Gauge className="h-4 w-4" /> 平均 OEE
            </div>
            <div className="text-2xl font-bold text-blue-600">{avgOee.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <AlertTriangle className="h-4 w-4" /> 異常產線
            </div>
            <div className={cn("text-2xl font-bold", lines.filter(l => l.status === 'alert').length > 0 ? "text-red-600" : "text-green-600")}>
              {lines.filter(l => l.status === 'alert').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Production Line Cards with Monitor */}
      <div className="grid grid-cols-2 gap-4">
        {lines.map((line) => (
          <Card key={line.id} className={cn('overflow-hidden', line.status === 'alert' && 'border-red-300 bg-red-50/30')}>
            <div className="flex">
              {/* Video Monitor */}
              <div className="relative w-[200px] min-h-[180px] flex-shrink-0 bg-black group">
                <video
                  src={line.monitorVideo}
                  poster={line.monitorImg}
                  autoPlay muted loop playsInline
                  className="w-full h-full object-cover"
                />
                {/* Live badge */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm rounded px-1.5 py-0.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                  <span className="text-[10px] text-white font-mono font-medium">LIVE</span>
                </div>
                {/* Camera ID */}
                <div className="absolute bottom-2 left-2 text-[9px] text-white/80 font-mono bg-black/50 px-1 rounded">
                  CAM-{line.id}
                </div>
                {/* Expand button on hover */}
                <button className="absolute top-2 right-2 p-1 rounded bg-black/50 text-white/80 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70">
                  <Maximize2 className="h-3 w-3" />
                </button>
              </div>

              {/* Data Panel */}
              <CardContent className="p-4 flex-1 min-w-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <img src={line.deviceImg} alt={line.deviceId} className="h-9 w-9 object-contain rounded-lg bg-muted/50 p-1" />
                    <div>
                      <div className="font-semibold text-foreground">{line.name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{line.deviceId} · {line.deviceType} · {line.protocol}</div>
                    </div>
                  </div>
                  <StatusBadge status={line.status} />
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                  <div>
                    <span className="text-muted-foreground text-xs">產量</span>
                    <div className="font-medium">{line.currentOutput.toLocaleString()} / {line.capacity.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">OEE</span>
                    <div className="font-medium">{line.oee}%</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">速度</span>
                    <div className="font-medium">{line.speed}%</div>
                  </div>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>稼動率</span>
                    <span>{Math.round(line.currentOutput / line.capacity * 100)}%</span>
                  </div>
                  <Progress value={line.currentOutput} max={line.capacity} />
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                  <span className="flex items-center gap-1"><Activity className="h-3 w-3" /> {line.temperature}°C</span>
                  <span>濕度 {line.humidity}%</span>
                </div>
              </CardContent>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">24 小時產量趨勢</CardTitle>
            <CardDescription>各班次產出數量</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="output" stroke="#3b82f6" fill="#bfdbfe" fillOpacity={0.5} name="產量 (件)" />
                <Area type="monotone" dataKey="defects" stroke="#ef4444" fill="#fecaca" fillOpacity={0.5} name="不良品 (件)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">各產線每小時產出</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="line1" stackId="a" fill="#3b82f6" name="包子線" />
                <Bar dataKey="line2" stackId="a" fill="#16a34a" name="水餃線" />
                <Bar dataKey="line3" stackId="a" fill="#eab308" name="饅頭線" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* AI Insight */}
      <Card className="border-primary/30">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">AI 產能分析</CardTitle>
            </div>
            <Button size="sm" onClick={getAiInsight} disabled={loadingInsight}>
              {loadingInsight ? '分析中...' : '取得 AI 建議'}
            </Button>
          </div>
        </CardHeader>
        {aiInsight && (
          <CardContent>
            <div className="bg-primary/5 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">
              {aiInsight}
              {loadingInsight && <span className="inline-block w-1.5 h-4 bg-primary ml-0.5 animate-pulse" />}
            </div>
          </CardContent>
        )}
      </Card>

      {/* AI Action Buttons */}
      {aiInsight && !loadingInsight && (
        <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="p-4 space-y-3">
            <div className="text-sm font-semibold text-primary flex items-center gap-2">
              <BrainCircuit className="h-4 w-4" /> AI 建議執行
            </div>
            {[
              { id: 'slow-l3', label: 'AI 建議：降低 L3 饅頭線速度至 80%' },
              { id: 'eco-l1', label: 'AI 建議：L1 包子線切換至節能模式' },
            ].map(action => (
              <div key={action.id} className="flex items-center justify-between bg-background rounded-lg p-3 border">
                <span className="text-sm">{action.label}</span>
                {executedActions.has(action.id) ? (
                  <span className="text-sm font-medium text-green-600 flex items-center gap-1 animate-in fade-in duration-300">
                    <span>&#10003;</span> 已執行
                  </span>
                ) : executingActions.has(action.id) ? (
                  <span className="text-sm font-medium text-yellow-600 animate-pulse">執行中...</span>
                ) : (
                  <Button size="sm" onClick={() => executeAction(action.id)}>
                    執行
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <ModuleConfigPanel
        moduleName="產線監控"
        moduleIcon="🏭"
        isOpen={configOpen}
        onClose={() => setConfigOpen(false)}
        dataSources={['mes', 'scada', 'erp']}
        protocols={['opc-ua', 'mqtt', 'modbus-tcp', 'rest-api']}
      />
    </div>
  )
}
