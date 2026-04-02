import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const NAV_LINKS = [
  { label: '為什麼需要', href: '#pain' },
  { label: '功能', href: '#features' },
  { label: '方案', href: '#pricing' },
]

const STATS = [
  { num: '12+', label: 'AI 智慧模組' },
  { num: 'AI', label: '品質 & 預測分析' },
  { num: 'IoT', label: '多協議整合' },
  { num: '即時', label: '全廠可視化' },
]

const PAINS = [
  {
    emoji: '📊',
    title: '數據散落各系統',
    desc: 'MES、SCADA、ERP 各自為政。要看全廠狀態得登入五個系統，每次交班報告都是一場惡夢。',
    img: '/assets/control-room.jpg',
  },
  {
    emoji: '🔧',
    title: '設備故障才知道壞了',
    desc: '沒有預警機制，設備異常只能靠老師傅經驗判斷。一次非計畫停機就是數十萬的產能損失。',
    img: '/assets/maintenance-hero.jpg',
  },
  {
    emoji: '📋',
    title: '品質靠人工巡檢',
    desc: '品質數據手抄記錄、人眼判斷良品。批次品質問題常在出貨後才被發現，造成退貨與客訴。',
    img: '/assets/cold-chain.jpg',
  },
]

const SOLUTIONS = [
  { icon: '🏭', title: '產線即時監控', desc: '串接 MES/SCADA，產量、OEE、稼動率一目了然。AI 自動識別產線瓶頸與異常。' },
  { icon: '🔬', title: 'AI 品質檢測', desc: 'AI 影像辨識不良品，SPC 管制圖自動生成。品質異常秒級告警，源頭攔截。' },
  { icon: '🤖', title: 'AI 預測性維護', desc: '振動頻譜分析預測設備壽命，排定最佳維護時機，避免非計畫停機。' },
  { icon: '⚡', title: '能源 & 環境管理', desc: '即時監控用電、用水、碳排放。AI 優化能耗模式，自動排程離峰生產。' },
]

const STEPS = [
  { num: '01', title: '連接設備', desc: '支援 OPC-UA、MQTT、Modbus 等 10+ 工業協議，AI 自動偵測設備並映射數據。' },
  { num: '02', title: '選擇模組', desc: '從應用市集挑選需要的 AI 模組。產線監控、品質管理、設備維護 — 一鍵安裝。' },
  { num: '03', title: '開始營運', desc: '即時儀表板上線，AI 持續學習優化。設備異常、品質偏差自動告警通知。' },
]

const FEATURES = [
  {
    title: 'AI 品質檢測 — 不良品無所遁形',
    desc: 'YOLO 影像辨識即時檢測產線上的不良品，自動分類異常模式。SPC 管制圖智能監控，偏差趨勢即時預警，品質問題在源頭就被攔截。',
    list: ['AI 影像辨識不良品', 'SPC 管制圖自動監控', '品質異常即時告警', '不良品模式自動分類'],
    img: '/assets/quality-lab.jpg',
  },
  {
    title: '預測性維護 — 設備故障提前預警',
    desc: 'AI 分析設備振動頻譜、溫度、電流等感測數據，預測軸承壽命與故障時間。讓維護從「壞了才修」變成「預知保養」，大幅降低非計畫停機。',
    list: ['振動頻譜 AI 分析', '設備健康度即時評分', '最佳維護時機排程', '備品需求自動預測'],
    img: '/assets/maintenance-hero.jpg',
    reverse: true,
  },
]

const PRICING = [
  {
    name: '基礎版',
    desc: '適合中小型製造工廠',
    price: '29,000',
    per: '/月',
    btn: '開始使用',
    btnStyle: 'outline' as const,
    features: ['產線監控（3 條線）', '品質管理基礎模組', 'IoT 設備連接（50 點）', '即時儀表板', 'Email 告警通知'],
  },
  {
    name: '專業版',
    desc: '適合多產線製造企業',
    price: '79,000',
    per: '/月',
    btn: '立即訂閱',
    btnStyle: 'accent' as const,
    popular: true,
    features: ['基礎版所有功能', '產線監控（無上限）', 'AI 預測性維護', '能源管理模組', 'APP & LINE 告警', '應用市集全模組'],
  },
  {
    name: '企業版',
    desc: '適合集團化製造企業',
    price: '聯繫我們',
    per: '',
    btn: '預約諮詢',
    btnStyle: 'dark' as const,
    features: ['專業版所有功能', '多工廠統一管理', '數位分身 3D 模擬', '客製化 ERP/MES 整合', '專屬技術顧問', 'SLA 服務保證'],
  },
]

export function LandingPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const nav = document.getElementById('lp-nav')
    const ann = document.getElementById('lp-announce')
    const handleScroll = () => {
      const y = window.scrollY
      nav?.classList.toggle('lp-scrolled', y > 60)
      if (y > 100) ann?.classList.add('lp-hide')
      else ann?.classList.remove('lp-hide')
    }
    window.addEventListener('scroll', handleScroll)

    const obs = new IntersectionObserver(
      es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add('lp-visible') }),
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )
    document.querySelectorAll('.lp-fade-up').forEach(el => obs.observe(el))

    return () => {
      window.removeEventListener('scroll', handleScroll)
      obs.disconnect()
    }
  }, [])

  return (
    <>
      <style>{`
:root{--lp-font:'Noto Sans TC',-apple-system,sans-serif;--lp-serif:'Noto Serif TC',serif;--lp-bg:#FAFAF9;--lp-surface:#fff;--lp-ink:#1A1A1A;--lp-ink2:#6B6B6B;--lp-ink3:#A0A0A0;--lp-border:#E8E8E5;--lp-accent:#EA580C;--lp-accent-soft:#FFF7ED;--lp-dark:#1A1A1A;--lp-ease:cubic-bezier(.22,1,.36,1)}
.lp{font-family:var(--lp-font);background:var(--lp-bg);color:var(--lp-ink);-webkit-font-smoothing:antialiased;overflow-x:hidden}
.lp img{display:block;max-width:100%}
.lp-container{max-width:1120px;margin:0 auto;padding:0 24px}

.lp-announce{position:fixed;top:0;left:0;right:0;z-index:101;background:var(--lp-dark);color:#fff;text-align:center;padding:10px 20px;font-size:.8rem;display:flex;align-items:center;justify-content:center;gap:8px;transition:transform .3s var(--lp-ease)}
.lp-announce.lp-hide{transform:translateY(-100%)}
.lp-pulse{width:6px;height:6px;border-radius:50%;background:#fb923c;animation:lp-pulse 2s ease infinite}
@keyframes lp-pulse{0%,100%{opacity:1}50%{opacity:.4}}

.lp-nav{position:fixed;top:38px;left:0;right:0;z-index:100;transition:all .3s var(--lp-ease)}
.lp-nav.lp-scrolled{top:0;background:rgba(250,250,249,.95);backdrop-filter:blur(12px);box-shadow:0 1px 0 var(--lp-border)}
.lp-nav-inner{max-width:1120px;margin:0 auto;padding:0 24px;height:64px;display:flex;align-items:center;justify-content:space-between}
.lp-nav-brand{font-size:1.25rem;font-weight:900;color:var(--lp-ink);text-decoration:none;letter-spacing:-.03em;display:flex;align-items:center;gap:8px}
.lp-nav-brand .logo{width:32px;height:32px;background:var(--lp-accent);border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:11px}
.lp-nav-links{display:flex;align-items:center;gap:28px}
.lp-nav-links a{color:var(--lp-ink2);text-decoration:none;font-size:.875rem;font-weight:500;transition:color .2s}
.lp-nav-links a:hover{color:var(--lp-ink)}
.lp-nav-cta{background:var(--lp-accent)!important;color:#fff!important;padding:9px 22px;border-radius:8px;font-weight:600;transition:all .2s;cursor:pointer;border:none;font-family:var(--lp-font);font-size:.875rem}
.lp-nav-cta:hover{filter:brightness(1.1);transform:translateY(-1px)}

.lp-hero{padding:160px 24px 40px;text-align:center}
.lp-hero-tag{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--lp-border);padding:7px 18px;border-radius:99px;font-size:.8rem;font-weight:500;color:var(--lp-accent);margin-bottom:28px;background:var(--lp-surface)}
.lp-hero h1{font-family:var(--lp-serif);font-size:clamp(2.2rem,5.5vw,3.6rem);font-weight:900;line-height:1.25;margin-bottom:20px;letter-spacing:-.03em}
.lp-hero h1 .hl{background:linear-gradient(transparent 60%,rgba(234,88,12,.15) 60%);padding:0 4px}
.lp-hero p{font-size:1.1rem;color:var(--lp-ink2);max-width:580px;margin:0 auto 36px;line-height:1.85}
.lp-hero-btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:12px}
.lp-btn{padding:15px 36px;border-radius:10px;font-size:1rem;font-weight:600;text-decoration:none;transition:all .2s;border:none;cursor:pointer;font-family:var(--lp-font);display:inline-flex;align-items:center;gap:8px}
.lp-btn-accent{background:var(--lp-accent);color:#fff}.lp-btn-accent:hover{filter:brightness(1.1);transform:translateY(-2px);box-shadow:0 8px 24px rgba(234,88,12,.25)}
.lp-btn-dark{background:var(--lp-dark);color:#fff}.lp-btn-dark:hover{background:#333;transform:translateY(-2px)}
.lp-hero-sub{font-size:.8rem;color:var(--lp-ink3)}
.lp-hero-img{max-width:960px;margin:48px auto 0;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.1);border:1px solid var(--lp-border)}
.lp-hero-img img{width:100%;display:block}

.lp-stats{background:var(--lp-surface);border:1px solid var(--lp-border);border-radius:16px;max-width:800px;margin:-40px auto 0;position:relative;z-index:10;display:grid;grid-template-columns:repeat(4,1fr);padding:28px 0}
.lp-stat{text-align:center;border-right:1px solid var(--lp-border)}.lp-stat:last-child{border:none}
.lp-stat-num{font-family:var(--lp-serif);font-size:1.6rem;font-weight:900;color:var(--lp-accent)}
.lp-stat-label{font-size:.8rem;color:var(--lp-ink2);margin-top:2px}

.lp-section{padding:100px 24px}
.lp-tag{font-size:.8rem;font-weight:600;color:var(--lp-accent);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px}
.lp-title{font-family:var(--lp-serif);font-size:clamp(1.6rem,3.5vw,2.2rem);font-weight:900;line-height:1.3;margin-bottom:16px;letter-spacing:-.02em}
.lp-desc{font-size:1rem;color:var(--lp-ink2);line-height:1.8;max-width:560px}

.lp-pain-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:48px}
.lp-pain-card{background:var(--lp-surface);border:1px solid var(--lp-border);border-radius:14px;overflow:hidden;transition:all .3s var(--lp-ease)}
.lp-pain-card:hover{transform:translateY(-4px);box-shadow:0 16px 40px rgba(0,0,0,.06)}
.lp-pain-card img{width:100%;height:200px;object-fit:cover}
.lp-pain-body{padding:20px}
.lp-pain-body h3{font-size:1rem;font-weight:700;margin-bottom:6px;display:flex;align-items:center;gap:6px}
.lp-pain-body p{font-size:.875rem;color:var(--lp-ink2);line-height:1.7}

.lp-solution{background:var(--lp-dark);color:#fff}
.lp-solution .lp-tag{color:#fb923c}
.lp-solution .lp-desc{color:rgba(255,255,255,.6)}
.lp-sol-grid{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center;margin-top:48px}
.lp-sol-img{border-radius:14px;overflow:hidden}
.lp-sol-img img{width:100%}
.lp-sol-features{display:flex;flex-direction:column;gap:24px}
.lp-sol-feat{display:flex;gap:14px;align-items:flex-start}
.lp-sol-feat .icon{width:40px;height:40px;border-radius:10px;background:rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0}
.lp-sol-feat h4{font-size:.95rem;font-weight:600;margin-bottom:4px}
.lp-sol-feat p{font-size:.85rem;color:rgba(255,255,255,.5);line-height:1.6}

.lp-steps-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:32px;margin-top:48px}
.lp-step-card{text-align:center;padding:32px 24px;background:var(--lp-surface);border:1px solid var(--lp-border);border-radius:14px;transition:all .3s var(--lp-ease)}
.lp-step-card:hover{border-color:var(--lp-accent);box-shadow:0 8px 24px rgba(0,0,0,.04)}
.lp-step-num{font-family:var(--lp-serif);font-size:2.4rem;font-weight:900;color:var(--lp-accent);margin-bottom:12px;line-height:1}
.lp-step-card h3{font-size:1rem;font-weight:700;margin-bottom:8px}
.lp-step-card p{font-size:.85rem;color:var(--lp-ink2);line-height:1.7}

.lp-feat-row{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center;margin-top:48px}
.lp-feat-row.reverse{direction:rtl}.lp-feat-row.reverse>*{direction:ltr}
.lp-feat-img{border-radius:14px;overflow:hidden;box-shadow:0 12px 32px rgba(0,0,0,.06);border:1px solid var(--lp-border)}
.lp-feat-img img{width:100%}
.lp-feat-text h3{font-family:var(--lp-serif);font-size:1.4rem;font-weight:900;margin-bottom:12px}
.lp-feat-text p{font-size:.95rem;color:var(--lp-ink2);line-height:1.8;margin-bottom:16px}
.lp-feat-list{list-style:none;display:flex;flex-direction:column;gap:8px;padding:0}
.lp-feat-list li{font-size:.875rem;color:var(--lp-ink2);display:flex;align-items:center;gap:8px}
.lp-feat-list li::before{content:'';width:18px;height:18px;border-radius:50%;background:var(--lp-accent-soft);flex-shrink:0;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' fill='%23EA580C' viewBox='0 0 16 16'%3E%3Cpath d='M13.5 2L6 10.5 2.5 7l-1 1L6 12.5l8.5-9.5z'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:center}

.lp-pricing-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:48px;max-width:960px;margin-left:auto;margin-right:auto}
.lp-price-card{background:var(--lp-surface);border:2px solid var(--lp-border);border-radius:16px;padding:32px 28px;text-align:center;transition:all .3s var(--lp-ease);position:relative}
.lp-price-card:hover{transform:translateY(-4px);box-shadow:0 16px 48px rgba(0,0,0,.08)}
.lp-price-card.pop{border-color:var(--lp-accent);box-shadow:0 8px 32px rgba(234,88,12,.1)}
.lp-price-badge{position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:var(--lp-accent);color:#fff;font-size:12px;font-weight:700;padding:4px 18px;border-radius:20px;white-space:nowrap}
.lp-price-card h3{font-size:1.1rem;font-weight:700;margin-bottom:4px}
.lp-price-card .desc{font-size:.8rem;color:var(--lp-ink2);margin-bottom:20px}
.lp-price-amt{font-family:var(--lp-serif);font-size:2.8rem;font-weight:900;color:var(--lp-ink);line-height:1;margin-bottom:4px}
.lp-price-amt .cur{font-size:1rem;font-weight:600;color:var(--lp-ink2);vertical-align:super}
.lp-price-per{font-size:.8rem;color:var(--lp-ink3);margin-bottom:20px}
.lp-price-btn{display:block;width:100%;padding:12px;border-radius:10px;font-size:14px;font-weight:600;text-decoration:none;text-align:center;transition:all .2s;border:none;cursor:pointer;font-family:var(--lp-font)}
.lp-price-btn.accent{background:var(--lp-accent);color:#fff}.lp-price-btn.accent:hover{background:#c2410c}
.lp-price-btn.outline{background:transparent;color:var(--lp-ink);border:2px solid var(--lp-border)}.lp-price-btn.outline:hover{border-color:var(--lp-ink)}
.lp-price-btn.dark{background:var(--lp-dark);color:#fff}.lp-price-btn.dark:hover{background:#333}
.lp-price-feats{list-style:none;margin-top:20px;padding:20px 0 0;border-top:1px solid var(--lp-border);text-align:left;display:flex;flex-direction:column;gap:10px}
.lp-price-feats li{font-size:.82rem;color:var(--lp-ink2);display:flex;align-items:center;gap:8px}
.lp-price-feats li::before{content:'';width:16px;height:16px;flex-shrink:0;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='%2310b981' stroke-width='2.5' viewBox='0 0 24 24'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M4.5 12.75l6 6 9-13.5'/%3E%3C/svg%3E") no-repeat center/contain}

.lp-cta{background:linear-gradient(135deg,var(--lp-accent) 0%,#c2410c 100%);padding:80px 24px;text-align:center}
.lp-cta h2{font-family:var(--lp-serif);font-size:clamp(1.6rem,3vw,2rem);font-weight:900;color:#fff;margin-bottom:12px}
.lp-cta p{color:rgba(255,255,255,.7);margin-bottom:32px;font-size:.95rem}
.lp-cta .lp-btn{background:#fff;color:var(--lp-accent);font-size:1.05rem;padding:16px 40px}
.lp-cta .lp-btn:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.2)}

.lp-footer{padding:48px 24px;text-align:center;border-top:1px solid var(--lp-border);color:var(--lp-ink3);font-size:.8rem}
.lp-footer a{color:var(--lp-ink2);text-decoration:none;margin:0 8px}
.lp-footer a:hover{color:var(--lp-ink)}

.lp-fade-up{opacity:0;transform:translateY(24px);transition:all .7s var(--lp-ease)}
.lp-fade-up.lp-visible{opacity:1;transform:none}
.lp-delay-1{transition-delay:.1s}
.lp-delay-2{transition-delay:.2s}

@media(max-width:768px){
  .lp-announce{font-size:.7rem;padding:8px 12px}
  .lp-nav{top:34px}
  .lp-nav-links{display:none}
  .lp-hero{padding:120px 20px 30px}
  .lp-hero h1{font-size:1.9rem}
  .lp-stats{grid-template-columns:repeat(2,1fr);margin:-20px 20px 0}
  .lp-stat:nth-child(2){border-right:none}
  .lp-stat{padding:16px 0;border-bottom:1px solid var(--lp-border)}
  .lp-stat:nth-child(3),.lp-stat:nth-child(4){border-bottom:none}
  .lp-pain-grid,.lp-steps-grid{grid-template-columns:1fr}
  .lp-sol-grid,.lp-feat-row,.lp-feat-row.reverse{grid-template-columns:1fr;gap:32px}
  .lp-section{padding:60px 20px}
  .lp-pricing-grid{grid-template-columns:1fr;max-width:380px}
  .lp-pricing-grid .pop{order:-1}
}
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;700;900&family=Noto+Sans+TC:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <div className="lp">
        {/* Announce */}
        <div className="lp-announce" id="lp-announce">
          <span className="lp-pulse" />
          FactoryHub — AI 驅動的智慧工廠平台，加速製造業數位轉型
          <a href="#pricing" style={{ color: '#fdba74', textDecoration: 'none', fontWeight: 600 }}> 查看方案 &rarr;</a>
        </div>

        {/* Nav */}
        <nav className="lp-nav" id="lp-nav">
          <div className="lp-nav-inner">
            <a href="/" className="lp-nav-brand">
              <div className="logo">FH</div>
              FactoryHub
            </a>
            <div className="lp-nav-links">
              {NAV_LINKS.map(l => (
                <a key={l.href} href={l.href}>{l.label}</a>
              ))}
              <button className="lp-nav-cta" onClick={() => navigate('/demo')}>
                進入 Demo
              </button>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="lp-hero">
          <div className="lp-hero-tag">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            AI 智慧工廠管理平台
          </div>
          <h1>產線、品質、設備<br/>一個平台<span className="hl">全搞定</span></h1>
          <p>整合產線監控、AI 品質檢測、預測性維護、能源管理。串接 OPC-UA、MQTT 等工業協議，AI 即時分析全廠數據，讓工廠真正智慧化。</p>
          <div className="lp-hero-btns">
            <a href="#pricing" className="lp-btn lp-btn-accent">查看方案 &rarr;</a>
            <button className="lp-btn lp-btn-dark" onClick={() => navigate('/demo')}>體驗 Demo</button>
          </div>
          <p className="lp-hero-sub">適用各類製造業 &middot; 免費 Demo 體驗 &middot; 30 天滿意保證</p>
          <div className="lp-hero-img lp-fade-up">
            <img src="/assets/hero-factory.jpg" alt="FactoryHub AI 智慧工廠平台" loading="eager" />
          </div>
        </section>

        {/* Stats */}
        <div className="lp-stats lp-fade-up">
          {STATS.map(s => (
            <div key={s.label} className="lp-stat">
              <div className="lp-stat-num">{s.num}</div>
              <div className="lp-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Pain Points */}
        <section className="lp-section" id="pain">
          <div className="lp-container">
            <div className="lp-tag">為什麼需要</div>
            <div className="lp-title">這些場景，製造業天天遇到</div>
            <p className="lp-desc">數據散落各系統、設備故障才發現、品質靠人工判斷 — 你的工廠是否也深受其擾？</p>
            <div className="lp-pain-grid">
              {PAINS.map((p, i) => (
                <div key={p.title} className={`lp-pain-card lp-fade-up ${i === 1 ? 'lp-delay-1' : i === 2 ? 'lp-delay-2' : ''}`}>
                  <img src={p.img} alt={p.title} loading="lazy" />
                  <div className="lp-pain-body">
                    <h3><span>{p.emoji}</span> {p.title}</h3>
                    <p>{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Solution */}
        <section className="lp-section lp-solution" id="solution">
          <div className="lp-container">
            <div className="lp-tag">解決方案</div>
            <div className="lp-title" style={{ color: '#fff' }}>一個平台，驅動工廠智慧化</div>
            <p className="lp-desc">從產線監控到品質檢測，從設備維護到能源管理 — 全部在同一個 AI 平台。</p>
            <div className="lp-sol-grid">
              <div className="lp-sol-img lp-fade-up">
                <img src="/assets/production-line.jpg" alt="FactoryHub 解決方案" loading="lazy" style={{ borderRadius: 14 }} />
              </div>
              <div className="lp-sol-features lp-fade-up lp-delay-1">
                {SOLUTIONS.map(s => (
                  <div key={s.title} className="lp-sol-feat">
                    <div className="icon">{s.icon}</div>
                    <div><h4>{s.title}</h4><p>{s.desc}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="lp-section" id="how">
          <div className="lp-container">
            <div className="lp-tag" style={{ textAlign: 'center' }}>三步開始</div>
            <div className="lp-title" style={{ textAlign: 'center' }}>連接、選擇、上線</div>
            <p className="lp-desc" style={{ textAlign: 'center', margin: '0 auto' }}>簡單三步，不需複雜系統整合。</p>
            <div className="lp-steps-grid">
              {STEPS.map((s, i) => (
                <div key={s.num} className={`lp-step-card lp-fade-up ${i === 1 ? 'lp-delay-1' : i === 2 ? 'lp-delay-2' : ''}`}>
                  <div className="lp-step-num">{s.num}</div>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="lp-section" id="features">
          <div className="lp-container">
            <div className="lp-tag">核心功能</div>
            <div className="lp-title">為製造業量身打造的 AI 模組</div>
            {FEATURES.map((f, i) => (
              <div key={f.title} className={`lp-feat-row lp-fade-up ${f.reverse ? 'reverse' : ''}`} style={i > 0 ? { marginTop: 80 } : undefined}>
                <div className="lp-feat-img"><img src={f.img} alt={f.title} loading="lazy" /></div>
                <div className="lp-feat-text">
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                  <ul className="lp-feat-list">
                    {f.list.map(li => <li key={li}>{li}</li>)}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="lp-section" id="pricing">
          <div className="lp-container">
            <div className="lp-tag" style={{ textAlign: 'center' }}>方案價格</div>
            <div className="lp-title" style={{ textAlign: 'center' }}>簡單透明，按需選擇</div>
            <p className="lp-desc" style={{ textAlign: 'center', margin: '0 auto' }}>從中小型工廠到集團製造企業，找到最適合的方案。</p>
            <div className="lp-pricing-grid">
              {PRICING.map((p, i) => (
                <div key={p.name} className={`lp-price-card lp-fade-up ${p.popular ? 'pop' : ''} ${i === 1 ? 'lp-delay-1' : i === 2 ? 'lp-delay-2' : ''}`}>
                  {p.popular && <div className="lp-price-badge">最受歡迎</div>}
                  <h3>{p.name}</h3>
                  <p className="desc">{p.desc}</p>
                  <div className="lp-price-amt">
                    {p.price === '聯繫我們' ? (
                      <span style={{ fontSize: '2rem' }}>{p.price}</span>
                    ) : (
                      <><span className="cur">NT$</span>{p.price}</>
                    )}
                  </div>
                  <p className="lp-price-per">{p.per || '\u00A0'}</p>
                  <button className={`lp-price-btn ${p.btnStyle}`}>{p.btn}</button>
                  <ul className="lp-price-feats">
                    {p.features.map(f => <li key={f}>{f}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="lp-cta">
          <h2>讓你的工廠更聰明、更高效</h2>
          <p>免費 Demo 體驗全功能，感受 AI 驅動的智慧製造。</p>
          <button className="lp-btn" onClick={() => navigate('/demo')}>體驗 Demo &rarr;</button>
        </section>

        {/* Footer */}
        <footer className="lp-footer">
          <p>&copy; 2026 FactoryHub &middot; <a href="/demo">進入平台</a></p>
          <p style={{ marginTop: 8 }}>Powered by Cloudflare Workers &middot; AI by Cloudflare</p>
        </footer>
      </div>
    </>
  )
}
