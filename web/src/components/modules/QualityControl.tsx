import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FlaskConical, Weight, ShieldCheck, ShieldAlert, BrainCircuit, RefreshCw, Thermometer, Search, Maximize2 } from 'lucide-react'
import { generateQualityData, type QualityBatch } from '@/lib/mock-data'
import { streamChat, type ChatMessage } from '@/lib/api'
import { ModuleHero } from '@/components/ModuleHero'
import { cn } from '@/lib/utils'

function StatusBadge({ status }: { status: QualityBatch['status'] }) {
  const map = {
    pass: { label: '合格', className: 'bg-green-600 text-white' },
    review: { label: '待覆核', className: 'bg-yellow-500 text-white' },
    reject: { label: '不合格', className: 'bg-red-600 text-white' },
  }
  const s = map[status]
  return <Badge className={s.className}>{s.label}</Badge>
}

function CheckIcon({ pass }: { pass: boolean }) {
  return pass
    ? <ShieldCheck className="h-4 w-4 text-green-600" />
    : <ShieldAlert className="h-4 w-4 text-red-600" />
}

export function QualityControl() {
  const [batches, setBatches] = useState<QualityBatch[]>([])
  const [aiAnalysis, setAiAnalysis] = useState<Record<string, string>>({})
  const [loadingId, setLoadingId] = useState<string | null>(null)

  useEffect(() => { setBatches(generateQualityData()) }, [])

  const passCount = batches.filter(b => b.status === 'pass').length
  const reviewCount = batches.filter(b => b.status === 'review').length
  const rejectCount = batches.filter(b => b.status === 'reject').length
  const passRate = batches.length ? Math.round((passCount / batches.length) * 100) : 0

  const getAnalysis = async (batch: QualityBatch) => {
    setLoadingId(batch.id)
    setAiAnalysis(prev => ({ ...prev, [batch.id]: '' }))
    const messages: ChatMessage[] = [{
      role: 'user',
      content: `批次：${batch.id}\n產品：${batch.product}\n產線：${batch.line}\n重量：${batch.weight}g (標準${batch.weightTarget}g ±${batch.weightTolerance}g)\n外觀分數：${batch.appearanceScore}\n微生物：${batch.microbial}\n金檢：${batch.metalDetect}\n中心溫度：${batch.coreTemp}°C\n判定：${batch.status}\n\n請分析此批次品質問題的可能原因與改善建議。`
    }]
    try {
      await streamChat(messages, 'llama-4-scout-17b-16e-instruct',
        '你是食品品質管理AI工程師，專精 HACCP、SPC 統計製程管制。請用繁體中文提供專業的品質分析與改善建議。',
        (chunk) => setAiAnalysis(prev => ({ ...prev, [batch.id]: (prev[batch.id] || '') + chunk }))
      )
    } catch {
      setAiAnalysis(prev => ({ ...prev, [batch.id]: 'AI 分析服務暫時無法使用。' }))
    }
    setLoadingId(null)
  }

  return (
    <div className="p-6 space-y-6 overflow-auto h-full">
      <ModuleHero
        video="/assets/quality-lab-video.mp4" image="/assets/quality-lab.jpg"
        title="品質管理中心"
        subtitle="AI 視覺檢測外觀缺陷，X-Ray 異物偵測，SPC 即時管制"
        techTags={[
          { label: 'AI 視覺檢測', color: 'purple' },
          { label: 'X-Ray 異物偵測', color: 'red' },
          { label: 'SPC 管制圖', color: 'blue' },
          { label: 'LIMS 串接', color: 'green' },
        ]}
      >
        <Button variant="outline" size="sm" onClick={() => setBatches(generateQualityData())} className="bg-white/20 backdrop-blur hover:bg-white/30 text-white border-0">
          <RefreshCw className="h-4 w-4 mr-1" /> 重新整理
        </Button>
      </ModuleHero>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><FlaskConical className="h-4 w-4" /> 今日批次</div>
            <div className="text-2xl font-bold">{batches.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><ShieldCheck className="h-4 w-4" /> 合格率</div>
            <div className={cn("text-2xl font-bold", passRate >= 95 ? "text-green-600" : "text-yellow-600")}>{passRate}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Search className="h-4 w-4" /> 待覆核</div>
            <div className="text-2xl font-bold text-yellow-600">{reviewCount}</div>
          </CardContent>
        </Card>
        <Card className={rejectCount > 0 ? 'border-red-300' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><ShieldAlert className="h-4 w-4" /> 不合格</div>
            <div className={cn("text-2xl font-bold", rejectCount > 0 ? "text-red-600" : "text-green-600")}>{rejectCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Batch List */}
      <div className="space-y-4">
        {batches.map((batch) => (
          <Card key={batch.id} className={cn(
            'overflow-hidden',
            batch.status === 'reject' && 'border-red-300 bg-red-50/30',
            batch.status === 'review' && 'border-yellow-300 bg-yellow-50/30'
          )}>
            <div className="flex">
              {/* QC Video Monitor */}
              <div className="relative w-[220px] min-h-[200px] flex-shrink-0 bg-black group">
                <video
                  src={batch.qcVideo}
                  poster={batch.qcImg}
                  autoPlay muted loop playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm rounded px-1.5 py-0.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                  <span className="text-[10px] text-white font-mono font-medium">QC LIVE</span>
                </div>
                <div className="absolute bottom-2 left-2 text-[9px] text-white/80 font-mono bg-black/50 px-1 rounded">
                  QC-CAM-{batch.line}
                </div>
                <button className="absolute top-2 right-2 p-1 rounded bg-black/50 text-white/80 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70">
                  <Maximize2 className="h-3 w-3" />
                </button>
              </div>

              {/* Data Panel */}
              <CardContent className="p-5 flex-1 min-w-0">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold text-foreground">{batch.product}</div>
                    <div className="text-sm text-muted-foreground">批次 {batch.id} | 產線 {batch.line} | {batch.time}</div>
                  </div>
                  <StatusBadge status={batch.status} />
                </div>

                <div className="grid grid-cols-5 gap-4 text-sm mb-3">
                  <div className="flex items-center gap-1.5">
                    <Weight className="h-3.5 w-3.5 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">重量</div>
                      <div className={cn("font-medium", Math.abs(batch.weight - batch.weightTarget) > batch.weightTolerance && "text-red-600")}>
                        {batch.weight}g
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">外觀分數</div>
                    <div className={cn("font-medium", batch.appearanceScore < 90 ? "text-yellow-600" : "text-green-600")}>
                      {batch.appearanceScore}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckIcon pass={batch.microbial === 'pass'} />
                    <div>
                      <div className="text-xs text-muted-foreground">微生物</div>
                      <div className="font-medium">{batch.microbial === 'pass' ? '合格' : '不合格'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckIcon pass={batch.metalDetect === 'pass'} />
                    <div>
                      <div className="text-xs text-muted-foreground">金屬檢測</div>
                      <div className="font-medium">{batch.metalDetect === 'pass' ? '合格' : '不合格'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Thermometer className="h-3.5 w-3.5 text-blue-500" />
                    <div>
                      <div className="text-xs text-muted-foreground">中心溫度</div>
                      <div className="font-medium">{batch.coreTemp}°C</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => getAnalysis(batch)}
                    disabled={loadingId === batch.id}
                  >
                    <BrainCircuit className="h-4 w-4 mr-1" />
                    {loadingId === batch.id ? 'AI 分析中...' : 'AI 品質分析'}
                  </Button>
                </div>

                {aiAnalysis[batch.id] && (
                  <div className="mt-3 bg-primary/5 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap border border-primary/10">
                    <div className="flex items-center gap-2 text-primary font-medium mb-2">
                      <BrainCircuit className="h-4 w-4" /> AI 品質分析報告
                    </div>
                    {aiAnalysis[batch.id]}
                    {loadingId === batch.id && <span className="inline-block w-1.5 h-4 bg-primary ml-0.5 animate-pulse" />}
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
