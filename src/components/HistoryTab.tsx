import React, { useState, useMemo } from 'react';
import { ArrowDown, ArrowUp, Calendar, Filter, ChevronDown, ListFilter, Activity, Scale, AlertCircle, Globe } from 'lucide-react';
import { HistoricalDataPoint, ExchangeRate } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

// Custom Tooltip for Recharts inside HistoryTab
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-container-high/95 dark:bg-background/95 border border-primary/20 backdrop-blur-md rounded-xl p-3 text-xs shadow-xl space-y-2">
        <p className="font-sans font-bold text-on-surface dark:text-white border-b border-on-surface/10 pb-1">
          Fecha/Hora: {payload[0].payload.time}
        </p>
        <div className="space-y-1.5 font-mono">
          {payload.map((item: any) => {
            let label = '';
            let color = '';
            if (item.dataKey === 'bcvUsd') {
              label = 'BCV DÓLAR';
              color = 'text-teal-400';
            } else if (item.dataKey === 'bcvEur') {
              label = 'BCV EURO';
              color = 'text-blue-400';
            } else if (item.dataKey === 'binanceP2p') {
              label = 'P2P USDT';
              color = 'text-amber-400';
            }
            return (
              <div key={item.dataKey} className="flex justify-between gap-4">
                <span className={`${color} font-bold`}>{label}:</span>
                <span className="text-on-surface dark:text-white font-bold">{item.value.toFixed(2)} Bs.</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

interface HistoryTabProps {
  onTriggerToast: (message: string, type: 'success' | 'info' | 'error') => void;
  rates?: ExchangeRate[];
  isEqualizedToBcv?: boolean;
}

// Generate premium mock history databases for each currency
const MOCK_USD_HISTORY: HistoricalDataPoint[] = [
  { date: 'Hoy', rate: 782.50, open: 778.00, high: 785.00, low: 776.50, close: 782.50 },
  { date: 'Ayer', rate: 778.00, open: 779.50, high: 781.00, low: 775.00, close: 778.00 },
  { date: '25 Oct', rate: 779.50, open: 774.10, high: 782.00, low: 773.00, close: 779.50 },
  { date: '24 Oct', rate: 774.10, open: 775.30, high: 778.00, low: 772.00, close: 774.10 },
  { date: '23 Oct', rate: 775.30, open: 770.80, high: 779.00, low: 768.50, close: 775.30 },
  { date: '22 Oct', rate: 770.80, open: 768.00, high: 773.00, low: 766.00, close: 770.80 },
  { date: '21 Oct', rate: 768.00, open: 765.50, high: 771.00, low: 764.00, close: 768.00 },
];

const MOCK_EUR_HISTORY: HistoricalDataPoint[] = [
  { date: 'Hoy', rate: 770.68, open: 768.50, high: 772.00, low: 767.00, close: 770.68 },
  { date: 'Ayer', rate: 768.50, open: 769.30, high: 770.00, low: 766.50, close: 768.50 },
  { date: '25 Oct', rate: 769.30, open: 765.80, high: 770.50, low: 764.00, close: 769.30 },
  { date: '24 Oct', rate: 765.80, open: 766.40, high: 767.50, low: 764.10, close: 765.80 },
  { date: '23 Oct', rate: 766.40, open: 762.50, high: 767.80, low: 761.20, close: 766.40 },
  { date: '22 Oct', rate: 762.50, open: 760.10, high: 764.30, low: 759.50, close: 762.50 },
  { date: '21 Oct', rate: 760.10, open: 758.20, high: 761.90, low: 757.00, close: 760.10 },
];

const MOCK_USDT_HISTORY: HistoricalDataPoint[] = [
  { date: 'Hoy', rate: 776.00, open: 778.00, high: 780.00, low: 774.50, close: 776.00 },
  { date: 'Ayer', rate: 778.00, open: 773.50, high: 779.20, low: 772.00, close: 778.00 },
  { date: '25 Oct', rate: 773.50, open: 774.80, high: 776.00, low: 771.50, close: 773.50 },
  { date: '24 Oct', rate: 774.80, open: 770.90, high: 776.50, low: 770.00, close: 774.80 },
  { date: '23 Oct', rate: 770.90, open: 771.60, high: 773.50, low: 769.20, close: 770.90 },
  { date: '22 Oct', rate: 771.60, open: 768.50, high: 772.90, low: 767.00, close: 771.60 },
  { date: '21 Oct', rate: 768.50, open: 765.90, high: 770.20, low: 764.10, close: 768.50 },
];

export const HistoryTab = React.memo<HistoryTabProps>(({ 
  onTriggerToast,
  rates = [],
  isEqualizedToBcv = false
}) => {
  const [activeHistoryCurrency, setActiveHistoryCurrency] = useState<'USD' | 'EUR' | 'USDT'>('USD');
  const [showAllHistory, setShowAllHistory] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<'all' | 'up' | 'down'>('all');

  // Dynamically scale MOCK_USD_HISTORY to match bcvUsd live rate
  const usdDb = useMemo(() => {
    const rawDb = MOCK_USD_HISTORY;
    const liveRate = rates?.find(r => r.id === 'bcvUsd')?.rate || 43.39;
    const ratio = liveRate / rawDb[0].rate;
    return rawDb.map(item => ({
      ...item,
      rate: parseFloat((item.rate * ratio).toFixed(2)),
      open: parseFloat((item.open * ratio).toFixed(2)),
      high: parseFloat((item.high * ratio).toFixed(2)),
      low: parseFloat((item.low * ratio).toFixed(2)),
      close: parseFloat((item.close * ratio).toFixed(2)),
    }));
  }, [rates]);

  // Dynamically scale MOCK_EUR_HISTORY to match bcvEur live rate
  const eurDb = useMemo(() => {
    const rawDb = MOCK_EUR_HISTORY;
    const liveRate = rates?.find(r => r.id === 'bcvEur')?.rate || 47.15;
    const ratio = liveRate / rawDb[0].rate;
    return rawDb.map(item => ({
      ...item,
      rate: parseFloat((item.rate * ratio).toFixed(2)),
      open: parseFloat((item.open * ratio).toFixed(2)),
      high: parseFloat((item.high * ratio).toFixed(2)),
      low: parseFloat((item.low * ratio).toFixed(2)),
      close: parseFloat((item.close * ratio).toFixed(2)),
    }));
  }, [rates]);

  // Dynamically scale MOCK_USDT_HISTORY to match binanceP2p live rate
  const usdtDb = useMemo(() => {
    const rawDb = MOCK_USDT_HISTORY;
    const binanceRateObj = rates?.find(r => r.id === 'binanceP2p');
    let liveRate = binanceRateObj?.rate || 44.72;
    if (isEqualizedToBcv) {
      liveRate = rates?.find(r => r.id === 'bcvUsd')?.rate || liveRate;
    }
    const ratio = liveRate / rawDb[0].rate;
    return rawDb.map(item => ({
      ...item,
      rate: parseFloat((item.rate * ratio).toFixed(2)),
      open: parseFloat((item.open * ratio).toFixed(2)),
      high: parseFloat((item.high * ratio).toFixed(2)),
      low: parseFloat((item.low * ratio).toFixed(2)),
      close: parseFloat((item.close * ratio).toFixed(2)),
    }));
  }, [rates, isEqualizedToBcv]);

  // Select the active log database for breakdown list below the chart
  const db = useMemo(() => {
    switch (activeHistoryCurrency) {
      case 'EUR': return eurDb;
      case 'USDT': return usdtDb;
      case 'USD':
      default:
        return usdDb;
    }
  }, [activeHistoryCurrency, usdDb, eurDb, usdtDb]);

  const currentRate = db[0].rate;
  const previousRate = db[1].rate;
  const changePercentage = ((currentRate - previousRate) / previousRate) * 100;
  const isUp = changePercentage >= 0;

  // Filter history items
  const filteredDb = db.filter(item => {
    if (filterType === 'up') return item.rate >= item.open;
    if (filterType === 'down') return item.rate < item.open;
    return true;
  });

  const displayedDb = showAllHistory ? filteredDb : filteredDb.slice(0, 3);

  const [timeframe, setTimeframe] = useState<'24h' | '7d'>('24h');

  // Helper function to dynamically generate 24h trend data based on current live rate
  const generate24hData = (currentRate: number, rateId: string) => {
    const points = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 2 * 60 * 60 * 1000);
      const hours = time.getHours().toString().padStart(2, '0');
      const label = `${hours}:00`;
      
      // Create a predictable wave fluctuation based on index and rateId hash
      const seed = (rateId.charCodeAt(0) + i * 31) % 100;
      const wave = Math.sin(i * 0.5) * 0.15 + (seed / 1000);
      
      // Last point matches currentRate exactly
      const rateVal = i === 0 ? currentRate : currentRate * (1 - wave * 0.04);
      
      points.push({
        time: label,
        rate: parseFloat(rateVal.toFixed(2)),
      });
    }
    return points;
  };

  const chartData = useMemo(() => {
    if (timeframe === '24h') {
      const usd24 = generate24hData(usdDb[0].rate, 'bcvUsd');
      const eur24 = generate24hData(eurDb[0].rate, 'bcvEur');
      const usdt24 = generate24hData(usdtDb[0].rate, 'binanceP2p');

      return usd24.map((pt, idx) => ({
        time: pt.time,
        bcvUsd: pt.rate,
        bcvEur: eur24[idx]?.rate || pt.rate,
        binanceP2p: usdt24[idx]?.rate || pt.rate,
      }));
    } else {
      return usdDb.slice().reverse().map((item, idx) => {
        const reverseIdx = usdDb.length - 1 - idx;
        return {
          time: item.date,
          bcvUsd: item.rate,
          bcvEur: eurDb[reverseIdx]?.rate || item.rate,
          binanceP2p: usdtDb[reverseIdx]?.rate || item.rate,
        };
      });
    }
  }, [timeframe, usdDb, eurDb, usdtDb]);

  const { minVal, maxVal } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    chartData.forEach(d => {
      const vals = [d.bcvUsd, d.bcvEur, d.binanceP2p].filter(v => typeof v === 'number');
      if (vals.length > 0) {
        min = Math.min(min, ...vals);
        max = Math.max(max, ...vals);
      }
    });
    if (min === Infinity) return { minVal: 35, maxVal: 50 };
    return { minVal: min, maxVal: max };
  }, [chartData]);

  const stats = useMemo(() => {
    const activeKey = activeHistoryCurrency === 'USD' 
      ? 'bcvUsd' 
      : activeHistoryCurrency === 'EUR' 
        ? 'bcvEur' 
        : 'binanceP2p';

    const ratesList = chartData.map(d => (d as any)[activeKey] || 0);
    const max = Math.max(...ratesList);
    const min = Math.min(...ratesList);
    const avg = ratesList.reduce((sum, r) => sum + r, 0) / (ratesList.length || 1);
    return { max, min, avg };
  }, [chartData, activeHistoryCurrency]);

  const handleCurrencyTabChange = (currency: 'USD' | 'EUR' | 'USDT') => {
    setActiveHistoryCurrency(currency);
  };

  const handleToggleShowAll = () => {
    setShowAllHistory(prev => !prev);
    onTriggerToast(showAllHistory ? 'Vista resumida' : 'Mostrando historial completo de 7 días', 'info');
  };

  const liveBcvUsd = rates?.find(r => r.id === 'bcvUsd')?.rate || 43.39;
  const liveBcvEur = rates?.find(r => r.id === 'bcvEur')?.rate || 47.15;
  const liveBinance = isEqualizedToBcv 
    ? liveBcvUsd 
    : (rates?.find(r => r.id === 'binanceP2p')?.rate || 44.72);

  const { cardUsdChange, cardEurChange, cardUsdtChange } = useMemo(() => {
    if (timeframe === '24h') {
      const usdPt = generate24hData(usdDb[0].rate, 'bcvUsd');
      const eurPt = generate24hData(eurDb[0].rate, 'bcvEur');
      const usdtPt = generate24hData(usdtDb[0].rate, 'binanceP2p');

      const uChange = ((usdPt[usdPt.length - 1].rate - usdPt[0].rate) / usdPt[0].rate) * 100;
      const eChange = ((eurPt[eurPt.length - 1].rate - eurPt[0].rate) / eurPt[0].rate) * 100;
      const tChange = ((usdtPt[usdtPt.length - 1].rate - usdtPt[0].rate) / usdtPt[0].rate) * 100;

      return { cardUsdChange: uChange, cardEurChange: eChange, cardUsdtChange: tChange };
    } else {
      const uChange = ((usdDb[0].rate - usdDb[usdDb.length - 1].rate) / usdDb[usdDb.length - 1].rate) * 100;
      const eChange = ((eurDb[0].rate - eurDb[eurDb.length - 1].rate) / eurDb[eurDb.length - 1].rate) * 100;
      const tChange = ((usdtDb[0].rate - usdtDb[usdtDb.length - 1].rate) / usdtDb[usdtDb.length - 1].rate) * 100;

      return { cardUsdChange: uChange, cardEurChange: eChange, cardUsdtChange: tChange };
    }
  }, [timeframe, usdDb, eurDb, usdtDb]);

  return (
    <div id="history-tab" className="space-y-10 animate-fade-in">
      {isEqualizedToBcv && (activeHistoryCurrency === 'USD' || activeHistoryCurrency === 'USDT') && (
        <div id="history-equalized-banner" className="bg-primary/10 border border-primary/20 rounded-2xl p-5 flex gap-4 text-primary animate-fade-in">
          <Scale className="w-5 h-5 shrink-0 mt-0.5 text-secondary" />
          <div className="space-y-1">
            <h4 className="font-sans text-sm font-bold text-on-surface dark:text-white">
              Sincronización BCV Activa
            </h4>
            <p className="font-sans text-xs text-on-surface-variant/80 leading-relaxed">
              El historial de esta sección ha sido ajustado automáticamente para reflejar la tasa oficial del Banco Central de Venezuela, de acuerdo con la opción activa en la configuración del Dashboard.
            </p>
          </div>
        </div>
      )}

      {/* Trend Section Header */}
      <section id="trend-chart-panel" className="fluid-card p-6 md:p-8 rounded-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              <h3 className="font-sans text-lg font-bold text-on-surface dark:text-white">
                Fluctuaciones de las tasas del BCV y Binance P2P
              </h3>
            </div>
            
            {/* Timeframe Toggle Buttons */}
            <div className="flex items-center gap-1.5 bg-on-surface/5 p-1 rounded-xl w-fit">
              <button
                onClick={() => {
                  setTimeframe('24h');
                  onTriggerToast('Mostrando tendencia de 24 horas', 'info');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  timeframe === '24h'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                24 Horas
              </button>
              <button
                onClick={() => {
                  setTimeframe('7d');
                  onTriggerToast('Mostrando rendimiento de 7 días', 'info');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  timeframe === '7d'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                7 Días
              </button>
            </div>
          </div>

          {/* Quick stats cards for currently selected table currency */}
          <div className="grid grid-cols-3 gap-3 md:gap-4 shrink-0">
            <div className="bg-on-surface/5 dark:bg-white/[0.02] border border-on-surface/5 rounded-xl px-3 py-2 text-center min-w-[70px] md:min-w-[90px]">
              <span className="block font-mono text-[9px] uppercase tracking-wider text-outline font-semibold">Mínimo ({activeHistoryCurrency})</span>
              <span className="font-mono text-xs md:text-sm font-bold text-on-surface dark:text-white mt-0.5 block">
                {stats.min.toFixed(2)}
              </span>
            </div>
            <div className="bg-secondary/5 border border-secondary/10 rounded-xl px-3 py-2 text-center min-w-[70px] md:min-w-[90px]">
              <span className="block font-mono text-[9px] uppercase tracking-wider text-secondary font-semibold">Máximo ({activeHistoryCurrency})</span>
              <span className="font-mono text-xs md:text-sm font-bold text-secondary mt-0.5 block">
                {stats.max.toFixed(2)}
              </span>
            </div>
            <div className="bg-primary/5 border border-primary/10 rounded-xl px-3 py-2 text-center min-w-[70px] md:min-w-[90px]">
              <span className="block font-mono text-[9px] uppercase tracking-wider text-primary font-semibold">Promedio ({activeHistoryCurrency})</span>
              <span className="font-mono text-xs md:text-sm font-bold text-primary mt-0.5 block">
                {stats.avg.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Recharts Area Chart Wrapper */}
        <div className="w-full h-64 md:h-80 select-none relative">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="usdChartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.20} />
                  <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.00} />
                </linearGradient>
                <linearGradient id="eurChartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.20} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.00} />
                </linearGradient>
                <linearGradient id="usdtChartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.20} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.00} />
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                vertical={false} 
                stroke="var(--color-on-surface)" 
                opacity={0.05} 
              />
              <XAxis 
                dataKey="time" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 10, fontFamily: 'var(--font-mono)' }} 
              />
              <YAxis 
                domain={[Math.floor(minVal - 1), Math.ceil(maxVal + 1)]}
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 10, fontFamily: 'var(--font-mono)' }} 
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="bcvEur" 
                stroke="#3b82f6" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#eurChartGradient)" 
              />
              <Area 
                type="monotone" 
                dataKey="binanceP2p" 
                stroke="#f59e0b" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#usdtChartGradient)" 
              />
              <Area 
                type="monotone" 
                dataKey="bcvUsd" 
                stroke="#14b8a6" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#usdChartGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Dynamic, High-Fidelity Currency Cards under the Chart (as in the requested image) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-on-surface/5">
          {/* Card 1: BCV DÓLAR */}
          <button
            onClick={() => handleCurrencyTabChange('USD')}
            className={`text-left w-full p-5 rounded-2xl border transition-all duration-300 cursor-pointer ${
              activeHistoryCurrency === 'USD'
                ? 'border-teal-500/40 bg-teal-500/5 shadow-[0_0_20px_-3px_rgba(20,184,166,0.15)] ring-1 ring-teal-500/30 scale-[1.02]'
                : 'border-teal-500/10 bg-surface-container-low/40 opacity-60 hover:opacity-100 hover:border-teal-500/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold text-xl border border-teal-500/20">
                  $
                </div>
                <div>
                  <span className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant/70 font-bold">BCV DÓLAR</span>
                  <span className="font-sans text-lg font-extrabold text-on-surface dark:text-white mt-0.5 block">
                    {liveBcvUsd.toFixed(2)} Bs.
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-rose-400 bg-rose-500/5 px-2.5 py-1 rounded-lg border border-rose-500/10 text-xs font-mono font-bold shrink-0">
                <ArrowUp className="w-3.5 h-3.5 stroke-[2.5px]" />
                <span>+{Math.abs(cardUsdChange).toFixed(1)}%</span>
              </div>
            </div>
          </button>

          {/* Card 2: BCV EURO */}
          <button
            onClick={() => handleCurrencyTabChange('EUR')}
            className={`text-left w-full p-5 rounded-2xl border transition-all duration-300 cursor-pointer ${
              activeHistoryCurrency === 'EUR'
                ? 'border-blue-500/40 bg-blue-500/5 shadow-[0_0_20px_-3px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/30 scale-[1.02]'
                : 'border-blue-500/10 bg-surface-container-low/40 opacity-60 hover:opacity-100 hover:border-blue-500/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xl border border-blue-500/20">
                  €
                </div>
                <div>
                  <span className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant/70 font-bold">BCV EURO</span>
                  <span className="font-sans text-lg font-extrabold text-on-surface dark:text-white mt-0.5 block">
                    {liveBcvEur.toFixed(2)} Bs.
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-rose-400 bg-rose-500/5 px-2.5 py-1 rounded-lg border border-rose-500/10 text-xs font-mono font-bold shrink-0">
                <ArrowUp className="w-3.5 h-3.5 stroke-[2.5px]" />
                <span>+{Math.abs(cardEurChange).toFixed(1)}%</span>
              </div>
            </div>
          </button>

          {/* Card 3: P2P USDT */}
          <button
            onClick={() => handleCurrencyTabChange('USDT')}
            className={`text-left w-full p-5 rounded-2xl border transition-all duration-300 cursor-pointer ${
              activeHistoryCurrency === 'USDT'
                ? 'border-amber-500/40 bg-amber-500/5 shadow-[0_0_20px_-3px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/30 scale-[1.02]'
                : 'border-amber-500/10 bg-surface-container-low/40 opacity-60 hover:opacity-100 hover:border-amber-500/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xl border border-amber-500/20">
                  <Globe className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <span className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant/70 font-bold">P2P USDT</span>
                  <span className="font-sans text-lg font-extrabold text-on-surface dark:text-white mt-0.5 block">
                    {liveBinance.toFixed(2)} Bs.
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-rose-400 bg-rose-500/5 px-2.5 py-1 rounded-lg border border-rose-500/10 text-xs font-mono font-bold shrink-0">
                <ArrowUp className="w-3.5 h-3.5 stroke-[2.5px]" />
                <span>+{Math.abs(cardUsdtChange).toFixed(1)}%</span>
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* Daily Breakdown List */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-sans text-xl font-bold text-on-surface dark:text-white">
            Daily Breakdown
          </h3>
          
          <div className="flex gap-2">
            {(['all', 'up', 'down'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setFilterType(filter);
                  onTriggerToast(`Filtrando registros: ${filter === 'all' ? 'todos' : filter === 'up' ? 'alzas' : 'bajas'}`, 'info');
                }}
                className={`px-3 py-1.5 rounded-full font-mono text-[10px] uppercase font-bold tracking-wider transition-colors cursor-pointer ${
                  filterType === filter 
                    ? 'bg-primary text-on-primary' 
                    : 'bg-on-surface/5 text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {filter === 'all' ? 'Todos' : filter === 'up' ? 'Alzas' : 'Bajas'}
              </button>
            ))}
          </div>
        </div>

        {/* List of items */}
        <div className="space-y-4">
          {displayedDb.length === 0 ? (
            <div className="text-center py-10 text-on-surface-variant/60 text-xs">
              No se encontraron registros de cambio.
            </div>
          ) : (
            displayedDb.map((item, idx) => {
              const dailyChange = item.rate - item.open;
              const isDailyUp = dailyChange >= 0;
              const isToday = item.date === 'Hoy';

              return (
                <div 
                  key={idx}
                  className="fluid-card rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-300 hover:scale-[1.01]"
                >
                  {/* Left Block: Date & Rate Indicator */}
                  <div className="flex items-center gap-5">
                    {/* Date Block */}
                    <div className={`p-3 rounded-xl flex flex-col items-center justify-center min-w-[70px] border ${
                      isToday 
                        ? 'bg-primary/10 border-primary/20 text-primary' 
                        : 'bg-surface-container-high/30 border-on-surface/5 text-on-surface-variant'
                    }`}>
                      <span className="font-mono text-[9px] uppercase tracking-wider font-semibold">
                        {isToday ? 'Today' : item.date.split(' ')[1]}
                      </span>
                      <span className="font-sans text-2xl font-bold">
                        {isToday ? '27' : item.date.split(' ')[0]}
                      </span>
                    </div>

                    {/* Rate & Fluctuations badge */}
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-sans text-2xl text-on-surface dark:text-white font-extrabold tracking-tight">
                          {item.rate.toFixed(2)}
                        </span>
                        
                        <div className={`px-2.5 py-0.5 rounded-full flex items-center gap-0.5 border ${
                          isDailyUp 
                            ? 'bg-secondary/10 border-secondary/10 text-secondary' 
                            : 'bg-error/10 border-error/10 text-error'
                        }`}>
                          {isDailyUp ? (
                            <ArrowUp className="w-3 h-3 stroke-[2.5px]" />
                          ) : (
                            <ArrowDown className="w-3 h-3 stroke-[2.5px]" />
                          )}
                          <span className="font-mono text-[11px] font-bold">
                            {Math.abs(dailyChange).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <p className="text-on-surface-variant font-sans text-xs mt-1 opacity-75">
                        {isEqualizedToBcv && activeHistoryCurrency === 'USDT'
                          ? `VES / ${activeHistoryCurrency} (Igualado al BCV)`
                          : activeHistoryCurrency === 'EUR'
                            ? 'VES / EUR (Banco Central de Venezuela)'
                            : activeHistoryCurrency === 'USDT'
                              ? 'VES / USDT (Binance P2P)'
                              : 'VES / USD (Banco Central de Venezuela)'}
                      </p>
                    </div>
                  </div>

                  {/* Right Block: Open / High / Low / Close Metrics Grid */}
                  <div className="grid grid-cols-4 gap-2 md:gap-6 flex-1 md:max-w-md bg-on-surface/5 md:bg-transparent p-4 md:p-0 rounded-xl">
                    <div className="flex flex-col">
                      <span className="text-outline text-[9px] uppercase tracking-wider font-mono">Open</span>
                      <span className="font-mono text-sm text-on-surface dark:text-white font-medium mt-0.5">{item.open.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-outline text-[9px] uppercase tracking-wider font-mono">High</span>
                      <span className="font-mono text-sm text-secondary font-semibold mt-0.5">{item.high.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-outline text-[9px] uppercase tracking-wider font-mono">Low</span>
                      <span className="font-mono text-sm text-on-surface dark:text-white font-medium mt-0.5">{item.low.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-outline text-[9px] uppercase tracking-wider font-mono">Close</span>
                      <span className="font-mono text-sm text-on-surface dark:text-white font-medium mt-0.5">{item.close.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Load More Button */}
        {filteredDb.length > 3 && (
          <button 
            id="btn-toggle-show-all-history"
            onClick={handleToggleShowAll}
            className="w-full mt-4 py-4 fluid-card rounded-xl text-primary font-sans text-sm font-bold hover:bg-primary/10 transition-all flex items-center justify-center gap-2 cursor-pointer group"
          >
            <span>{showAllHistory ? 'Ver Menos Alertas' : 'Ver Historial de 7 Días'}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showAllHistory ? 'rotate-180' : ''}`} />
          </button>
        )}
      </section>
    </div>
  );
});
