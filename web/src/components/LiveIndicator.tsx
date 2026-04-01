import { Pause, Play, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatTime } from '@/lib/useAutoRefresh'

interface Props {
  lastUpdated: Date
  isLive: boolean
  onToggle: () => void
  onRefresh: () => void
}

export function LiveIndicator({ lastUpdated, isLive, onToggle, onRefresh }: Props) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-1.5 text-[11px] text-white/70 bg-white/10 backdrop-blur-sm rounded-full px-2.5 py-1">
        {isLive ? (
          <span className="relative flex h-[6px] w-[6px]">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-[6px] w-[6px] bg-green-500" />
          </span>
        ) : (
          <span className="inline-flex rounded-full h-[6px] w-[6px] bg-white/40" />
        )}
        <span className="font-mono tabular-nums">{formatTime(lastUpdated)}</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10 rounded-full"
        onClick={onToggle}
      >
        {isLive ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10 rounded-full"
        onClick={onRefresh}
      >
        <RefreshCw className="h-3 w-3" />
      </Button>
    </div>
  )
}
