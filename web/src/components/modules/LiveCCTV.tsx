import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Video, Maximize2, Volume2, VolumeX, Camera, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CameraFeed {
  id: string
  name: string
  location: string
  src: string
  type: 'video' | 'image'
  status: 'online' | 'offline'
}

const CAMERAS: CameraFeed[] = [
  { id: 'cam-01', name: 'CAM-01 包子產線', location: '1F 產線區', src: '/assets/cctv-production-line.mp4', type: 'video', status: 'online' },
  { id: 'cam-02', name: 'CAM-02 急凍冷庫', location: 'B1 冷凍儲存區', src: '/assets/cctv-cold-storage.mp4', type: 'video', status: 'online' },
  { id: 'cam-03', name: 'CAM-03 品管實驗室', location: '2F 品管區', src: '/assets/cctv-quality-lab.mp4', type: 'video', status: 'online' },
  { id: 'cam-04', name: 'CAM-04 IoT 設備區', location: '1F 機房', src: '/assets/cctv-iot-room.mp4', type: 'video', status: 'online' },
  { id: 'cam-05', name: 'CAM-05 中控室', location: '3F 控制中心', src: '/assets/cctv-control-room.mp4', type: 'video', status: 'online' },
  { id: 'cam-06', name: 'CAM-06 水餃產線', location: '1F 產線區', src: '/assets/cctv-dumpling-line.mp4', type: 'video', status: 'online' },
]

function CameraCard({ camera, expanded, onClick }: { camera: CameraFeed; expanded: boolean; onClick: () => void }) {
  const [muted, setMuted] = useState(true)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <Card className={cn(
      "overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-primary/30",
      expanded && "col-span-2 row-span-2"
    )} onClick={onClick}>
      <div className="relative bg-black aspect-video">
        {camera.type === 'video' ? (
          <video
            src={camera.src}
            autoPlay
            loop
            muted={muted}
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <img src={camera.src} alt={camera.name} className="w-full h-full object-cover" />
        )}

        {/* Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top bar */}
          <div className="absolute top-0 inset-x-0 bg-gradient-to-b from-black/60 to-transparent p-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Circle className="h-2 w-2 fill-red-500 text-red-500 animate-pulse" />
              <span className="text-[10px] font-mono text-white/90">{camera.name}</span>
            </div>
            <span className="text-[10px] font-mono text-white/70">
              {time.toLocaleTimeString('zh-TW', { hour12: false })}
            </span>
          </div>

          {/* Bottom bar */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2 flex items-center justify-between">
            <span className="text-[10px] text-white/70">{camera.location}</span>
            <div className="flex items-center gap-1 pointer-events-auto">
              {camera.type === 'video' && (
                <button
                  onClick={(e) => { e.stopPropagation(); setMuted(!muted) }}
                  className="p-1 rounded hover:bg-white/20 text-white/70 hover:text-white"
                >
                  {muted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onClick() }}
                className="p-1 rounded hover:bg-white/20 text-white/70 hover:text-white"
              >
                <Maximize2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Status indicator */}
        <div className="absolute top-2 right-2">
          <Badge className={cn(
            "text-[9px] px-1.5 py-0",
            camera.status === 'online' ? 'bg-green-600/80 text-white' : 'bg-red-600/80 text-white'
          )}>
            {camera.status === 'online' ? 'LIVE' : 'OFFLINE'}
          </Badge>
        </div>
      </div>
    </Card>
  )
}

export function LiveCCTV() {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const onlineCount = CAMERAS.filter(c => c.status === 'online').length

  return (
    <div className="p-6 space-y-5 overflow-auto h-full bg-gray-950">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-red-600/20 flex items-center justify-center">
            <Video className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">即時影像監控</h2>
            <p className="text-gray-400 text-sm">Live CCTV Monitoring</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-800 rounded-full px-3 py-1.5">
            <Circle className="h-2 w-2 fill-red-500 text-red-500 animate-pulse" />
            <span className="text-red-400 font-medium">REC</span>
            <span className="text-gray-500">|</span>
            <Camera className="h-3.5 w-3.5" />
            <span>{onlineCount}/{CAMERAS.length} 在線</span>
            <span className="text-gray-500">|</span>
            <span className="font-mono">{time.toLocaleTimeString('zh-TW', { hour12: false })}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
            onClick={() => setExpandedId(null)}
          >
            {expandedId ? '全部顯示' : '3x2 網格'}
          </Button>
        </div>
      </div>

      {/* Camera Grid */}
      {expandedId ? (
        <div className="grid grid-cols-1 gap-4">
          <CameraCard
            camera={CAMERAS.find(c => c.id === expandedId)!}
            expanded
            onClick={() => setExpandedId(null)}
          />
          <div className="grid grid-cols-5 gap-2">
            {CAMERAS.filter(c => c.id !== expandedId).map(cam => (
              <Card key={cam.id} className="overflow-hidden cursor-pointer opacity-70 hover:opacity-100 transition-opacity" onClick={() => setExpandedId(cam.id)}>
                <div className="relative bg-black aspect-video">
                  {cam.type === 'video' ? (
                    <video src={cam.src} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                  ) : (
                    <img src={cam.src} alt={cam.name} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-black/60 px-1.5 py-0.5">
                    <span className="text-[9px] font-mono text-white/80">{cam.name}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {CAMERAS.map(cam => (
            <CameraCard
              key={cam.id}
              camera={cam}
              expanded={false}
              onClick={() => setExpandedId(cam.id)}
            />
          ))}
        </div>
      )}

      {/* Info bar */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-3 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <span>影像串流: RTSP over WebSocket</span>
            <span>錄影保存: 30 天</span>
            <span>AI 事件偵測: 啟用中</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-600/20 text-green-400 text-[10px]">NVR 正常</Badge>
            <Badge className="bg-blue-600/20 text-blue-400 text-[10px]">儲存空間 62%</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
