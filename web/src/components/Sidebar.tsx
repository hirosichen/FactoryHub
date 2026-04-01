import { useState, useEffect } from 'react'
import { Factory, BarChart3, FlaskConical, Snowflake, Wrench, Thermometer, Video, Package, Bot, BookOpen, Store, Link2, type LucideIcon } from 'lucide-react'
import { type Module } from '@/lib/modules'
import { cn } from '@/lib/utils'

interface Props {
  modules: Module[]
  activeModuleId: string
  onSelectModule: (id: string) => void
}

const typeLabels: Record<string, string> = {
  dashboard: '監控',
  interactive: '管理',
  chat: '對話',
  system: '系統',
}

const moduleIcons: Record<string, LucideIcon> = {
  production: BarChart3,
  quality: FlaskConical,
  coldchain: Snowflake,
  maintenance: Wrench,
  'smart-hvac': Thermometer,
  cctv: Video,
  inventory: Package,
  assistant: Bot,
  recipe: BookOpen,
  appstore: Store,
  datasources: Link2,
}

function groupModules(modules: Module[]) {
  const groups: Record<string, Module[]> = {}
  for (const mod of modules) {
    const label = typeLabels[mod.type] || mod.type
    if (!groups[label]) groups[label] = []
    groups[label].push(mod)
  }
  return groups
}

const SYSTEMS = [
  { name: 'MES', ok: true },
  { name: 'SCADA', ok: true },
  { name: 'ERP', ok: true },
  { name: 'IoT', ok: true },
]

export function Sidebar({ modules, activeModuleId, onSelectModule }: Props) {
  const groups = groupModules(modules)
  const [clock, setClock] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <aside className="w-[260px] border-r bg-sidebar flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
            <Factory className="h-[18px] w-[18px] text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground text-[15px] tracking-tight">奇美食品</h1>
            <p className="text-[11px] text-muted-foreground tracking-wide">AI 智慧工廠平台</p>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="mx-4 mb-3 px-3 py-2 rounded-lg bg-muted/40">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {SYSTEMS.map(sys => (
              <div key={sys.name} className="flex items-center gap-1">
                <span className="relative flex h-[5px] w-[5px]">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-[5px] w-[5px] bg-green-500" />
                </span>
                <span className="text-[9px] font-medium text-muted-foreground">{sys.name}</span>
              </div>
            ))}
          </div>
          <span className="text-[9px] text-muted-foreground/60 font-mono tabular-nums">
            {clock.toLocaleTimeString('zh-TW', { hour12: false })}
          </span>
        </div>
      </div>

      {/* Modules */}
      <nav className="flex-1 px-3 space-y-5 overflow-auto pb-4">
        {Object.entries(groups).map(([label, mods]) => (
          <div key={label}>
            <p className="text-[10px] font-medium text-muted-foreground/70 px-3 pb-1.5 uppercase tracking-[0.08em]">
              {label}
            </p>
            <div className="space-y-0.5">
              {mods.map((mod) => {
                const Icon = moduleIcons[mod.id] ?? Factory
                const isActive = activeModuleId === mod.id
                return (
                  <button
                    key={mod.id}
                    onClick={() => onSelectModule(mod.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-150 cursor-pointer",
                      isActive
                        ? "bg-primary/10 text-foreground"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("h-[16px] w-[16px] shrink-0", isActive && "text-primary")} strokeWidth={1.8} />
                    <div className="min-w-0">
                      <div className={cn("text-[13px] truncate leading-tight", isActive && "font-medium")}>{mod.name}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-3 border-t">
        <p className="text-[10px] text-muted-foreground/50 text-center tracking-wide">
          Powered by Cloudflare AI
        </p>
      </div>
    </aside>
  )
}
