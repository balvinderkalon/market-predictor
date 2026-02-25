'use client'
import { useState, useEffect, useCallback } from 'react'

interface Asset {
  symbol: string
  name: string
  price: number
  change: number
  changePct: number
  signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
  score: number
  factors: string[]
}

interface MarketData {
  symbol: string
  price: number
  change: number
  changesPercentage: number
  dayHigh: number
  dayLow: number
  previousClose: number
  volume: number
  avgVolume: number
  open: number
  yearHigh: number
  yearLow: number
}

interface FearGreedData {
  value: number
  classification: string
}

const API_KEY = 'ZlQ7diP87Kz0NI6DNsolYql7AUF5LYc6'

const ASSETS = [
  { symbol: 'SPY', name: 'S&P 500' },
  { symbol: 'QQQ', name: 'Nasdaq 100' },
  { symbol: 'BTCUSD', name: 'Bitcoin' },
  { symbol: 'ETHUSD', name: 'Ethereum' },
  { symbol: 'TSLA', name: 'Tesla' },
  { symbol: 'NVDA', name: 'NVIDIA' },
  { symbol: 'PLTR', name: 'Palantir' },
  { symbol: 'AMZN', name: 'Amazon' },
  { symbol: 'AAPL', name: 'Apple' },
  { symbol: 'AMD', name: 'AMD' },
]

function analyzeAsset(d: MarketData): { signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; score: number; factors: string[] } {
  let score = 50
  const factors: string[] = []

  // Price change momentum
  if (d.changesPercentage > 3) { score += 20; factors.push('Strong daily momentum ↑') }
  else if (d.changesPercentage > 1) { score += 10; factors.push('Positive momentum ↑') }
  else if (d.changesPercentage > 0) { score += 5; factors.push('Slight green') }
  else if (d.changesPercentage < -3) { score -= 20; factors.push('Heavy selling pressure ↓') }
  else if (d.changesPercentage < -1) { score -= 10; factors.push('Negative momentum ↓') }
  else if (d.changesPercentage < 0) { score -= 5; factors.push('Slight red') }

  // Volume analysis
  if (d.avgVolume > 0) {
    const volRatio = d.volume / d.avgVolume
    if (volRatio > 1.5 && d.changesPercentage > 0) { score += 15; factors.push('High volume buying') }
    else if (volRatio > 1.5 && d.changesPercentage < 0) { score -= 15; factors.push('High volume selling') }
    else if (volRatio < 0.5) { factors.push('Low volume — weak conviction') }
  }

  // Position in daily range
  if (d.dayHigh > d.dayLow) {
    const rangePos = (d.price - d.dayLow) / (d.dayHigh - d.dayLow)
    if (rangePos > 0.8) { score += 8; factors.push('Trading near daily high') }
    else if (rangePos < 0.2) { score -= 8; factors.push('Trading near daily low') }
  }

  // Gap analysis
  if (d.previousClose > 0) {
    const gapPct = ((d.open - d.previousClose) / d.previousClose) * 100
    if (gapPct > 1) { score += 5; factors.push('Gapped up at open') }
    else if (gapPct < -1) { score -= 5; factors.push('Gapped down at open') }
  }

  // 52-week position
  if (d.yearHigh > d.yearLow) {
    const yearPos = (d.price - d.yearLow) / (d.yearHigh - d.yearLow)
    if (yearPos > 0.9) { score += 10; factors.push('Near 52-week high 🔥') }
    else if (yearPos > 0.7) { score += 5; factors.push('Upper range of 52-week') }
    else if (yearPos < 0.2) { score -= 10; factors.push('Near 52-week low ⚠️') }
    else if (yearPos < 0.3) { score -= 5; factors.push('Lower range of 52-week') }
  }

  score = Math.max(0, Math.min(100, score))
  const signal = score >= 60 ? 'BULLISH' : score <= 40 ? 'BEARISH' : 'NEUTRAL'

  return { signal, score, factors }
}

function SignalBadge({ signal }: { signal: string }) {
  const colors = {
    BULLISH: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    BEARISH: 'bg-red-500/20 text-red-400 border-red-500/30',
    NEUTRAL: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  }
  const icons = { BULLISH: '🐂', BEARISH: '🐻', NEUTRAL: '➖' }
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-bold border ${colors[signal as keyof typeof colors]}`}>
      {icons[signal as keyof typeof icons]} {signal}
    </span>
  )
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 60 ? 'bg-emerald-500' : score <= 40 ? 'bg-red-500' : 'bg-yellow-500'
  return (
    <div className="w-full bg-gray-800 rounded-full h-2 mt-2">
      <div className={`${color} h-2 rounded-full transition-all duration-1000`} style={{ width: `${score}%` }} />
    </div>
  )
}

export default function Home() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [overallSignal, setOverallSignal] = useState<'BULLISH' | 'BEARISH' | 'NEUTRAL'>('NEUTRAL')
  const [overallScore, setOverallScore] = useState(50)
  const [fearGreed, setFearGreed] = useState<FearGreedData | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const symbols = ASSETS.map(a => a.symbol).join(',')
      const res = await fetch(`https://financialmodelingprep.com/api/v3/quote/${symbols}?apikey=${API_KEY}`)
      const data: MarketData[] = await res.json()

      const analyzed: Asset[] = data.map(d => {
        const config = ASSETS.find(a => a.symbol === d.symbol)
        const analysis = analyzeAsset(d)
        return {
          symbol: d.symbol,
          name: config?.name || d.symbol,
          price: d.price,
          change: d.change,
          changePct: d.changesPercentage,
          ...analysis,
        }
      })

      // Overall market signal (weighted by index ETFs)
      const avgScore = analyzed.reduce((sum, a) => sum + a.score, 0) / analyzed.length
      setOverallScore(Math.round(avgScore))
      setOverallSignal(avgScore >= 60 ? 'BULLISH' : avgScore <= 40 ? 'BEARISH' : 'NEUTRAL')
      setAssets(analyzed.sort((a, b) => b.score - a.score))
      setLastUpdate(new Date().toLocaleTimeString())

      // Fear & Greed
      try {
        const fgRes = await fetch('https://api.alternative.me/fng/?limit=1')
        const fgData = await fgRes.json()
        if (fgData?.data?.[0]) {
          setFearGreed({
            value: parseInt(fgData.data[0].value),
            classification: fgData.data[0].value_classification,
          })
        }
      } catch {}
    } catch (err) {
      console.error('Failed to fetch:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [fetchData])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">📊</div>
          <p className="text-gray-400">Analyzing markets...</p>
        </div>
      </div>
    )
  }

  const bullCount = assets.filter(a => a.signal === 'BULLISH').length
  const bearCount = assets.filter(a => a.signal === 'BEARISH').length

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-2">
          {overallSignal === 'BULLISH' ? '🐂' : overallSignal === 'BEARISH' ? '🐻' : '⚖️'} Market Predictor
        </h1>
        <p className="text-gray-400">Real-time bullish/bearish signals • Auto-refreshes every 60s</p>
        <p className="text-gray-500 text-sm mt-1">Last update: {lastUpdate}</p>
      </div>

      {/* Overall Signal */}
      <div className={`rounded-2xl p-6 mb-8 border ${
        overallSignal === 'BULLISH' ? 'bg-emerald-500/5 border-emerald-500/20' :
        overallSignal === 'BEARISH' ? 'bg-red-500/5 border-red-500/20' :
        'bg-yellow-500/5 border-yellow-500/20'
      }`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-lg text-gray-400 mb-1">Overall Market Sentiment</h2>
            <div className="flex items-center gap-3">
              <span className={`text-5xl font-bold ${
                overallSignal === 'BULLISH' ? 'text-emerald-400' :
                overallSignal === 'BEARISH' ? 'text-red-400' : 'text-yellow-400'
              }`}>{overallScore}</span>
              <div>
                <SignalBadge signal={overallSignal} />
                <p className="text-gray-400 text-sm mt-1">{bullCount} bullish • {bearCount} bearish</p>
              </div>
            </div>
            <ScoreBar score={overallScore} />
          </div>
          {fearGreed && (
            <div className="text-center bg-gray-800/50 rounded-xl p-4 min-w-[160px]">
              <p className="text-gray-400 text-sm">Crypto Fear & Greed</p>
              <p className={`text-3xl font-bold ${
                fearGreed.value >= 60 ? 'text-emerald-400' :
                fearGreed.value <= 40 ? 'text-red-400' : 'text-yellow-400'
              }`}>{fearGreed.value}</p>
              <p className="text-gray-400 text-sm">{fearGreed.classification}</p>
            </div>
          )}
        </div>
      </div>

      {/* Asset Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assets.map(asset => (
          <div key={asset.symbol} className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-5 hover:border-gray-600 transition-all">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-xl font-bold">{asset.symbol}</h3>
                <p className="text-gray-400 text-sm">{asset.name}</p>
              </div>
              <SignalBadge signal={asset.signal} />
            </div>
            <div className="flex items-baseline gap-3 mb-3">
              <span className="text-2xl font-bold">
                {asset.symbol.includes('USD') ? `$${asset.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}` :
                 `$${asset.price.toFixed(2)}`}
              </span>
              <span className={`text-lg font-semibold ${asset.changePct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {asset.changePct >= 0 ? '+' : ''}{asset.changePct.toFixed(2)}%
              </span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-gray-400">Score:</span>
              <span className={`text-sm font-bold ${
                asset.score >= 60 ? 'text-emerald-400' : asset.score <= 40 ? 'text-red-400' : 'text-yellow-400'
              }`}>{asset.score}/100</span>
            </div>
            <ScoreBar score={asset.score} />
            <div className="mt-3 flex flex-wrap gap-1">
              {asset.factors.map((f, i) => (
                <span key={i} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-full">{f}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center mt-8 text-gray-500 text-sm">
        <p>Built by Joga Singh ⚔️ • Not financial advice • Signals based on price action, volume & range analysis</p>
      </div>
    </main>
  )
}
