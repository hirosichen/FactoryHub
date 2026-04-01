import { useState, useEffect, useCallback } from 'react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, ResponsiveContainer, ReferenceLine, CartesianGrid, Tooltip, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Snowflake, Thermometer, AlertTriangle, BrainCircuit, Warehouse, ArrowRight } from 'lucide-react'
import { generateColdChainData, generateColdChainZones, type ColdChainDataPoint, type ColdChainZone } from '@/lib/mock-data'
import { useAutoRefresh } from '@/lib/useAutoRefresh'
import { LiveIndicator } from '@/components/LiveIndicator'
import { streamChat, type ChatMessage } from '@/lib/api'
import { ModuleConfigButton, ModuleConfigPanel } from '@/components/ModuleConfigPanel'
import { ModuleHero } from '@/components/ModuleHero'
import { cn } from '@/lib/utils'

function generateTempWaveform(targetTemp: number, currentTemp: number, isAlert: boolean) {
  return Array.from({ length: 60 }, (_, i) => {
    const t = i / 60
    const base = targetTemp + (currentTemp - targetTemp) * 0.5
    const noise = (Math.random() - 0.5) * 1.5
    const drift = isAlert ? t * Math.abs(currentTemp - targetTemp) * 1.5 : 0
    const doorSpike = (Math.random() > 0.92) ? (targetTemp > 0 ? 3 : 5) : 0
    return { t: i, temp: Math.round((base + noise + drift + doorSpike) * 10) / 10, target: targetTemp }
  })
}

function ZoneSensorChart({ zone }: { zone: ColdChainZone }) {
  const [data, setData] = useState(() => generateTempWaveform(zone.targetTemp, zone.currentTemp, zone.status === 'alert'))
  useEffect(() => {
    const interval = setInterval(() => setData(generateTempWaveform(zone.targetTemp, zone.currentTemp, zone.status === 'alert')), 4000)
    return () => clearInterval(interval)
  }, [zone.targetTemp, zone.currentTemp, zone.status])

  const maxTemp = Math.max(...data.map(d => d.temp))
  const alertThreshold = zone.targetTemp + (zone.type === '急凍' || zone.type === '冷凍' ? 3 : 2)
  const hasAnomaly = maxTemp > alertThreshold

  return (
    <div className="bg-gray-950 rounded-xl p-3 h-full flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <img src={zone.sensorImg} alt="" className="h-5 w-5 object-contain opacity-80" />
          <span className="text-[10px] text-gray-400 font-mono">{zone.sensorId}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {hasAnomaly && <span className="text-[9px] text-red-400 bg-red-400/10 rounded px-1.5 py-0.5 animate-pulse">ALERT</span>}
          <span className="relative flex h-[5px] w-[5px]"><span className="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75" /><span className="relative rounded-full h-[5px] w-[5px] bg-green-500" /></span>
        </div>
      </div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[11px] text-gray-300">{zone.protocol}</span>
        <span className={cn("text-sm font-mono font-bold", hasAnomaly ? "text-red-400" : "text-cyan-400")}>{data[data.length-1]?.temp.toFixed(1)}°C</span>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 2, right: 2, bottom: 0, left: 2 }}>
            <XAxis dataKey="t" hide /><YAxis hide domain={['auto', 'auto']} />
            <ReferenceLine y={zone.targetTemp} stroke="#22d3ee" strokeDasharray="3 3" strokeOpacity={0.4} />
            <ReferenceLine y={alertThreshold} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.4} />
            <Line type="monotone" dataKey="temp" stroke={hasAnomaly ? '#ef4444' : '#22d3ee'} strokeWidth={1.5} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className="text-[9px] text-gray-500">{zone.type} · {zone.defrostSchedule}</span>
        <span className="text-[9px] text-gray-500">60s</span>
      </div>
    </div>
  )
}

const TABS = [
  { id: 'zones', label: '溫控監測' },
  { id: 'vision', label: 'AI 視覺' },
  { id: 'trends', label: '趨勢分析' },
  { id: 'analysis', label: 'AI 分析' },
] as const

export function ColdChain() {
  const genData = useCallback(() => generateColdChainData(), [])
  const genZones = useCallback(() => generateColdChainZones(), [])
  const { data, lastUpdated, isLive, refresh: refreshData, toggle } = useAutoRefresh<ColdChainDataPoint[]>(genData, 4000)
  const { data: zones, refresh: refreshZones } = useAutoRefresh<ColdChainZone[]>(genZones, 4000)
  const [tab, setTab] = useState<'zones' | 'vision' | 'trends' | 'analysis'>('zones')
  const [aiInsight, setAiInsight] = useState('')
  const [loading, setLoading] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)
  const [coolingZones, setCoolingZones] = useState<Set<string>>(new Set())
  const [cooledZones, setCooledZones] = useState<Set<string>>(new Set())
  const [optimizingAll, setOptimizingAll] = useState(false)

  const handleEmergencyCool = (zoneId: string) => {
    setCoolingZones(prev => new Set(prev).add(zoneId))
    setTimeout(() => {
      setCoolingZones(prev => { const next = new Set(prev); next.delete(zoneId); return next })
      setCooledZones(prev => new Set(prev).add(zoneId))
    }, 1500)
  }

  const handleOptimizeAll = () => {
    setOptimizingAll(true)
    const ids = zones.filter(z => z.status === 'alert').map(z => z.id)
    ids.forEach(id => setCoolingZones(prev => new Set(prev).add(id)))
    setTimeout(() => {
      setCoolingZones(new Set())
      setCooledZones(prev => { const next = new Set(prev); ids.forEach(id => next.add(id)); return next })
      setOptimizingAll(false)
    }, 1500)
  }

  const refresh = () => { refreshData(); refreshZones() }
  const alertCount = zones.filter(z => z.status === 'alert').length
  const latest = data[data.length - 1]
  const avgFreezer = zones.filter(z => z.type === '冷凍' || z.type === '急凍').reduce((s, z) => s + z.currentTemp, 0) / (zones.filter(z => z.type === '冷凍' || z.type === '急凍').length || 1)

  const getInsight = async () => {
    setLoading(true); setAiInsight(''); setTab('analysis')
    const summary = zones.map(z => `${z.name}(${z.type}): 目標${z.targetTemp}°C, 實際${z.currentTemp}°C, 儲位${z.usagePercent}%, 狀態${z.status}`).join('\n')
    const messages: ChatMessage[] = [{ role: 'user', content: `請根據以下冷鏈數據提供優化建議：\n壓縮機負載: ${latest?.compressorLoad}%\n${summary}` }]
    try {
      await streamChat(messages, 'qwen3-30b-a3b-fp8', '你是冷凍食品冷鏈管理AI顧問。請用繁體中文提供冷鏈溫控、能源節約、倉儲優化的專業建議。條列式回答。', (chunk) => setAiInsight(prev => prev + chunk))
    } catch { setAiInsight('AI 分析服務暫時無法使用。') }
    setLoading(false)
  }

  return (
    <div className="p-6 space-y-6 overflow-auto h-full">
      <ModuleHero
        video="/assets/cold-chain-video.mp4" image="/assets/cold-chain.jpg"
        title="冷鏈管理中心"
        subtitle="IoT 溫濕度感測器即時監控，LoRaWAN 無線傳輸，AI 智慧除霜排程"
        techTags={[
          { label: 'IoT 溫濕度感測器', color: 'blue' },
          { label: 'LoRaWAN 傳輸', color: 'green' },
          { label: 'AI 除霜排程', color: 'purple' },
          { label: 'HACCP 合規', color: 'orange' },
        ]}
      >
        <Button size="sm" onClick={handleOptimizeAll} disabled={optimizingAll || alertCount === 0} className="bg-white/90 text-foreground hover:bg-white">
          <Snowflake className="h-4 w-4 mr-1" /> {optimizingAll ? '優化中...' : 'AI 一鍵優化'}
        </Button>
        <ModuleConfigButton onClick={() => setConfigOpen(true)} />
        <LiveIndicator lastUpdated={lastUpdated} isLive={isLive} onToggle={toggle} onRefresh={refresh} />
      </ModuleHero>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Snowflake className="h-4 w-4" /> 冷凍庫均溫</div>
            <div className="text-2xl font-bold text-blue-600">{avgFreezer.toFixed(1)}°C</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Thermometer className="h-4 w-4" /> 冷藏區溫度</div>
            <div className="text-2xl font-bold">{latest?.chillerTemp ?? '--'}°C</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Warehouse className="h-4 w-4" /> 監控區域</div>
            <div className="text-2xl font-bold">{zones.length} <span className="text-sm font-normal">區</span></div>
          </CardContent>
        </Card>
        <Card className={alertCount > 0 ? 'border-red-300' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><AlertTriangle className="h-4 w-4" /> 溫控警報</div>
            <div className={cn("text-2xl font-bold", alertCount > 0 ? "text-red-600" : "text-green-600")}>{alertCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => t.id === 'analysis' ? getInsight() : setTab(t.id)}
            className={cn(
              "flex-1 py-2 rounded-lg text-[13px] font-medium transition-all cursor-pointer",
              tab === t.id ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: 溫控監測 */}
      {tab === 'zones' && (
        <div className="space-y-4">
          {zones.map((zone) => (
            <Card key={zone.id} className={cn("overflow-hidden", zone.status === 'alert' && 'border-red-300')}>
              <div className="grid grid-cols-5">
                <div className="col-span-2 h-[180px]">
                  <ZoneSensorChart zone={zone} />
                </div>
                <CardContent className="col-span-3 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-medium text-[14px]">{zone.name}</div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                        <span className="font-mono bg-muted rounded px-1.5 py-0.5">{zone.sensorId}</span>
                        <span>{zone.type} · {zone.protocol}</span>
                      </div>
                    </div>
                    <Badge className={zone.status === 'alert' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}>
                      {zone.status === 'alert' ? '異常' : '正常'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-muted/30 rounded-xl p-2.5">
                      <div className="text-[10px] text-muted-foreground mb-1">溫度</div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold font-mono">{zone.currentTemp}°C</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="text-lg font-bold font-mono text-cyan-600">{zone.targetTemp}°C</span>
                      </div>
                    </div>
                    <div className="bg-muted/30 rounded-xl p-2.5">
                      <div className="text-[10px] text-muted-foreground mb-1">壓縮機 · 除霜</div>
                      <div className="text-[13px] font-medium">
                        {zone.compressorStatus === 'running' ? '🟢 運轉' : '⚪ 待機'} · {zone.defrostSchedule}
                      </div>
                    </div>
                  </div>
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-muted-foreground">儲位使用率</span>
                      <span className="font-medium">{zone.usagePercent}%</span>
                    </div>
                    <Progress value={zone.usagePercent} className={cn(zone.usagePercent > 90 && "[&>div]:bg-red-500")} />
                  </div>
                  {zone.status === 'alert' && !cooledZones.has(zone.id) && (
                    <div className="mt-2">
                      {coolingZones.has(zone.id) ? (
                        <div className="text-xs font-medium text-yellow-600 animate-pulse text-center py-1.5">壓縮機加速中...</div>
                      ) : (
                        <Button size="sm" variant="destructive" className="w-full text-xs" onClick={() => handleEmergencyCool(zone.id)}>
                          <Snowflake className="h-3 w-3 mr-1" /> AI 緊急降溫
                        </Button>
                      )}
                    </div>
                  )}
                  {cooledZones.has(zone.id) && (
                    <div className="mt-2 text-xs font-medium text-green-600 text-center py-1.5">&#10003; 已降溫</div>
                  )}
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Tab: AI 視覺 */}
      {tab === 'vision' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card className="overflow-hidden">
              <div className="relative aspect-video bg-black">
                <video src="/assets/yolo-coldchain-door-video.mp4" autoPlay loop muted playsInline className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2"><Badge className="bg-black/50 text-white text-[9px] backdrop-blur-sm">CAM-07</Badge></div>
              </div>
              <CardContent className="p-3">
                <div className="text-[13px] font-medium">庫門開關偵測</div>
                <div className="text-[11px] text-muted-foreground">開啟超過 30 秒自動警報，追蹤冷量流失</div>
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <div className="relative aspect-video bg-black">
                <video src="/assets/yolo-coldchain-inside-video.mp4" autoPlay loop muted playsInline className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2"><Badge className="bg-black/50 text-white text-[9px] backdrop-blur-sm">CAM-09</Badge></div>
              </div>
              <CardContent className="p-3">
                <div className="text-[13px] font-medium">庫內人員追蹤</div>
                <div className="text-[11px] text-muted-foreground">AI 追蹤進出人員，停留超時安全提醒</div>
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <div className="relative aspect-video bg-black">
                <video src="/assets/yolo-coldchain-layout-video.mp4" autoPlay loop muted playsInline className="w-full h-full object-cover" />
              </div>
              <CardContent className="p-3">
                <div className="text-[13px] font-medium">棧板排列分析</div>
                <div className="text-[11px] text-muted-foreground">AI 俯瞰分析合規率，偵測偏移與通道阻擋</div>
              </CardContent>
            </Card>
          </div>

          {/* Entry control */}
          <Card className="overflow-hidden">
            <div className="grid grid-cols-5">
              <div className="col-span-2 relative bg-black">
                <video src="/assets/yolo-coldchain-entry-video.mp4" autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute top-2 left-2"><Badge className="bg-black/50 text-white text-[9px] backdrop-blur-sm">CAM-08 進出管制</Badge></div>
              </div>
              <CardContent className="col-span-3 p-4">
                <div className="font-medium text-[14px] mb-3">冷凍庫進出管制</div>
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-muted/30 rounded-xl p-2.5 text-center">
                    <div className="text-xl font-bold">47</div>
                    <div className="text-[10px] text-muted-foreground">今日進出</div>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-2.5 text-center">
                    <div className="text-xl font-bold">8<span className="text-sm font-normal">min</span></div>
                    <div className="text-[10px] text-muted-foreground">平均停留</div>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-2.5 text-center">
                    <div className="text-xl font-bold text-blue-600">2</div>
                    <div className="text-[10px] text-muted-foreground">庫內人數</div>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-2.5 text-center">
                    <div className="text-xl font-bold text-green-600">100%</div>
                    <div className="text-[10px] text-muted-foreground">PPE 合規</div>
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
        </div>
      )}

      {/* Tab: 趨勢分析 */}
      {tab === 'trends' && (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">24 小時溫度趨勢</CardTitle>
              <CardDescription>冷凍庫 / 冷藏區</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
                  <Tooltip /><Legend />
                  <Line type="monotone" dataKey="freezerTemp" stroke="#3b82f6" name="冷凍庫 (°C)" dot={false} />
                  <Line type="monotone" dataKey="chillerTemp" stroke="#16a34a" name="冷藏區 (°C)" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">壓縮機負載趨勢</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip />
                  <Area type="monotone" dataKey="compressorLoad" stroke="#8b5cf6" fill="#ddd6fe" fillOpacity={0.5} name="壓縮機負載 (%)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab: AI 分析 */}
      {tab === 'analysis' && (
        <Card className="border-primary/20">
          <CardContent className="p-6">
            {!aiInsight && !loading ? (
              <div className="text-center py-12">
                <BrainCircuit className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">點擊「AI 分析」開始分析冷鏈環境數據</p>
                <Button className="mt-4" onClick={getInsight}>開始 AI 分析</Button>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <BrainCircuit className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">AI 冷鏈優化建議</h3>
                  {loading && <Badge variant="secondary" className="text-[10px] animate-pulse">分析中</Badge>}
                </div>
                <div className="bg-muted/30 rounded-xl p-5 text-sm leading-relaxed whitespace-pre-wrap">
                  {aiInsight}
                  {loading && <span className="inline-block w-1.5 h-4 bg-primary ml-0.5 animate-pulse" />}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <ModuleConfigPanel moduleName="冷鏈管理" moduleIcon="🧊" isOpen={configOpen} onClose={() => setConfigOpen(false)}
        dataSources={['iot-sensors', 'scada', 'bms']} protocols={['mqtt', 'ble', 'lorawan', 'modbus-rtu']} />
    </div>
  )
}
