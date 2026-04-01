import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Database, Wifi, WifiOff, Server, RefreshCw, Activity, Clock, Shield } from 'lucide-react'
import { ModuleHero } from '@/components/ModuleHero'
import { cn } from '@/lib/utils'

interface DataSource {
  id: string
  name: string
  nameEn: string
  type: string
  endpoint: string
  status: 'connected' | 'degraded' | 'disconnected'
  latency: number
  lastSync: string
  records: number
  protocol: string
}

function generateSources(): DataSource[] {
  const now = new Date()
  const fmt = (offset: number) => {
    const d = new Date(now.getTime() - offset * 1000)
    return d.toLocaleTimeString('zh-TW', { hour12: false })
  }

  return [
    {
      id: 'mes',
      name: 'MES 製造執行系統',
      nameEn: 'Manufacturing Execution System',
      type: 'MES',
      endpoint: 'wss://mes.chimei-factory.local/api/v2/realtime',
      status: 'connected',
      latency: 12 + Math.round(Math.random() * 8),
      lastSync: fmt(Math.round(Math.random() * 5)),
      records: 284750 + Math.round(Math.random() * 500),
      protocol: 'WebSocket (OPC-UA)',
    },
    {
      id: 'scada',
      name: 'SCADA 監控系統',
      nameEn: 'Supervisory Control & Data Acquisition',
      type: 'SCADA',
      endpoint: 'mqtt://scada.chimei-factory.local:1883/sensors/#',
      status: 'connected',
      latency: 3 + Math.round(Math.random() * 4),
      lastSync: fmt(Math.round(Math.random() * 2)),
      records: 1892340 + Math.round(Math.random() * 1000),
      protocol: 'MQTT v5.0',
    },
    {
      id: 'erp',
      name: 'ERP 企業資源規劃',
      nameEn: 'SAP S/4HANA',
      type: 'ERP',
      endpoint: 'https://erp.chimei-foods.com.tw/sap/opu/odata/v4/',
      status: 'connected',
      latency: 85 + Math.round(Math.random() * 30),
      lastSync: fmt(30 + Math.round(Math.random() * 30)),
      records: 42180 + Math.round(Math.random() * 100),
      protocol: 'OData v4 (REST)',
    },
    {
      id: 'lims',
      name: 'LIMS 實驗室管理',
      nameEn: 'Laboratory Information Management System',
      type: 'LIMS',
      endpoint: 'https://lims.chimei-factory.local/api/v1/results',
      status: Math.random() > 0.3 ? 'connected' : 'degraded',
      latency: 45 + Math.round(Math.random() * 20),
      lastSync: fmt(60 + Math.round(Math.random() * 60)),
      records: 8920 + Math.round(Math.random() * 50),
      protocol: 'REST API (JSON)',
    },
    {
      id: 'coldchain',
      name: '冷鏈溫控感測器',
      nameEn: 'Cold Chain IoT Sensors',
      type: 'IoT',
      endpoint: 'mqtt://iot.chimei-factory.local:8883/coldchain/+/temp',
      status: 'connected',
      latency: 1 + Math.round(Math.random() * 3),
      lastSync: fmt(Math.round(Math.random() * 3)),
      records: 5672100 + Math.round(Math.random() * 5000),
      protocol: 'MQTT v5.0 (TLS)',
    },
    {
      id: 'wms',
      name: 'WMS 倉儲管理系統',
      nameEn: 'Warehouse Management System',
      type: 'WMS',
      endpoint: 'https://wms.chimei-factory.local/api/inventory',
      status: 'connected',
      latency: 35 + Math.round(Math.random() * 15),
      lastSync: fmt(10 + Math.round(Math.random() * 20)),
      records: 15830 + Math.round(Math.random() * 100),
      protocol: 'REST API (JSON)',
    },
  ]
}

function StatusBadge({ status }: { status: DataSource['status'] }) {
  const map = {
    connected: { label: '已連線', icon: Wifi, className: 'bg-green-600 text-white' },
    degraded: { label: '延遲', icon: Activity, className: 'bg-yellow-500 text-white' },
    disconnected: { label: '斷線', icon: WifiOff, className: 'bg-red-600 text-white' },
  }
  const s = map[status]
  const Icon = s.icon
  return (
    <Badge className={cn("gap-1", s.className)}>
      <Icon className="h-3 w-3" />
      {s.label}
    </Badge>
  )
}

export function DataSources() {
  const [sources, setSources] = useState<DataSource[]>([])
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => { setSources(generateSources()) }, [])

  useEffect(() => {
    const interval = setInterval(() => setSources(generateSources()), 8000)
    return () => clearInterval(interval)
  }, [])

  const connectedCount = sources.filter(s => s.status === 'connected').length
  const totalRecords = sources.reduce((s, d) => s + d.records, 0)
  const avgLatency = sources.length ? Math.round(sources.reduce((s, d) => s + d.latency, 0) / sources.length) : 0

  const handleRefresh = async () => {
    setRefreshing(true)
    await new Promise(r => setTimeout(r, 800))
    setSources(generateSources())
    setRefreshing(false)
  }

  return (
    <div className="p-6 space-y-6 overflow-auto h-full">
      <ModuleHero
        video="/assets/datasources-video.mp4" image="/assets/datasources-hero.jpg"
        title="數據來源管理"
        subtitle="AI 自動偵測協議版本，一鍵串接 MES / SCADA / ERP / IoT 設備"
        techTags={[
          { label: 'OPC-UA Gateway', color: 'blue' },
          { label: 'MQTT Broker', color: 'green' },
          { label: 'REST / OData', color: 'purple' },
          { label: 'AI 協議偵測', color: 'orange' },
        ]}
      >
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="bg-white/20 backdrop-blur hover:bg-white/30 text-white border-0">
          <RefreshCw className={cn("h-4 w-4 mr-1", refreshing && "animate-spin")} />
          {refreshing ? '檢測中...' : '連線檢測'}
        </Button>
      </ModuleHero>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Database className="h-4 w-4" /> 資料來源</div>
            <div className="text-2xl font-bold">{sources.length} <span className="text-sm font-normal">個</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Wifi className="h-4 w-4" /> 已連線</div>
            <div className={cn("text-2xl font-bold", connectedCount === sources.length ? "text-green-600" : "text-yellow-600")}>
              {connectedCount}/{sources.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Activity className="h-4 w-4" /> 平均延遲</div>
            <div className="text-2xl font-bold">{avgLatency} <span className="text-sm font-normal">ms</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Server className="h-4 w-4" /> 資料筆數</div>
            <div className="text-2xl font-bold">{(totalRecords / 1000000).toFixed(1)} <span className="text-sm font-normal">M</span></div>
          </CardContent>
        </Card>
      </div>

      {/* Source Cards */}
      <div className="space-y-4">
        {sources.map((source) => (
          <Card key={source.id} className={cn(
            source.status === 'degraded' && 'border-yellow-300',
            source.status === 'disconnected' && 'border-red-300 bg-red-50/30'
          )}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <Database className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{source.name}</div>
                    <div className="text-xs text-muted-foreground">{source.nameEn}</div>
                  </div>
                </div>
                <StatusBadge status={source.status} />
              </div>

              <div className="bg-muted/30 rounded-lg p-3 mb-3 font-mono text-xs text-muted-foreground break-all">
                {source.endpoint}
              </div>

              <div className="grid grid-cols-5 gap-4 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1"><Shield className="h-3 w-3" /> 協定</div>
                  <div className="font-medium text-xs mt-0.5">{source.protocol}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1"><Activity className="h-3 w-3" /> 延遲</div>
                  <div className={cn("font-medium mt-0.5", source.latency > 100 ? "text-yellow-600" : "text-green-600")}>
                    {source.latency}ms
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> 最後同步</div>
                  <div className="font-medium mt-0.5">{source.lastSync}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1"><Database className="h-3 w-3" /> 資料筆數</div>
                  <div className="font-medium mt-0.5">{source.records.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">類型</div>
                  <Badge variant="outline" className="mt-0.5 text-xs">{source.type}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Architecture note */}
      <Card className="bg-muted/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" /> 系統架構
          </CardTitle>
          <CardDescription>所有數據經由 Cloudflare Worker 統一彙整，透過邊緣運算降低延遲</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 flex-wrap">
            {['MES', 'SCADA', 'ERP', 'LIMS', 'IoT', 'WMS'].map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
            <span className="text-muted-foreground text-xs mx-2">→</span>
            <Badge className="bg-primary text-primary-foreground text-xs">Cloudflare Worker</Badge>
            <span className="text-muted-foreground text-xs mx-2">→</span>
            <Badge className="bg-primary text-primary-foreground text-xs">Cloudflare AI</Badge>
            <span className="text-muted-foreground text-xs mx-2">→</span>
            <Badge variant="outline" className="text-xs">Dashboard</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
