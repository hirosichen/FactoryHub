import { useState, useEffect, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, AlertCircle, BrainCircuit, Wrench, DollarSign, RefreshCw } from 'lucide-react'
import { generateMaintenanceAlerts, type MaintenanceAlert } from '@/lib/mock-data'
import { streamChat, type ChatMessage } from '@/lib/api'
import { ModuleHero } from '@/components/ModuleHero'
import { cn } from '@/lib/utils'

function SeverityBadge({ severity }: { severity: MaintenanceAlert['severity'] }) {
  const map = {
    critical: { label: '緊急', className: 'bg-red-600 text-white' },
    warning: { label: '注意', className: 'bg-yellow-500 text-white' },
    info: { label: '建議', className: 'bg-blue-500 text-white' },
  }
  const s = map[severity]
  return <Badge className={s.className}>{s.label}</Badge>
}

// Generate realistic sensor waveform data
function generateSensorData(sensorType: string, severity: string) {
  const points = 60
  return Array.from({ length: points }, (_, i) => {
    const t = i / points
    let value: number
    let threshold: number

    if (sensorType === '九軸振動感測器') {
      // Vibration waveform (mm/s) — sinusoidal with noise + anomaly spike
      const base = 2.5 + Math.sin(t * Math.PI * 8) * 1.2 + (Math.random() - 0.5) * 0.8
      const anomalyZone = t > 0.6 && t < 0.75
      const spike = anomalyZone ? (severity === 'critical' ? 6 + Math.random() * 3 : 3 + Math.random() * 2) : 0
      value = Math.round((base + spike) * 100) / 100
      threshold = 7
    } else if (sensorType === '電流感測器') {
      // Current waveform (A) — load pattern with drift
      const base = 12 + Math.sin(t * Math.PI * 4) * 2 + (Math.random() - 0.5) * 1
      const drift = t > 0.5 ? (t - 0.5) * (severity === 'warning' ? 6 : 3) : 0
      const spike = (t > 0.65 && t < 0.7) ? (severity === 'warning' ? 4 : 2) : 0
      value = Math.round((base + drift + spike) * 100) / 100
      threshold = 18
    } else {
      // Metal detector signal (mV) — baseline with occasional spikes
      const base = 0.5 + (Math.random() - 0.5) * 0.3
      const spike = (t > 0.4 && t < 0.42) ? 8 + Math.random() * 4 : (t > 0.78 && t < 0.8) ? 3 : 0
      value = Math.round((base + spike) * 100) / 100
      threshold = 5
    }

    return { t: i, value, threshold }
  })
}

function SensorChart({ alert }: { alert: MaintenanceAlert }) {
  const [data, setData] = useState(() => generateSensorData(alert.sensorType, alert.severity))

  // Animate data refresh every 3s
  useEffect(() => {
    const interval = setInterval(() => {
      setData(generateSensorData(alert.sensorType, alert.severity))
    }, 3000)
    return () => clearInterval(interval)
  }, [alert.sensorType, alert.severity])

  const unit = alert.sensorType === '九軸振動感測器' ? 'mm/s' : alert.sensorType === '電流感測器' ? 'A' : 'mV'
  const color = alert.severity === 'critical' ? '#ef4444' : alert.severity === 'warning' ? '#eab308' : '#3b82f6'
  const thresholdValue = data[0]?.threshold ?? 0
  const maxValue = Math.max(...data.map(d => d.value))
  const hasAnomaly = maxValue > thresholdValue * 0.8

  return (
    <div className="bg-gray-950 rounded-xl p-3 h-full flex flex-col">
      {/* Chart header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <img src={alert.sensorImg} alt="" className="h-5 w-5 object-contain opacity-80" />
          <span className="text-[10px] text-gray-400 font-mono">{alert.sensorId}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {hasAnomaly && (
            <span className="text-[9px] text-red-400 bg-red-400/10 rounded px-1.5 py-0.5 animate-pulse">ANOMALY</span>
          )}
          <span className="relative flex h-[5px] w-[5px]">
            <span className="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative rounded-full h-[5px] w-[5px] bg-green-500" />
          </span>
        </div>
      </div>

      {/* Sensor name + live value */}
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[11px] text-gray-300">{alert.sensorType}</span>
        <span className={cn("text-sm font-mono font-bold", maxValue > thresholdValue ? "text-red-400" : "text-green-400")}>
          {maxValue.toFixed(1)} {unit}
        </span>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          {alert.sensorType === '金屬探測器' ? (
            <AreaChart data={data} margin={{ top: 2, right: 2, bottom: 0, left: 2 }}>
              <defs>
                <linearGradient id={`grad-${alert.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="t" hide />
              <YAxis hide domain={[0, 'auto']} />
              <ReferenceLine y={thresholdValue} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.5} />
              <Area type="monotone" dataKey="value" stroke={color} fill={`url(#grad-${alert.id})`} strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </AreaChart>
          ) : (
            <LineChart data={data} margin={{ top: 2, right: 2, bottom: 0, left: 2 }}>
              <XAxis dataKey="t" hide />
              <YAxis hide domain={[0, 'auto']} />
              <ReferenceLine y={thresholdValue} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.5} label={{ value: `閾值 ${thresholdValue}${unit}`, position: 'right', fill: '#ef4444', fontSize: 9 }} />
              <Line type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Protocol tag */}
      <div className="flex items-center justify-between mt-1">
        <span className="text-[9px] text-gray-500">{alert.protocol}</span>
        <span className="text-[9px] text-gray-500">60s window</span>
      </div>
    </div>
  )
}

export function MaintenanceAI() {
  const [alerts, setAlerts] = useState<MaintenanceAlert[]>([])
  const [aiDiagnosis, setAiDiagnosis] = useState<Record<string, string>>({})
  const [loadingId, setLoadingId] = useState<string | null>(null)

  useEffect(() => { setAlerts(generateMaintenanceAlerts()) }, [])

  const criticalCount = alerts.filter(a => a.severity === 'critical').length
  const warningCount = alerts.filter(a => a.severity === 'warning').length
  const totalCost = alerts.reduce((s, a) => s + a.estimatedCost, 0)

  const sortedAlerts = useMemo(() =>
    [...alerts].sort((a, b) => {
      const order = { critical: 0, warning: 1, info: 2 }
      return order[a.severity] - order[b.severity]
    }),
  [alerts])

  const getDiagnosis = async (alert: MaintenanceAlert) => {
    setLoadingId(alert.id)
    setAiDiagnosis(prev => ({ ...prev, [alert.id]: '' }))
    const messages: ChatMessage[] = [{
      role: 'user',
      content: `設備：${alert.equipment}\n問題類型：${alert.type}\n嚴重程度：${alert.severity}\n描述：${alert.prediction}\nAI信心度：${alert.confidence}%\n預估維修費：NT$${alert.estimatedCost.toLocaleString()}\n\n請提供：1.可能原因分析 2.建議處理步驟 3.是否可以延後處理 4.預防措施`
    }]
    try {
      await streamChat(messages, 'llama-4-scout-17b-16e-instruct',
        '你是食品工廠設備維護AI工程師，專精食品加工設備、冷凍系統、自動化產線的預測性維護。請用繁體中文提供專業但易懂的診斷分析。注意食品安全法規對設備維護的要求。',
        (chunk) => setAiDiagnosis(prev => ({ ...prev, [alert.id]: (prev[alert.id] || '') + chunk }))
      )
    } catch {
      setAiDiagnosis(prev => ({ ...prev, [alert.id]: 'AI 診斷服務暫時無法使用。' }))
    }
    setLoadingId(null)
  }

  return (
    <div className="p-6 space-y-6 overflow-auto h-full">
      <ModuleHero
        video="/assets/maintenance-video.mp4" image="/assets/maintenance-hero.jpg"
        title="AI 預測性維護"
        subtitle="電流特徵分析 + 九軸振動感測器，AI 預測軸承壽命與故障時間"
        techTags={[
          { label: '九軸振動感測器', color: 'blue' },
          { label: '電流特徵分析', color: 'orange' },
          { label: 'AI 壽命預測', color: 'purple' },
          { label: 'FFT 頻譜分析', color: 'green' },
        ]}
      >
        <Button variant="outline" size="sm" onClick={() => setAlerts(generateMaintenanceAlerts())} className="bg-white/20 backdrop-blur hover:bg-white/30 text-white border-0">
          <RefreshCw className="h-4 w-4 mr-1" /> 重新掃描
        </Button>
      </ModuleHero>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <Card className={criticalCount > 0 ? 'border-red-300' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><AlertTriangle className="h-4 w-4" /> 緊急警報</div>
            <div className={cn("text-2xl font-bold", criticalCount > 0 ? 'text-red-600' : 'text-green-600')}>{criticalCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><AlertCircle className="h-4 w-4" /> 注意事項</div>
            <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Wrench className="h-4 w-4" /> 總工單數</div>
            <div className="text-2xl font-bold">{alerts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><DollarSign className="h-4 w-4" /> 預估總費用</div>
            <div className="text-2xl font-bold">NT${totalCost.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Cards with Sensor Charts */}
      <div className="space-y-4">
        {sortedAlerts.map((alert) => (
          <Card key={alert.id} className={cn("overflow-hidden", alert.severity === 'critical' && 'border-red-300')}>
            <div className="grid grid-cols-5">
              {/* Left: Sensor Chart (2/5) */}
              <div className="col-span-2 h-[200px]">
                <SensorChart alert={alert} />
              </div>

              {/* Right: Alert Info (3/5) */}
              <CardContent className="col-span-3 p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium text-[14px]">{alert.equipment}</div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span className="font-mono bg-muted rounded px-1.5 py-0.5">{alert.sensorId}</span>
                      <span>{alert.sensorType}</span>
                      <span>·</span>
                      <span>{alert.protocol}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <SeverityBadge severity={alert.severity} />
                    <Badge variant="outline" className="text-[10px]">{alert.confidence}%</Badge>
                  </div>
                </div>

                {/* Prediction */}
                <div className="bg-muted/40 rounded-lg p-2.5 mb-2.5 text-[13px]">
                  {alert.prediction}
                  <div className="text-[11px] text-muted-foreground mt-1">預估費用 NT${alert.estimatedCost.toLocaleString()}</div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => getDiagnosis(alert)} disabled={loadingId === alert.id} className="text-xs">
                    <BrainCircuit className="h-3.5 w-3.5 mr-1" />
                    {loadingId === alert.id ? 'AI 分析中...' : 'AI 深度診斷'}
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs">
                    <Wrench className="h-3.5 w-3.5 mr-1" /> 建立工單
                  </Button>
                </div>

                {/* AI Diagnosis */}
                {aiDiagnosis[alert.id] && (
                  <div className="mt-2.5 bg-primary/5 rounded-lg p-3 text-[12px] leading-relaxed whitespace-pre-wrap border border-primary/10 max-h-40 overflow-auto">
                    {aiDiagnosis[alert.id]}
                    {loadingId === alert.id && <span className="inline-block w-1.5 h-3 bg-primary ml-0.5 animate-pulse" />}
                  </div>
                )}
              </CardContent>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
