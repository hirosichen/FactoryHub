import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Package, AlertTriangle, Truck, RefreshCw, CheckCircle2, ShoppingCart, BrainCircuit } from 'lucide-react'
import { generateInventoryItems, type InventoryItem } from '@/lib/mock-data'
import { ModuleHero } from '@/components/ModuleHero'
import { streamChat, type ChatMessage } from '@/lib/api'
import { cn } from '@/lib/utils'

function StockStatus({ item }: { item: InventoryItem }) {
  const daysLeft = Math.floor(item.stock / item.dailyUsage)
  if (item.stock <= item.safetyStock) {
    return <Badge className="bg-red-600 text-white">低於安全庫存</Badge>
  }
  if (daysLeft <= item.leadDays + 1) {
    return <Badge className="bg-yellow-500 text-white">即將不足</Badge>
  }
  return <Badge className="bg-green-600 text-white">充足</Badge>
}

export function InventorySystem() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [orders, setOrders] = useState<Array<{ id: string; item: string; qty: number; time: string }>>([])
  const [aiPrediction, setAiPrediction] = useState('')
  const [loadingPrediction, setLoadingPrediction] = useState(false)
  const [predictionActions, setPredictionActions] = useState<Record<string, 'idle' | 'executing' | 'done'>>({
    purchase: 'idle',
    erp: 'idle',
  })

  const getAiPrediction = async () => {
    setLoadingPrediction(true)
    setAiPrediction('')
    setPredictionActions({ purchase: 'idle', erp: 'idle' })
    const itemSummary = items.map(i => {
      const daysLeft = Math.floor(i.stock / i.dailyUsage)
      return `${i.name}: 庫存${i.stock}${i.unit}, 日用量${i.dailyUsage}${i.unit}, 安全庫存${i.safetyStock}${i.unit}, 可用${daysLeft}天, 前置時間${i.leadDays}天`
    }).join('\n')
    const messages: ChatMessage[] = [{
      role: 'user',
      content: `請根據以下原料庫存數據，預測未來7天的需求趨勢，並建議最佳採購時機和數量：\n${itemSummary}`
    }]
    try {
      await streamChat(messages, 'qwen3-30b-a3b-fp8',
        '你是食品工廠的供應鏈AI顧問。請用繁體中文提供需求預測和採購建議。用條列式回答，包含具體數字。',
        (chunk) => setAiPrediction(prev => prev + chunk)
      )
    } catch {
      setAiPrediction('AI 預測服務暫時無法使用，請稍後再試。')
    }
    setLoadingPrediction(false)
  }

  const executePredictionAction = (actionId: string) => {
    setPredictionActions(prev => ({ ...prev, [actionId]: 'executing' }))
    setTimeout(() => {
      setPredictionActions(prev => ({ ...prev, [actionId]: 'done' }))
    }, 1500)
  }

  useEffect(() => { setItems(generateInventoryItems()) }, [])

  const lowStockCount = items.filter(i => i.stock <= i.safetyStock).length
  const warningCount = items.filter(i => {
    const daysLeft = Math.floor(i.stock / i.dailyUsage)
    return i.stock > i.safetyStock && daysLeft <= i.leadDays + 1
  }).length

  const handleOrder = (item: InventoryItem) => {
    const orderQty = item.dailyUsage * (item.leadDays + 3)
    const order = {
      id: `PO-${Date.now().toString(36).toUpperCase()}`,
      item: item.name,
      qty: orderQty,
      time: new Date().toLocaleTimeString('zh-TW'),
    }
    setOrders(prev => [order, ...prev])
    setItems(prev => prev.map(i =>
      i.id === item.id ? { ...i, stock: i.stock + orderQty } : i
    ))
  }

  const handleAutoOrder = () => {
    const needOrder = items.filter(i => {
      const daysLeft = Math.floor(i.stock / i.dailyUsage)
      return daysLeft <= i.leadDays + 1
    })
    needOrder.forEach(item => handleOrder(item))
  }

  return (
    <div className="p-6 space-y-6 overflow-auto h-full">
      <ModuleHero
        video="/assets/inventory-video.mp4" image="/assets/inventory-hero.jpg"
        title="物料叫料系統"
        subtitle="ERP/WMS 即時串接，AI 需求預測自動計算最佳採購時機"
        techTags={[
          { label: 'SAP OData 串接', color: 'blue' },
          { label: 'WMS 倉儲系統', color: 'green' },
          { label: 'AI 需求預測', color: 'purple' },
          { label: 'Barcode / RFID', color: 'orange' },
        ]}
      >
        <Button variant="outline" size="sm" onClick={() => setItems(generateInventoryItems())} className="bg-white/20 backdrop-blur hover:bg-white/30 text-white border-0">
          <RefreshCw className="h-4 w-4 mr-1" /> 重新整理
        </Button>
        <Button size="sm" onClick={handleAutoOrder} className="bg-white/90 text-foreground hover:bg-white">
          <ShoppingCart className="h-4 w-4 mr-1" /> 一鍵叫料
        </Button>
        <Button size="sm" onClick={getAiPrediction} disabled={loadingPrediction} className="bg-white/20 backdrop-blur hover:bg-white/30 text-white border-0">
          <BrainCircuit className="h-4 w-4 mr-1" /> {loadingPrediction ? '預測中...' : 'AI 需求預測'}
        </Button>
      </ModuleHero>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Package className="h-4 w-4" /> 物料品項</div>
            <div className="text-2xl font-bold">{items.length}</div>
          </CardContent>
        </Card>
        <Card className={lowStockCount > 0 ? 'border-red-300' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><AlertTriangle className="h-4 w-4" /> 低庫存警報</div>
            <div className={cn("text-2xl font-bold", lowStockCount > 0 ? "text-red-600" : "text-green-600")}>{lowStockCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Truck className="h-4 w-4" /> 即將不足</div>
            <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><CheckCircle2 className="h-4 w-4" /> 今日叫料單</div>
            <div className="text-2xl font-bold text-blue-600">{orders.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Inventory Table */}
        <div className="col-span-2 space-y-3">
          <h3 className="font-semibold text-foreground">原料庫存狀態</h3>
          {items.map((item) => {
            const daysLeft = Math.floor(item.stock / item.dailyUsage)
            const stockPercent = Math.min(Math.round((item.stock / (item.safetyStock * 3)) * 100), 100)
            return (
              <Card key={item.id} className={cn(item.stock <= item.safetyStock && 'border-red-300 bg-red-50/30')}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-medium text-sm">{item.name}</div>
                      <div className="text-xs text-muted-foreground">供應商：{item.supplier} | 前置時間：{item.leadDays} 天</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StockStatus item={item} />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOrder(item)}
                        className="text-xs"
                      >
                        <Truck className="h-3 w-3 mr-1" /> 叫料
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3 text-xs mb-2">
                    <div>
                      <span className="text-muted-foreground">現有庫存</span>
                      <div className="font-medium">{item.stock.toLocaleString()} {item.unit}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">安全庫存</span>
                      <div className="font-medium">{item.safetyStock.toLocaleString()} {item.unit}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">日用量</span>
                      <div className="font-medium">{item.dailyUsage.toLocaleString()} {item.unit}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">可用天數</span>
                      <div className={cn("font-medium", daysLeft <= item.leadDays ? "text-red-600" : "")}>{daysLeft} 天</div>
                    </div>
                  </div>
                  <Progress
                    value={stockPercent}
                    className={cn(
                      item.stock <= item.safetyStock && "[&>div]:bg-red-500",
                      daysLeft <= item.leadDays + 1 && item.stock > item.safetyStock && "[&>div]:bg-yellow-500"
                    )}
                  />
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Order History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" /> 叫料紀錄
            </CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                尚無叫料紀錄
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div key={order.id} className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-sm">{order.item}</div>
                      <Badge variant="outline" className="text-xs">{order.id}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      數量：{order.qty.toLocaleString()} | {order.time}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Prediction */}
      {(aiPrediction || loadingPrediction) && (
        <Card className="border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-primary" /> AI 需求預測
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-primary/5 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">
              {aiPrediction}
              {loadingPrediction && <span className="inline-block w-1.5 h-4 bg-primary ml-0.5 animate-pulse" />}
            </div>
            {aiPrediction && !loadingPrediction && (
              <div className="flex gap-3">
                {[
                  { id: 'purchase', label: '自動產生採購單' },
                  { id: 'erp', label: '發送至 ERP' },
                ].map(action => (
                  <div key={action.id}>
                    {predictionActions[action.id] === 'done' ? (
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-green-600 px-3 py-1.5 animate-in fade-in duration-300">
                        <span>&#10003;</span> {action.label} - 完成
                      </span>
                    ) : predictionActions[action.id] === 'executing' ? (
                      <span className="inline-flex items-center text-sm font-medium text-yellow-600 px-3 py-1.5 animate-pulse">
                        執行中...
                      </span>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => executePredictionAction(action.id)}>
                        {action.label}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
