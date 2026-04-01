import { useState, lazy, Suspense } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { ChatInterface } from '@/components/ChatInterface'
import { modules } from '@/lib/modules'
import './index.css'

const ProductionMonitor = lazy(() => import('@/components/modules/ProductionMonitor').then(m => ({ default: m.ProductionMonitor })))
const QualityControl = lazy(() => import('@/components/modules/QualityControl').then(m => ({ default: m.QualityControl })))
const ColdChain = lazy(() => import('@/components/modules/ColdChain').then(m => ({ default: m.ColdChain })))
const MaintenanceAI = lazy(() => import('@/components/modules/MaintenanceAI').then(m => ({ default: m.MaintenanceAI })))
const InventorySystem = lazy(() => import('@/components/modules/InventorySystem').then(m => ({ default: m.InventorySystem })))
const SmartHVAC = lazy(() => import('@/components/modules/SmartHVAC').then(m => ({ default: m.SmartHVAC })))
const LiveCCTV = lazy(() => import('@/components/modules/LiveCCTV').then(m => ({ default: m.LiveCCTV })))
const AppStore = lazy(() => import('@/components/modules/AppStore').then(m => ({ default: m.AppStore })))
const DataSources = lazy(() => import('@/components/modules/DataSources').then(m => ({ default: m.DataSources })))

function ModuleView({ moduleId }: { moduleId: string }) {
  const mod = modules.find((m) => m.id === moduleId)!

  switch (moduleId) {
    case 'production':
      return <ProductionMonitor />
    case 'quality':
      return <QualityControl />
    case 'coldchain':
      return <ColdChain />
    case 'maintenance':
      return <MaintenanceAI />
    case 'inventory':
      return <InventorySystem />
    case 'smart-hvac':
      return <SmartHVAC />
    case 'cctv':
      return <LiveCCTV />
    case 'appstore':
      return <AppStore />
    case 'datasources':
      return <DataSources />
    default:
      return <ChatInterface key={moduleId} module={mod} />
  }
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-muted-foreground text-sm">載入中...</div>
    </div>
  )
}

function App() {
  const [activeModuleId, setActiveModuleId] = useState(modules[0].id)

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        modules={modules}
        activeModuleId={activeModuleId}
        onSelectModule={setActiveModuleId}
      />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Suspense fallback={<LoadingFallback />}>
          <ModuleView moduleId={activeModuleId} />
        </Suspense>
      </main>
    </div>
  )
}

export default App
