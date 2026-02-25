// Technical indicator calculations

export function sma(data: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { result.push(NaN); continue; }
    const slice = data.slice(i - period + 1, i + 1);
    result.push(slice.reduce((a, b) => a + b, 0) / period);
  }
  return result;
}

export function ema(data: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const result: number[] = [data[0]];
  for (let i = 1; i < data.length; i++) {
    result.push(data[i] * k + result[i - 1] * (1 - k));
  }
  return result;
}

export function rsi(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff; else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function macd(closes: number[]): { macd: number; signal: number; histogram: number } {
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = ema(macdLine, 9);
  const last = macdLine.length - 1;
  return {
    macd: macdLine[last],
    signal: signalLine[last],
    histogram: macdLine[last] - signalLine[last],
  };
}

export function bollingerBands(closes: number[], period = 20, stdDev = 2) {
  const smaVals = sma(closes, period);
  const last = closes.length - 1;
  const mean = smaVals[last];
  if (isNaN(mean)) return { upper: 0, middle: 0, lower: 0 };
  const slice = closes.slice(last - period + 1, last + 1);
  const variance = slice.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / period;
  const sd = Math.sqrt(variance);
  return { upper: mean + stdDev * sd, middle: mean, lower: mean - stdDev * sd };
}

export function emaCrossover(closes: number[]): 'bullish' | 'bearish' | 'neutral' {
  if (closes.length < 50) return 'neutral';
  const ema9 = ema(closes, 9);
  const ema21 = ema(closes, 21);
  const last = ema9.length - 1;
  const prev = last - 1;
  if (ema9[last] > ema21[last] && ema9[prev] <= ema21[prev]) return 'bullish';
  if (ema9[last] < ema21[last] && ema9[prev] >= ema21[prev]) return 'bearish';
  return ema9[last] > ema21[last] ? 'bullish' : 'bearish';
}

export type Signal = 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';

export function overallSignal(rsiVal: number, macdHist: number, crossover: string): Signal {
  let score = 0;
  if (rsiVal < 30) score += 2; else if (rsiVal < 45) score += 1;
  else if (rsiVal > 70) score -= 2; else if (rsiVal > 55) score -= 1;
  if (macdHist > 0) score += 1; else score -= 1;
  if (crossover === 'bullish') score += 1; else if (crossover === 'bearish') score -= 1;
  if (score >= 3) return 'strong_buy';
  if (score >= 1) return 'buy';
  if (score <= -3) return 'strong_sell';
  if (score <= -1) return 'sell';
  return 'neutral';
}
