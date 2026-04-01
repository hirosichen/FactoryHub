// Simulated real-time data generators for demo purposes
// In production, these would come from MES/SCADA systems via Cloudflare Worker APIs

export function generateProductionData() {
  const now = new Date()
  const hours = Array.from({ length: 24 }, (_, i) => {
    const h = (now.getHours() - 23 + i + 24) % 24
    return `${String(h).padStart(2, '0')}:00`
  })

  return hours.map((time) => {
    const hour = parseInt(time)
    const isShift = (hour >= 6 && hour <= 14) || (hour >= 14 && hour <= 22)
    const base = isShift ? 1200 : 200
    const noise = (Math.random() - 0.5) * 150
    const output = Math.round(base + noise)
    const defects = Math.round(output * (0.005 + Math.random() * 0.015))
    return {
      time,
      output,
      defects,
      yieldRate: Math.round((1 - defects / output) * 10000) / 100,
      line1: Math.round(output * (0.35 + Math.random() * 0.05)),
      line2: Math.round(output * (0.33 + Math.random() * 0.05)),
      line3: Math.round(output * (0.28 + Math.random() * 0.05)),
    }
  })
}

export function generateProductionLines() {
  const lines = [
    { id: 'L1', name: '包子產線', product: '鮮肉包 / 芝麻包', capacity: 6000, deviceId: 'PLC-L1-001', deviceType: 'Siemens S7-1500', deviceImg: '/assets/iot-plc-panel.png', protocol: 'OPC-UA', monitorVideo: '/assets/monitor-baozi.mp4', monitorImg: '/assets/monitor-baozi.jpg' },
    { id: 'L2', name: '水餃產線', product: '高麗菜豬肉水餃', capacity: 8000, deviceId: 'PLC-L2-001', deviceType: 'Siemens S7-1500', deviceImg: '/assets/iot-plc-panel.png', protocol: 'OPC-UA', monitorVideo: '/assets/monitor-dumpling.mp4', monitorImg: '/assets/monitor-dumpling.jpg' },
    { id: 'L3', name: '饅頭產線', product: '黑糖饅頭 / 芋頭饅頭', capacity: 5000, deviceId: 'PLC-L3-001', deviceType: 'Mitsubishi iQ-R', deviceImg: '/assets/iot-plc-panel.png', protocol: 'Modbus TCP', monitorVideo: '/assets/monitor-mantou.mp4', monitorImg: '/assets/monitor-mantou.jpg' },
    { id: 'L4', name: '調理食品線', product: '蔥抓餅 / 蛋餅皮', capacity: 4000, deviceId: 'PLC-L4-001', deviceType: 'Mitsubishi iQ-R', deviceImg: '/assets/iot-plc-panel.png', protocol: 'Modbus TCP', monitorVideo: '/assets/monitor-prepared.mp4', monitorImg: '/assets/monitor-prepared.jpg' },
  ]

  return lines.map((line) => {
    const status = Math.random() > 0.15 ? 'running' : Math.random() > 0.5 ? 'idle' : 'alert'
    const currentOutput = status === 'running' ? Math.round(line.capacity * (0.7 + Math.random() * 0.25)) : 0
    const oee = status === 'running' ? Math.round((75 + Math.random() * 20) * 10) / 10 : 0
    return {
      ...line,
      status: status as 'running' | 'idle' | 'alert',
      currentOutput,
      oee,
      temperature: Math.round((22 + Math.random() * 4) * 10) / 10,
      humidity: Math.round(55 + (Math.random() - 0.5) * 15),
      speed: status === 'running' ? Math.round(80 + Math.random() * 20) : 0,
    }
  })
}

export function generateQualityData() {
  const batches = [
    { id: 'B2026033001', product: '鮮肉包', line: 'L1', time: '06:30', qcVideo: '/assets/qc-baozi.mp4', qcImg: '/assets/qc-baozi.jpg' },
    { id: 'B2026033002', product: '高麗菜豬肉水餃', line: 'L2', time: '07:15', qcVideo: '/assets/qc-dumpling.mp4', qcImg: '/assets/qc-dumpling.jpg' },
    { id: 'B2026033003', product: '黑糖饅頭', line: 'L3', time: '08:00', qcVideo: '/assets/qc-mantou.mp4', qcImg: '/assets/qc-mantou.jpg' },
    { id: 'B2026033004', product: '蔥抓餅', line: 'L4', time: '09:20', qcVideo: '/assets/qc-prepared.mp4', qcImg: '/assets/qc-prepared.jpg' },
    { id: 'B2026033005', product: '芝麻包', line: 'L1', time: '10:45', qcVideo: '/assets/qc-baozi.mp4', qcImg: '/assets/qc-baozi.jpg' },
    { id: 'B2026033006', product: '高麗菜豬肉水餃', line: 'L2', time: '11:30', qcVideo: '/assets/qc-dumpling.mp4', qcImg: '/assets/qc-dumpling.jpg' },
  ]

  return batches.map((batch) => {
    const weight = batch.product.includes('水餃') ? 12 : batch.product.includes('包') ? 80 : batch.product.includes('饅頭') ? 60 : 120
    const weightDev = (Math.random() - 0.5) * weight * 0.06
    const appearance = 85 + Math.random() * 15
    const microbial = Math.random() > 0.95 ? 'fail' : 'pass'
    const metalDetect = Math.random() > 0.98 ? 'fail' : 'pass'

    return {
      ...batch,
      weight: Math.round((weight + weightDev) * 10) / 10,
      weightTarget: weight,
      weightTolerance: Math.round(weight * 0.03 * 10) / 10,
      appearanceScore: Math.round(appearance * 10) / 10,
      microbial: microbial as 'pass' | 'fail',
      metalDetect: metalDetect as 'pass' | 'fail',
      coreTemp: Math.round((-18 + Math.random() * 3) * 10) / 10,
      status: (microbial === 'fail' || metalDetect === 'fail') ? 'reject' as const
        : appearance < 90 ? 'review' as const
        : 'pass' as const,
    }
  })
}

export function generateColdChainData() {
  const now = new Date()
  const hours = Array.from({ length: 24 }, (_, i) => {
    const h = (now.getHours() - 23 + i + 24) % 24
    return `${String(h).padStart(2, '0')}:00`
  })

  return hours.map((time) => {
    const hour = parseInt(time)
    const doorOpening = (hour >= 8 && hour <= 17) ? 0.5 + Math.random() * 1.5 : Math.random() * 0.3
    return {
      time,
      freezerTemp: Math.round((-25 + doorOpening + (Math.random() - 0.5) * 2) * 10) / 10,
      chillerTemp: Math.round((2 + doorOpening * 0.5 + (Math.random() - 0.5) * 1) * 10) / 10,
      humidity: Math.round(75 + (Math.random() - 0.5) * 10),
      compressorLoad: Math.round((60 + doorOpening * 15 + Math.random() * 10) * 10) / 10,
    }
  })
}

export function generateColdChainZones() {
  const zones = [
    { id: 'F1', name: '急速冷凍庫 A', type: '急凍', targetTemp: -35, capacity: 500, sensorId: 'TS-F1-001', sensorImg: '/assets/iot-temp-sensor.png', protocol: 'LoRaWAN' },
    { id: 'F2', name: '急速冷凍庫 B', type: '急凍', targetTemp: -35, capacity: 500, sensorId: 'TS-F2-001', sensorImg: '/assets/iot-temp-sensor.png', protocol: 'LoRaWAN' },
    { id: 'S1', name: '冷凍儲存區 1', type: '冷凍', targetTemp: -25, capacity: 2000, sensorId: 'TS-S1-001', sensorImg: '/assets/iot-temp-sensor.png', protocol: 'MQTT' },
    { id: 'S2', name: '冷凍儲存區 2', type: '冷凍', targetTemp: -25, capacity: 2000, sensorId: 'TS-S2-001', sensorImg: '/assets/iot-temp-sensor.png', protocol: 'MQTT' },
    { id: 'C1', name: '冷藏暫存區', type: '冷藏', targetTemp: 4, capacity: 300, sensorId: 'TS-C1-001', sensorImg: '/assets/iot-temp-sensor.png', protocol: 'BLE' },
    { id: 'D1', name: '出貨碼頭冷區', type: '冷藏', targetTemp: 5, capacity: 200, sensorId: 'TS-D1-001', sensorImg: '/assets/iot-temp-sensor.png', protocol: 'BLE' },
  ]

  return zones.map((zone) => {
    const tempDev = (Math.random() - 0.3) * 3
    const currentTemp = zone.targetTemp + tempDev
    const usage = Math.round(zone.capacity * (0.4 + Math.random() * 0.5))
    const alert = Math.abs(tempDev) > 2
    return {
      ...zone,
      currentTemp: Math.round(currentTemp * 10) / 10,
      usage,
      usagePercent: Math.round((usage / zone.capacity) * 100),
      status: alert ? 'alert' as const : 'normal' as const,
      compressorStatus: Math.random() > 0.1 ? 'running' as const : 'standby' as const,
      defrostSchedule: zone.type === '急凍' ? '每4小時' : '每8小時',
    }
  })
}

export function generateMaintenanceAlerts() {
  return [
    {
      id: 'M001',
      equipment: 'L1 包子成型機 主軸承',
      type: '預測性維護',
      severity: 'warning' as const,
      prediction: '振動值上升趨勢，預計 5 天內需檢修潤滑',
      confidence: 89,
      estimatedCost: 8000,
      createdAt: '2026-03-29T08:30:00',
      sensorId: 'VIB-L1-001',
      sensorType: '九軸振動感測器',
      sensorImg: '/assets/iot-vibration-sensor.png',
      protocol: 'MQTT',
    },
    {
      id: 'M002',
      equipment: 'L2 水餃包餡機 計量泵',
      type: '預測性維護',
      severity: 'info' as const,
      prediction: '填充精度略有偏移，建議排程校正',
      confidence: 91,
      estimatedCost: 3000,
      createdAt: '2026-03-29T14:15:00',
      sensorId: 'CT-L2-003',
      sensorType: '電流感測器',
      sensorImg: '/assets/iot-current-sensor.png',
      protocol: 'Modbus RTU',
    },
    {
      id: 'M003',
      equipment: '急速冷凍庫 A 壓縮機',
      type: '異常警報',
      severity: 'critical' as const,
      prediction: '排氣溫度持續偏高，冷媒可能洩漏，建議立即檢修',
      confidence: 94,
      estimatedCost: 45000,
      createdAt: '2026-03-30T06:45:00',
      sensorId: 'VIB-F1-002',
      sensorType: '九軸振動感測器',
      sensorImg: '/assets/iot-vibration-sensor.png',
      protocol: 'MQTT',
    },
    {
      id: 'M004',
      equipment: 'L3 饅頭發酵箱 溫控模組',
      type: '效能衰退',
      severity: 'warning' as const,
      prediction: '加熱響應時間增加 15%，加熱元件老化',
      confidence: 82,
      estimatedCost: 12000,
      createdAt: '2026-03-28T10:00:00',
      sensorId: 'CT-L3-001',
      sensorType: '電流感測器',
      sensorImg: '/assets/iot-current-sensor.png',
      protocol: 'Modbus RTU',
    },
    {
      id: 'M005',
      equipment: '金屬探測器 #2',
      type: '校正提醒',
      severity: 'info' as const,
      prediction: '距上次校正已 28 天，建議安排例行校正',
      confidence: 100,
      estimatedCost: 500,
      createdAt: '2026-03-30T09:20:00',
      sensorId: 'MD-QC-002',
      sensorType: '金屬探測器',
      sensorImg: '/assets/iot-vision-camera.png',
      protocol: 'RS-485',
    },
  ]
}

export function generateInventoryItems() {
  return [
    { id: 'R001', name: '中筋麵粉', unit: 'kg', stock: 12500, safetyStock: 5000, dailyUsage: 3200, supplier: '聯華實業', leadDays: 3 },
    { id: 'R002', name: '豬絞肉', unit: 'kg', stock: 2800, safetyStock: 2000, dailyUsage: 1500, supplier: '台畜公司', leadDays: 1 },
    { id: 'R003', name: '高麗菜', unit: 'kg', stock: 1200, safetyStock: 1500, dailyUsage: 800, supplier: '契作農場', leadDays: 1 },
    { id: 'R004', name: '黑糖', unit: 'kg', stock: 3500, safetyStock: 1000, dailyUsage: 400, supplier: '台糖公司', leadDays: 5 },
    { id: 'R005', name: '芝麻餡', unit: 'kg', stock: 800, safetyStock: 500, dailyUsage: 250, supplier: '義美原料', leadDays: 3 },
    { id: 'R006', name: '酵母粉', unit: 'kg', stock: 180, safetyStock: 100, dailyUsage: 45, supplier: '安琪酵母', leadDays: 7 },
    { id: 'R007', name: '食用油', unit: 'L', stock: 2200, safetyStock: 800, dailyUsage: 300, supplier: '泰山油品', leadDays: 3 },
    { id: 'R008', name: '蔥花（冷凍）', unit: 'kg', stock: 450, safetyStock: 300, dailyUsage: 150, supplier: '契作農場', leadDays: 2 },
  ]
}

export type ProductionDataPoint = ReturnType<typeof generateProductionData>[number]
export type ProductionLine = ReturnType<typeof generateProductionLines>[number]
export type QualityBatch = ReturnType<typeof generateQualityData>[number]
export type ColdChainDataPoint = ReturnType<typeof generateColdChainData>[number]
export type ColdChainZone = ReturnType<typeof generateColdChainZones>[number]
export type MaintenanceAlert = ReturnType<typeof generateMaintenanceAlerts>[number]
export type InventoryItem = ReturnType<typeof generateInventoryItems>[number]
