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
  sma20?: number
  rsi?: number
  volume: number
  avgVolume: number
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
  marketCap?: number
  pe?: number
}

interface HistoricalPrice {
  date: string
  close: number
  volume: number
}

interface FearGreedData {
  value: number
  classification: string
}

interface NewsItem {
  title: string
  url: string
  publishedDate: string
  symbol: string
  site: string
  sentiment?: string
}

const API_KEY = 'ZlQ7diP87Kz0NI6DNsolYql7AUF5LYc6'

const ASSETS = [
  { symbol: 'SPY', name: 'S&P 500', type: 'index' },
  { symbol: 'QQQ', name: 'Nasdaq 100', type: 'index' },
  { symbol: 'BTCUSD', name: 'Bitcoin', type: 'crypto' },
  { symbol: 'ETHUSD', name: 'Ethereum', type: 'crypto' },
  { symbol: 'TSLA', name: 'Tesla', type: 'stock' },
  { symbol: 'NVDA', name: 'NVIDIA', type: 'stock' },
  { symbol: 'PLTR', name: 'Palantir', type: 'stock' },
  { symbol: 'AMZN', name: 'Amazon', type: 'stock' },
  { symbol: 'AAPL', name: 'Apple', type: 'stock' },
  { symbol: 'AMD', name: 'AMD', type: 'stock' },
  { symbol: 'GOOGL', name: 'Google', type: 'stock' },
  { symbol: 'META', name: 'Meta', type: 'stock' },
  { symbol: 'MSFT', name: 'Microsoft', type: 'stock' },
  { symbol: 'HOOD', name: 'Robinhood', type: 'stock' },
  { symbol: 'SNOW', name: 'Snowflake', type: 'stock' },
  { symbol: 'SOLUSD', name: 'Solana', type: 'crypto' },
]

function calculateRSI(prices: number[]): number {
  if (prices.length < 15) return 50
  let gains = 0, losses = 0
  for (let i = 1; i < 15; i++) {
    const diff = prices[i - 1] - prices[i] // reversed because newest first
    if (diff > 0) gains += diff
    else losses -= diff
  }
  if (losses === 0) return 100
  const rs = (gains / 14) / (losses / 14)
  return 100 - (100 / (1 + rs))
}

function calculateSMA(prices: number[], period: number): number {
  const slice = prices.slice(0, period)
  return slice.reduce((a, b) => a + b, 0) / slice.length
}

function analyzeAsset(d: MarketData, historicalPrices?: number[], rsi?: number, sma20?: number): { signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; score: number; factors: string[] } {
  let score = 50
  const factors: string[] = []

  // Price change momentum
  if (d.changesPercentage > 3) { score += 18; factors.push('🔥 Strong momentum (+' + d.changesPercentage.toFixed(1) + '%)') }
  else if (d.changesPercentage > 1) { score += 10; factors.push('📈 Positive momentum') }
  else if (d.changesPercentage > 0) { score += 4; factors.push('Slight green') }
  else if (d.changesPercentage < -3) { score -= 18; factors.push('💥 Heavy selling (-' + Math.abs(d.changesPercentage).toFixed(1) + '%)') }
  else if (d.changesPercentage < -1) { score -= 10; factors.push('📉 Negative momentum') }
  else if (d.changesPercentage < 0) { score -= 4; factors.push('Slight red') }

  // Volume analysis
  if (d.avgVolume > 0) {
    const volRatio = d.volume / d.avgVolume
    if (volRatio > 2 && d.changesPercentage > 0) { score += 15; factors.push('🚀 Huge volume buying (' + volRatio.toFixed(1) + 'x avg)') }
    else if (volRatio > 1.5 && d.changesPercentage > 0) { score += 10; factors.push('📊 High volume buying') }
    else if (volRatio > 2 && d.changesPercentage < 0) { score -= 15; factors.push('🩸 Huge volume selling') }
    else if (volRatio > 1.5 && d.changesPercentage < 0) { score -= 10; factors.push('📊 High volume selling') }
    else if (volRatio < 0.5) { factors.push('😴 Low volume') }
  }

  // RSI
  if (rsi !== undefined) {
    if (rsi > 80) { score -= 10; factors.push('⚠️ RSI overbought (' + rsi.toFixed(0) + ')') }
    else if (rsi > 70) { score -= 5; factors.push('RSI elevated (' + rsi.toFixed(0) + ')') }
    else if (rsi < 20) { score += 10; factors.push('💎 RSI deeply oversold (' + rsi.toFixed(0) + ')') }
    else if (rsi < 30) { score += 5; factors.push('RSI oversold (' + rsi.toFixed(0) + ')') }
    else if (rsi >= 45 && rsi <= 55) { factors.push('RSI neutral (' + rsi.toFixed(0) + ')') }
  }

  // SMA20 - price vs moving average
  if (sma20 && sma20 > 0) {
    const smaDistance = ((d.price - sma20) / sma20) * 100
    if (smaDistance > 5) { score += 8; factors.push('Above 20-day SMA (+' + smaDistance.toFixed(1) + '%)') }
    else if (smaDistance > 0) { score += 4; factors.push('Above 20-day SMA') }
    else if (smaDistance < -5) { score -= 8; factors.push('Below 20-day SMA (' + smaDistance.toFixed(1) + '%)') }
    else if (smaDistance < 0) { score -= 4; factors.push('Below 20-day SMA') }
  }

  // Position in daily range
  if (d.dayHigh > d.dayLow) {
    const rangePos = (d.price - d.dayLow) / (d.dayHigh - d.dayLow)
    if (rangePos > 0.85) { score += 6; factors.push('Near daily high') }
    else if (rangePos < 0.15) { score -= 6; factors.push('Near daily low') }
  }

  // Gap analysis
  if (d.previousClose > 0) {
    const gapPct = ((d.open - d.previousClose) / d.previousClose) * 100
    if (gapPct > 2) { score += 6; factors.push('Gap up at open (+' + gapPct.toFixed(1) + '%)') }
    else if (gapPct < -2) { score -= 6; factors.push('Gap down at open (' + gapPct.toFixed(1) + '%)') }
  }

  // 52-week position
  if (d.yearHigh > d.yearLow) {
    const yearPos = (d.price - d.yearLow) / (d.yearHigh - d.yearLow)
    if (yearPos > 0.95) { score += 10; factors.push('🏔️ At 52-week high') }
    else if (yearPos > 0.8) { score += 5; factors.push('Near 52-week high') }
    else if (yearPos < 0.1) { score -= 10; factors.push('🕳️ At 52-week low') }
    else if (yearPos < 0.25) { score -= 5; factors.push('Near 52-week low') }
  }

  score = Math.max(0, Math.min(100, score))
  const signal = score >= 60 ? 'BULLISH' : score <= 40 ? 'BEARISH' : 'NEUTRAL'

  return { signal, score, factors }
}

function SignalBadge({ signal, size = 'sm' }: { signal: string; size?: 'sm' | 'lg' }) {
  const colors = {
    BULLISH: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    BEARISH: 'bg-red-500/20 text-red-400 border-red-500/30',
    NEUTRAL: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  }
  const icons = { BULLISH: '🐂', BEARISH: '🐻', NEUTRAL: '⚖️' }
  const sizeClass = size === 'lg' ? 'px-4 py-2 text-lg' : 'px-3 py-1 text-sm'
  return (
    <span className={`rounded-full font-bold border ${colors[signal as keyof typeof colors]} ${sizeClass}`}>
      {icons[signal as keyof typeof icons]} {signal}
    </span>
  )
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-emerald-400' : score >= 60 ? 'bg-emerald-500' : score <= 30 ? 'bg-red-400' : score <= 40 ? 'bg-red-500' : 'bg-yellow-500'
  return (
    <div className="w-full bg-gray-800 rounded-full h-2.5 mt-2">
      <div className={`${color} h-2.5 rounded-full transition-all duration-1000 ease-out`} style={{ width: `${score}%` }} />
    </div>
  )
}

function GaugeChart({ score, label }: { score: number; label: string }) {
  const rotation = (score / 100) * 180 - 90
  const color = score >= 60 ? '#34d399' : score <= 40 ? '#f87171' : '#fbbf24'
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-16 overflow-hidden">
        <div className="absolute w-32 h-32 rounded-full border-8 border-gray-700" style={{ borderTopColor: 'transparent', borderRightColor: 'transparent', transform: 'rotate(0deg)' }} />
        <div className="absolute bottom-0 left-1/2 w-1 h-14 origin-bottom transition-transform duration-1000" style={{ transform: `translateX(-50%) rotate(${rotation}deg)`, background: color }} />
        <div className="absolute bottom-0 left-1/2 w-3 h-3 rounded-full -translate-x-1/2 translate-y-1/2" style={{ background: color }} />
      </div>
      <span className="text-3xl font-bold mt-1" style={{ color }}>{score}</span>
      <span className="text-gray-400 text-sm">{label}</span>
    </div>
  )
}

function MiniChart({ prices }: { prices: number[] }) {
  if (!prices || prices.length < 2) return null
  const reversed = [...prices].reverse()
  const min = Math.min(...reversed)
  const max = Math.max(...reversed)
  const range = max - min || 1
  const width = 120
  const height = 40
  const points = reversed.map((p, i) => {
    const x = (i / (reversed.length - 1)) * width
    const y = height - ((p - min) / range) * height
    return `${x},${y}`
  }).join(' ')
  const isUp = reversed[reversed.length - 1] >= reversed[0]
  return (
    <svg width={width} height={height} className="mt-2">
      <polyline fill="none" stroke={isUp ? '#34d399' : '#f87171'} strokeWidth="1.5" points={points} />
    </svg>
  )
}

type FilterType = 'all' | 'stock' | 'crypto' | 'index'

export default function Home() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [overallSignal, setOverallSignal] = useState<'BULLISH' | 'BEARISH' | 'NEUTRAL'>('NEUTRAL')
  const [overallScore, setOverallScore] = useState(50)
  const [fearGreed, setFearGreed] = useState<FearGreedData | null>(null)
  const [news, setNews] = useState<NewsItem[]>([])
  const [filter, setFilter] = useState<FilterType>('all')
  const [historicalData, setHistoricalData] = useState<Record<string, number[]>>({})
  const [vix, setVix] = useState<number | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const symbols = ASSETS.map(a => a.symbol).join(',')

      // Fetch quotes + historical data in parallel
      const [quoteRes, ...histResponses] = await Promise.all([
        fetch(`https://financialmodelingprep.com/api/v3/quote/${symbols}?apikey=${API_KEY}`),
        ...ASSETS.filter(a => !a.symbol.includes('USD')).map(a =>
          fetch(`https://financialmodelingprep.com/api/v3/historical-price-full/${a.symbol}?timeseries=30&apikey=${API_KEY}`)
            .then(r => r.json())
            .then(d => ({ symbol: a.symbol, prices: (d.historical || []).map((h: HistoricalPrice) => h.close) }))
            .catch(() => ({ symbol: a.symbol, prices: [] }))
        ),
      ])

      const data: MarketData[] = await quoteRes.json()

      // Build historical price map
      const histMap: Record<string, number[]> = {}
      histResponses.forEach((h: { symbol: string; prices: number[] }) => {
        if (h.prices.length > 0) histMap[h.symbol] = h.prices
      })
      setHistoricalData(histMap)

      const analyzed: Asset[] = data.map(d => {
        const config = ASSETS.find(a => a.symbol === d.symbol)
        const prices = histMap[d.symbol]
        const rsi = prices ? calculateRSI(prices) : undefined
        const sma20 = prices ? calculateSMA(prices, 20) : undefined
        const analysis = analyzeAsset(d, prices, rsi, sma20)
        return {
          symbol: d.symbol,
          name: config?.name || d.symbol,
          price: d.price,
          change: d.change,
          changePct: d.changesPercentage,
          volume: d.volume,
          avgVolume: d.avgVolume,
          rsi,
          sma20,
          ...analysis,
        }
      })

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
          setFearGreed({ value: parseInt(fgData.data[0].value), classification: fgData.data[0].value_classification })
        }
      } catch {}

      // VIX
      try {
        const vixRes = await fetch(`https://financialmodelingprep.com/api/v3/quote/%5EVIX?apikey=${API_KEY}`)
        const vixData = await vixRes.json()
        if (vixData?.[0]?.price) setVix(vixData[0].price)
      } catch {}

      // News
      try {
        const newsRes = await fetch(`https://financialmodelingprep.com/api/v3/stock_news?limit=8&apikey=${API_KEY}`)
        const newsData = await newsRes.json()
        setNews(newsData.slice(0, 6))
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

  const filteredAssets = filter === 'all' ? assets : assets.filter(a => {
    const config = ASSETS.find(c => c.symbol === a.symbol)
    return config?.type === filter
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-center">
          <div className="animate-pulse text-6xl mb-4">📊</div>
          <p className="text-gray-400 text-lg">Analyzing markets...</p>
          <p className="text-gray-600 text-sm mt-2">Crunching RSI, SMA, volume & sentiment data</p>
        </div>
      </div>
    )
  }

  const bullCount = assets.filter(a => a.signal === 'BULLISH').length
  const bearCount = assets.filter(a => a.signal === 'BEARISH').length
  const neutralCount = assets.filter(a => a.signal === 'NEUTRAL').length

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-6xl font-black mb-2 bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
          Market Predictor
        </h1>
        <p className="text-gray-400 text-lg">Real-time bullish/bearish signals powered by RSI, SMA, volume & price action</p>
        <p className="text-gray-500 text-sm mt-1">Auto-refreshes every 60s • Last update: {lastUpdate}</p>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {/* Overall Signal */}
        <div className={`col-span-2 rounded-2xl p-6 border ${
          overallSignal === 'BULLISH' ? 'bg-emerald-500/5 border-emerald-500/20' :
          overallSignal === 'BEARISH' ? 'bg-red-500/5 border-red-500/20' :
          'bg-yellow-500/5 border-yellow-500/20'
        }`}>
          <h2 className="text-sm text-gray-400 mb-3 uppercase tracking-wider">Market Sentiment</h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-5xl font-black ${
                  overallSignal === 'BULLISH' ? 'text-emerald-400' :
                  overallSignal === 'BEARISH' ? 'text-red-400' : 'text-yellow-400'
                }`}>{overallScore}</span>
                <SignalBadge signal={overallSignal} size="lg" />
              </div>
              <div className="flex gap-3 text-sm">
                <span className="text-emerald-400">🐂 {bullCount}</span>
                <span className="text-yellow-400">⚖️ {neutralCount}</span>
                <span className="text-red-400">🐻 {bearCount}</span>
              </div>
              <ScoreBar score={overallScore} />
            </div>
            <GaugeChart score={overallScore} label="Score" />
          </div>
        </div>

        {/* Fear & Greed */}
        <div className="rounded-2xl p-5 border bg-[#12121a] border-[#1e1e2e]">
          <h2 className="text-sm text-gray-400 mb-2 uppercase tracking-wider">Fear & Greed</h2>
          {fearGreed ? (
            <div className="text-center">
              <p className={`text-4xl font-black ${
                fearGreed.value >= 60 ? 'text-emerald-400' :
                fearGreed.value <= 40 ? 'text-red-400' : 'text-yellow-400'
              }`}>{fearGreed.value}</p>
              <p className="text-gray-400 text-sm mt-1">{fearGreed.classification}</p>
              <ScoreBar score={fearGreed.value} />
            </div>
          ) : <p className="text-gray-500">Loading...</p>}
        </div>

        {/* VIX */}
        <div className="rounded-2xl p-5 border bg-[#12121a] border-[#1e1e2e]">
          <h2 className="text-sm text-gray-400 mb-2 uppercase tracking-wider">VIX (Fear Index)</h2>
          {vix !== null ? (
            <div className="text-center">
              <p className={`text-4xl font-black ${
                vix < 15 ? 'text-emerald-400' : vix < 25 ? 'text-yellow-400' : 'text-red-400'
              }`}>{vix.toFixed(1)}</p>
              <p className="text-gray-400 text-sm mt-1">
                {vix < 15 ? 'Low volatility' : vix < 20 ? 'Normal' : vix < 25 ? 'Elevated' : vix < 30 ? 'High fear' : 'Extreme fear'}
              </p>
            </div>
          ) : <p className="text-gray-500">Loading...</p>}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'stock', 'crypto', 'index'] as FilterType[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filter === f
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-gray-800/50 text-gray-400 border border-transparent hover:border-gray-600'
            }`}
          >
            {f === 'all' ? '🌍 All' : f === 'stock' ? '📈 Stocks' : f === 'crypto' ? '₿ Crypto' : '📊 Indices'}
          </button>
        ))}
      </div>

      {/* Asset Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {filteredAssets.map(asset => (
          <div key={asset.symbol} className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-5 hover:border-gray-600 transition-all hover:shadow-lg hover:shadow-black/20 group">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold">{asset.symbol}</h3>
                  <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                    {ASSETS.find(a => a.symbol === asset.symbol)?.type}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">{asset.name}</p>
              </div>
              <SignalBadge signal={asset.signal} />
            </div>

            <div className="flex items-baseline gap-3 mb-1">
              <span className="text-2xl font-bold">
                {asset.symbol.includes('USD') ? `$${asset.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}` :
                 `$${asset.price.toFixed(2)}`}
              </span>
              <span className={`text-lg font-semibold ${asset.changePct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {asset.changePct >= 0 ? '▲' : '▼'} {Math.abs(asset.changePct).toFixed(2)}%
              </span>
            </div>

            {/* Mini Chart */}
            {historicalData[asset.symbol] && <MiniChart prices={historicalData[asset.symbol]} />}

            {/* Score */}
            <div className="flex items-center gap-2 mb-1 mt-2">
              <span className="text-sm text-gray-400">Signal Strength:</span>
              <span className={`text-sm font-bold ${
                asset.score >= 60 ? 'text-emerald-400' : asset.score <= 40 ? 'text-red-400' : 'text-yellow-400'
              }`}>{asset.score}/100</span>
            </div>
            <ScoreBar score={asset.score} />

            {/* Technical indicators */}
            <div className="flex gap-3 mt-3 text-xs text-gray-400">
              {asset.rsi !== undefined && (
                <span className={asset.rsi > 70 ? 'text-red-400' : asset.rsi < 30 ? 'text-emerald-400' : ''}>
                  RSI: {asset.rsi.toFixed(0)}
                </span>
              )}
              {asset.volume > 0 && asset.avgVolume > 0 && (
                <span className={asset.volume > asset.avgVolume * 1.5 ? 'text-blue-400' : ''}>
                  Vol: {(asset.volume / asset.avgVolume).toFixed(1)}x avg
                </span>
              )}
            </div>

            {/* Factors */}
            <div className="mt-3 flex flex-wrap gap-1">
              {asset.factors.slice(0, 4).map((f, i) => (
                <span key={i} className="text-xs bg-gray-800/80 text-gray-300 px-2 py-1 rounded-full">{f}</span>
              ))}
              {asset.factors.length > 4 && (
                <span className="text-xs bg-gray-800/80 text-gray-500 px-2 py-1 rounded-full">+{asset.factors.length - 4} more</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Market News */}
      {news.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">📰 Latest Market News</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {news.map((item, i) => (
              <a key={i} href={item.url} target="_blank" rel="noopener noreferrer"
                className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-4 hover:border-gray-600 transition-all block">
                <p className="text-sm font-medium text-gray-200 line-clamp-2 mb-2">{item.title}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">{item.site}</span>
                  <span className="text-xs text-gray-500">{new Date(item.publishedDate).toLocaleDateString()}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center mt-8 text-gray-500 text-sm border-t border-gray-800 pt-6">
        <p className="text-lg mb-1">Built by <span className="text-blue-400 font-bold">Joga Singh</span> ⚔️</p>
        <p>Signals based on RSI, 20-day SMA, volume analysis, price action & 52-week positioning</p>
        <p className="mt-1 text-gray-600">Not financial advice • Data from FMP & Alternative.me</p>
      </div>
    </main>
  )
}
