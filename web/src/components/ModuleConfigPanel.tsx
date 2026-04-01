import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Settings, X, Database, Clock, Bell, Wifi, Save, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModuleConfig {
  dataSource: string
  refreshInterval: string
  alertEnabled: boolean
  alertThreshold: string
  protocol: string
  endpoint: string
}

interface Props {
  moduleName: string
  moduleIcon: string
  isOpen: boolean
  onClose: () => void
  dataSources?: string[]
  protocols?: string[]
}

export function ModuleConfigButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick} className="gap-1.5">
      <Settings className="h-3.5 w-3.5" /> 自訂模組
    </Button>
  )
}

export function ModuleConfigPanel({ moduleName, moduleIcon, isOpen, onClose, dataSources, protocols }: Props) {
  const [config, setConfig] = useState<ModuleConfig>({
    dataSource: dataSources?.[0] ?? 'mes',
    refreshInterval: '5',
    alertEnabled: true,
    alertThreshold: 'medium',
    protocol: protocols?.[0] ?? 'opc-ua',
    endpoint: 'wss://mes.chimei-factory.local/api/v2/realtime',
  })
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => { setSaved(false); onClose() }, 1200)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20" />
      <div
        className="relative w-[420px] h-full bg-background border-l shadow-xl overflow-auto animate-in slide-in-from-right duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-background border-b px-5 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <span className="text-xl">{moduleIcon}</span>
            <div>
              <h3 className="font-semibold text-foreground text-sm">模組設定</h3>
              <p className="text-xs text-muted-foreground">{moduleName}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-5 space-y-5">
          {/* Data Source */}
          <Card>
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" /> 資料來源
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">主要資料源</label>
                <Select
                  value={config.dataSource}
                  onValueChange={v => setConfig(prev => ({ ...prev, dataSource: v }))}
                >
                  {(dataSources ?? ['mes', 'scada', 'erp', 'iot-sensors']).map(ds => (
                    <option key={ds} value={ds}>{ds.toUpperCase()}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">API 端點</label>
                <input
                  type="text"
                  value={config.endpoint}
                  onChange={e => setConfig(prev => ({ ...prev, endpoint: e.target.value }))}
                  className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-xs font-mono shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </CardContent>
          </Card>

          {/* Protocol */}
          <Card>
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Wifi className="h-4 w-4 text-blue-500" /> 通訊協議
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">協議類型</label>
                <Select
                  value={config.protocol}
                  onValueChange={v => setConfig(prev => ({ ...prev, protocol: v }))}
                >
                  {(protocols ?? ['opc-ua', 'mqtt', 'modbus-tcp', 'rest-api']).map(p => (
                    <option key={p} value={p}>{p.toUpperCase()}</option>
                  ))}
                </Select>
              </div>
              <div className="bg-muted/30 rounded-lg p-2.5 flex items-center gap-2">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </div>
                <span className="text-xs text-green-600 font-medium">連線正常</span>
                <span className="text-xs text-muted-foreground ml-auto">延遲 12ms</span>
              </div>
            </CardContent>
          </Card>

          {/* Refresh */}
          <Card>
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-violet-500" /> 更新頻率
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <Select
                value={config.refreshInterval}
                onValueChange={v => setConfig(prev => ({ ...prev, refreshInterval: v }))}
              >
                <option value="1">每 1 秒 (即時)</option>
                <option value="5">每 5 秒</option>
                <option value="10">每 10 秒</option>
                <option value="30">每 30 秒</option>
                <option value="60">每 1 分鐘</option>
              </Select>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card>
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bell className="h-4 w-4 text-yellow-500" /> 告警設定
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">啟用告警通知</span>
                <button
                  onClick={() => setConfig(prev => ({ ...prev, alertEnabled: !prev.alertEnabled }))}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors",
                    config.alertEnabled ? "bg-primary" : "bg-muted"
                  )}
                >
                  <span className={cn(
                    "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform mt-0.5",
                    config.alertEnabled ? "translate-x-4 ml-0.5" : "translate-x-0.5"
                  )} />
                </button>
              </div>
              {config.alertEnabled && (
                <>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">告警閾值</label>
                    <Select
                      value={config.alertThreshold}
                      onValueChange={v => setConfig(prev => ({ ...prev, alertThreshold: v }))}
                    >
                      <option value="low">低敏感度 - 僅嚴重異常</option>
                      <option value="medium">中敏感度 - 警告以上</option>
                      <option value="high">高敏感度 - 所有偏差</option>
                    </Select>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {['Email', 'LINE', 'Webhook', 'SMS'].map(ch => (
                      <Badge key={ch} variant="secondary" className="text-[10px] cursor-pointer hover:bg-primary/10">{ch}</Badge>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Widget layout hint */}
          <Card className="bg-muted/20">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">提示：</span>模組的 KPI 卡片、圖表、AI 分析區塊皆可透過拖拉重新排列。
                進階自訂請至「數據來源」頁面管理 API 連線。
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-background border-t px-5 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
            <RotateCcw className="h-3.5 w-3.5" /> 重設預設
          </Button>
          <Button size="sm" onClick={handleSave} className="gap-1">
            {saved ? (
              <><span className="text-green-300">✓</span> 已儲存</>
            ) : (
              <><Save className="h-3.5 w-3.5" /> 儲存設定</>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
