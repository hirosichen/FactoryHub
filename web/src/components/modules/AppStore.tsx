import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search, Download, Star, Zap, Wifi, Shield, ArrowRight, CheckCircle2, Clock, Cpu, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AppModule {
  id: string
  name: string
  nameEn: string
  description: string
  icon: string
  image: string
  category: string
  tags: string[]
  rating: number
  installs: string
  status: 'installed' | 'available' | 'coming-soon'
  featured?: boolean
  protocols?: string[]
  aiCapability?: string
}

const CATEGORIES = [
  { id: 'all', label: '全部' },
  { id: 'iot', label: 'IoT 整合' },
  { id: 'ai', label: 'AI 智能' },
  { id: 'monitor', label: '監控' },
  { id: 'quality', label: '品質' },
  { id: 'supply', label: '供應鏈' },
  { id: 'energy', label: '能源' },
]

const APP_MODULES: AppModule[] = [
  {
    id: 'production', name: '產線監控', nameEn: 'Production Monitor', icon: '🏭', image: '/assets/appstore/production.jpg',
    description: '即時產線狀態監控、產量追蹤、OEE 分析，串接 MES 系統自動採集數據',
    category: 'monitor', tags: ['OPC-UA', 'MQTT', 'MES'], rating: 4.8, installs: '2.4k',
    status: 'installed', protocols: ['OPC-UA', 'MQTT', 'Modbus TCP'],
    aiCapability: 'AI 自動識別產線瓶頸，預測產能趨勢',
  },
  {
    id: 'quality', name: '品質管理', nameEn: 'Quality Control', icon: '🔬', image: '/assets/appstore/quality.jpg',
    description: 'AI 品質檢測、SPC 管制圖，自動串接 LIMS 與視覺檢測系統',
    category: 'quality', tags: ['LIMS', 'Vision AI', 'SPC'], rating: 4.7, installs: '1.8k',
    status: 'installed', protocols: ['REST API', 'GigE Vision'],
    aiCapability: 'AI 影像辨識不良品，自動分類異常模式',
  },
  {
    id: 'coldchain', name: '冷鏈管理', nameEn: 'Cold Chain', icon: '🧊', image: '/assets/appstore/coldchain.jpg',
    description: '倉儲溫控監控、冷鏈物流追蹤，自動串接 IoT 感測器與 BMS',
    category: 'iot', tags: ['MQTT', 'BLE', 'LoRaWAN'], rating: 4.9, installs: '3.1k',
    status: 'installed', featured: true, protocols: ['MQTT v5.0', 'BLE 5.0', 'LoRaWAN'],
    aiCapability: 'AI 預測溫控異常，自動調整除霜排程',
  },
  {
    id: 'maintenance', name: '設備維護', nameEn: 'Maintenance AI', icon: '🔧', image: '/assets/appstore/maintenance.jpg',
    description: 'AI 預測性維護、振動分析，自動串接 SCADA 感測數據',
    category: 'ai', tags: ['SCADA', 'Vibration', 'Predictive'], rating: 4.6, installs: '2.0k',
    status: 'installed', protocols: ['OPC-UA', 'MQTT', 'Modbus RTU'],
    aiCapability: 'AI 振動頻譜分析，預測軸承壽命與故障時間',
  },
  {
    id: 'inventory', name: '物料叫料', nameEn: 'Inventory System', icon: '📦', image: '/assets/appstore/inventory.jpg',
    description: '原料庫存管理、自動叫料，串接 ERP/WMS 系統',
    category: 'supply', tags: ['SAP', 'WMS', 'ERP'], rating: 4.5, installs: '1.5k',
    status: 'installed', protocols: ['OData v4', 'REST API'],
    aiCapability: 'AI 需求預測，自動計算最佳叫料時機與數量',
  },
  {
    id: 'energy-monitor', name: '能源管理', nameEn: 'Energy Monitor', icon: '⚡', image: '/assets/appstore/energy-monitor.jpg',
    description: '電力、蒸氣、天然氣即時監控，AI 節能建議。自動串接電表、流量計',
    category: 'energy', tags: ['Modbus', 'BACnet', 'Smart Meter'], rating: 4.8, installs: '2.7k',
    status: 'available', featured: true,
    protocols: ['Modbus TCP/RTU', 'BACnet/IP', 'IEC 61850', 'DLMS/COSEM'],
    aiCapability: 'AI 分析用電模式，自動排程離峰生產以降低電費',
  },
  {
    id: 'haccp-tracker', name: 'HACCP 追蹤', nameEn: 'HACCP Tracker', icon: '📋', image: '/assets/appstore/haccp-tracker.jpg',
    description: 'CCP 監控點自動記錄、偏差即時警報、電子化 HACCP 文件管理',
    category: 'quality', tags: ['HACCP', 'FDA', 'FSSC'], rating: 4.7, installs: '1.2k',
    status: 'available',
    protocols: ['REST API', 'MQTT', 'OPC-UA'],
    aiCapability: 'AI 自動辨識 CCP 偏差趨勢，預警潛在食安風險',
  },
  {
    id: 'protocol-gateway', name: 'AI 協議閘道器', nameEn: 'AI Protocol Gateway', icon: '🔌', image: '/assets/appstore/protocol-gateway.jpg',
    description: '一鍵串接各種 IoT 協議，AI 自動轉換資料格式與映射欄位',
    category: 'iot', tags: ['Gateway', 'Protocol', 'Auto-Map'], rating: 4.9, installs: '5.2k',
    status: 'available', featured: true,
    protocols: ['OPC-UA', 'MQTT', 'Modbus', 'BACnet', 'Profinet', 'EtherNet/IP', 'CANopen', 'Zigbee', 'LoRaWAN', 'BLE'],
    aiCapability: 'AI 自動偵測設備協議版本、解析資料格式、映射標準標籤名稱',
  },
  {
    id: 'traceability', name: '產品溯源', nameEn: 'Traceability', icon: '🔍', image: '/assets/appstore/traceability.jpg',
    description: '原料到成品全程追溯、批次關聯、一鍵召回分析',
    category: 'supply', tags: ['Barcode', 'QR', 'Blockchain'], rating: 4.6, installs: '980',
    status: 'available',
    protocols: ['REST API', 'GS1 EPCIS'],
    aiCapability: 'AI 自動建立批次關聯樹，秒級完成召回範圍分析',
  },
  {
    id: 'wastewater', name: '廢水監控', nameEn: 'Wastewater Monitor', icon: '💧', image: '/assets/appstore/wastewater.jpg',
    description: '放流水質即時監控、自動採樣排程、環保法規合規提醒',
    category: 'monitor', tags: ['pH', 'COD', 'BOD'], rating: 4.4, installs: '650',
    status: 'available',
    protocols: ['Modbus RTU', '4-20mA', 'HART'],
    aiCapability: 'AI 預測水質趨勢，自動調整藥劑投加量',
  },
  {
    id: 'digital-twin', name: '數位分身', nameEn: 'Digital Twin', icon: '🏗️', image: '/assets/appstore/digital-twin.jpg',
    description: '工廠 3D 數位分身、即時設備狀態疊加、模擬生產情境',
    category: 'ai', tags: ['3D', 'Simulation', 'Twin'], rating: 4.3, installs: '420',
    status: 'coming-soon',
    protocols: ['OPC-UA', 'MQTT', 'REST API'],
    aiCapability: 'AI 模擬不同生產排程對產能與品質的影響',
  },
  {
    id: 'carbon-footprint', name: '碳足跡追蹤', nameEn: 'Carbon Footprint', icon: '🌱', image: '/assets/appstore/carbon-footprint.jpg',
    description: '產品碳足跡計算、範疇一二三排放追蹤、ESG 報告自動生成',
    category: 'energy', tags: ['ESG', 'Carbon', 'ISO 14064'], rating: 4.5, installs: '380',
    status: 'coming-soon',
    protocols: ['REST API', 'Modbus'],
    aiCapability: 'AI 自動歸因碳排放至產品批次，建議減碳策略',
  },
]

function StatusButton({ status }: { status: AppModule['status'] }) {
  switch (status) {
    case 'installed':
      return (
        <Button variant="outline" size="sm" className="text-green-600 border-green-300 gap-1 text-xs h-7 rounded-full px-3" disabled>
          <CheckCircle2 className="h-3 w-3" /> 已安裝
        </Button>
      )
    case 'available':
      return (
        <Button size="sm" className="gap-1 text-xs h-7 rounded-full px-3">
          <Download className="h-3 w-3" /> 安裝
        </Button>
      )
    case 'coming-soon':
      return (
        <Button variant="secondary" size="sm" className="gap-1 text-xs h-7 rounded-full px-3" disabled>
          <Clock className="h-3 w-3" /> 即將推出
        </Button>
      )
  }
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={cn(
          "h-3 w-3",
          i <= Math.floor(rating)
            ? "fill-yellow-400 text-yellow-400"
            : i - 0.5 <= rating
              ? "fill-yellow-400/50 text-yellow-400"
              : "fill-muted text-muted-foreground/30"
        )} />
      ))}
      <span className="text-xs font-medium ml-1">{rating}</span>
    </div>
  )
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{count}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}

function ModuleCard({ mod }: { mod: AppModule }) {
  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 group",
      mod.status === 'coming-soon' && 'opacity-60'
    )}>
      <div className="relative aspect-[16/9] overflow-hidden">
        <img
          src={mod.image}
          alt={mod.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-background/90 backdrop-blur-sm flex items-center justify-center text-xl shadow-sm border border-white/10">{mod.icon}</div>
            <div>
              <div className="font-semibold text-white text-sm drop-shadow-sm">{mod.name}</div>
              <div className="text-[11px] text-white/70">{mod.nameEn}</div>
            </div>
          </div>
          <StatusButton status={mod.status} />
        </div>
      </div>
      <CardContent className="p-4 pt-3 space-y-2.5">
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{mod.description}</p>

        {mod.aiCapability && (
          <div className="bg-primary/5 rounded-lg px-2.5 py-1.5 flex items-start gap-1.5">
            <Sparkles className="h-3 w-3 text-primary shrink-0 mt-0.5" />
            <span className="text-[11px] text-foreground/80 leading-relaxed line-clamp-1">{mod.aiCapability}</span>
          </div>
        )}

        {mod.protocols && mod.protocols.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {mod.protocols.slice(0, 3).map(p => (
              <Badge key={p} variant="outline" className="text-[10px] px-1.5 py-0 font-normal">{p}</Badge>
            ))}
            {mod.protocols.length > 3 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">+{mod.protocols.length - 3}</Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <Stars rating={mod.rating} />
          <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Download className="h-3 w-3" /> {mod.installs}</span>
        </div>
      </CardContent>
    </Card>
  )
}

export function AppStore() {
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = APP_MODULES.filter(m => {
    if (category !== 'all' && m.category !== category) return false
    if (search) {
      const q = search.toLowerCase()
      return m.name.includes(q) || m.nameEn.toLowerCase().includes(q) ||
        m.description.includes(q) || m.tags.some(t => t.toLowerCase().includes(q)) ||
        (m.protocols?.some(p => p.toLowerCase().includes(q)) ?? false)
    }
    return true
  })

  const installed = filtered.filter(m => m.status === 'installed')
  const available = filtered.filter(m => m.status === 'available')
  const comingSoon = filtered.filter(m => m.status === 'coming-soon')

  return (
    <div className="p-6 space-y-6 overflow-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">應用市集</h2>
          <p className="text-sm text-muted-foreground">探索 AI 智慧模組，一鍵部署到您的工廠平台</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-full px-3 py-1.5">
          <Cpu className="h-3.5 w-3.5" />
          <span>{APP_MODULES.length} 個模組</span>
          <span className="text-muted-foreground/40">|</span>
          <span>{APP_MODULES.filter(m => m.status === 'installed').length} 已安裝</span>
        </div>
      </div>

      {/* Featured: AI Protocol Gateway */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="relative h-44 overflow-hidden">
          <img src="/assets/appstore/protocol-gateway.jpg" alt="AI Protocol Gateway" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
          <div className="absolute top-4 left-6 flex items-center gap-2">
            <Badge className="bg-primary text-primary-foreground text-[10px] rounded-full">核心能力</Badge>
            <Badge variant="outline" className="text-[10px] text-white border-white/30 rounded-full backdrop-blur-sm">最多人安裝</Badge>
          </div>
          <div className="absolute bottom-4 left-6 right-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-2xl bg-background/90 backdrop-blur-sm shadow-lg flex items-center justify-center text-2xl border border-white/10">🔌</div>
              <div>
                <h3 className="text-lg font-bold text-white">AI 協議閘道器</h3>
                <p className="text-xs text-white/70">AI Protocol Gateway</p>
              </div>
            </div>
          </div>
        </div>
        <CardContent className="p-5">
          <p className="text-sm text-muted-foreground mb-3">自動偵測設備通訊協議，AI 智能轉換資料格式與欄位映射。不需手動寫轉換程式，只要連上設備，AI 就能自動理解資料結構。</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {['OPC-UA', 'MQTT', 'Modbus TCP/RTU', 'BACnet/IP', 'Profinet', 'EtherNet/IP', 'CANopen', 'Zigbee', 'LoRaWAN', 'BLE'].map(p => (
              <Badge key={p} variant="secondary" className="text-[10px] gap-1 rounded-full">
                <Wifi className="h-2.5 w-2.5" />{p}
              </Badge>
            ))}
          </div>
          {/* How it works */}
          <div className="pt-4 border-t">
            <p className="text-[10px] font-semibold text-muted-foreground mb-2.5 uppercase tracking-widest">AI 自動串接流程</p>
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 bg-muted/50 rounded-lg px-3 py-2">
                <Wifi className="h-3.5 w-3.5 text-blue-500" />
                <span>連接設備</span>
              </div>
              <ArrowRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
              <div className="flex items-center gap-1.5 bg-muted/50 rounded-lg px-3 py-2">
                <Zap className="h-3.5 w-3.5 text-yellow-500" />
                <span>AI 偵測協議</span>
              </div>
              <ArrowRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
              <div className="flex items-center gap-1.5 bg-muted/50 rounded-lg px-3 py-2">
                <Cpu className="h-3.5 w-3.5 text-purple-500" />
                <span>自動解析格式</span>
              </div>
              <ArrowRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
              <div className="flex items-center gap-1.5 bg-muted/50 rounded-lg px-3 py-2">
                <Shield className="h-3.5 w-3.5 text-green-500" />
                <span>欄位映射驗證</span>
              </div>
              <ArrowRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
              <div className="flex items-center gap-1.5 bg-primary/10 rounded-lg px-3 py-2 border border-primary/20">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium">數據上線</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <Stars rating={4.9} />
            <span className="text-xs text-muted-foreground flex items-center gap-1"><Download className="h-3 w-3" /> 5,200+ 安裝</span>
            <Button size="sm" className="gap-1.5 ml-auto rounded-full px-4">
              <Download className="h-3.5 w-3.5" /> 安裝模組
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search & Category Pills */}
      <div className="space-y-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜尋模組名稱、協議、功能..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-full border border-input bg-transparent text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="flex items-center gap-2">
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                category === c.id
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {c.label}
            </button>
          ))}
          <span className="text-xs text-muted-foreground ml-auto">
            {filtered.length} 個模組
          </span>
        </div>
      </div>

      {/* Installed Section */}
      {installed.length > 0 && (
        <div className="space-y-3">
          <SectionHeader title="已安裝" count={installed.length} />
          <div className="grid grid-cols-3 gap-4">
            {installed.map(mod => <ModuleCard key={mod.id} mod={mod} />)}
          </div>
        </div>
      )}

      {/* Available Section */}
      {available.length > 0 && (
        <div className="space-y-3">
          <SectionHeader title="可安裝" count={available.length} />
          <div className="grid grid-cols-3 gap-4">
            {available.map(mod => <ModuleCard key={mod.id} mod={mod} />)}
          </div>
        </div>
      )}

      {/* Coming Soon Section */}
      {comingSoon.length > 0 && (
        <div className="space-y-3">
          <SectionHeader title="即將推出" count={comingSoon.length} />
          <div className="grid grid-cols-3 gap-4">
            {comingSoon.map(mod => <ModuleCard key={mod.id} mod={mod} />)}
          </div>
        </div>
      )}
    </div>
  )
}
