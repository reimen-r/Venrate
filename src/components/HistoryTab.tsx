import React, { useState, useMemo } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HistoricalDataPoint, ExchangeRate } from '../types';
import { AnimatedNumber } from './AnimatedNumber';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-strong rounded-xl p-3 text-xs shadow-xl space-y-2">
        <p className="font-sans font-bold text-on-surface border-b border-white/[0.06] pb-1">{payload[0].payload.time}</p>
        <div className="space-y-1.5 font-mono">
          {payload.map((item: any) => (
            <div key={item.dataKey} className="flex justify-between gap-4 text-[11px]">
              <span className={`font-bold ${
                item.dataKey === 'bcvUsd' ? 'text-success' : item.dataKey === 'bcvEur' ? 'text-blue-400' : 'text-warning'
              }`}>{item.dataKey === 'bcvUsd' ? 'BCV DÓLAR' : item.dataKey === 'bcvEur' ? 'BCV EURO' : 'P2P USDT'}:</span>
              <span className="text-on-surface font-bold">{item.value.toFixed(2)} Bs.</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

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

interface HistoryTabProps {
  onTriggerToast: (message: string, type: 'success' | 'info' | 'error') => void;
  rates?: ExchangeRate[];
  isEqualizedToBcv?: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 22, mass: 0.6 } },
};

export const HistoryTab = React.memo<HistoryTabProps>(({ onTriggerToast, rates = [], isEqualizedToBcv = false }) => {
  const [activeHistoryCurrency, setActiveHistoryCurrency] = useState<'USD' | 'EUR' | 'USDT'>('USD');
  const [timeframe, setTimeframe] = useState<'24h' | '7d'>('24h');
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'up' | 'down'>('all');

  const usdDb = useMemo(() => {
    const raw = MOCK_USD_HISTORY;
    const liveRate = rates?.find(r => r.id === 'bcvUsd')?.rate || 685.94;
    const ratio = liveRate / raw[0].rate;
    return raw.map(i => ({ ...i, rate: +(i.rate * ratio).toFixed(2), open: +(i.open * ratio).toFixed(2), high: +(i.high * ratio).toFixed(2), low: +(i.low * ratio).toFixed(2), close: +(i.close * ratio).toFixed(2) }));
  }, [rates]);

  const eurDb = useMemo(() => {
    const raw = MOCK_EUR_HISTORY;
    const liveRate = rates?.find(r => r.id === 'bcvEur')?.rate || 783.78;
    const ratio = liveRate / raw[0].rate;
    return raw.map(i => ({ ...i, rate: +(i.rate * ratio).toFixed(2), open: +(i.open * ratio).toFixed(2), high: +(i.high * ratio).toFixed(2), low: +(i.low * ratio).toFixed(2), close: +(i.close * ratio).toFixed(2) }));
  }, [rates]);

  const usdtDb = useMemo(() => {
    const raw = MOCK_USDT_HISTORY;
    let liveRate = rates?.find(r => r.id === 'binanceP2p')?.rate || 817.00;
    if (isEqualizedToBcv) liveRate = rates?.find(r => r.id === 'bcvUsd')?.rate || liveRate;
    const ratio = liveRate / raw[0].rate;
    return raw.map(i => ({ ...i, rate: +(i.rate * ratio).toFixed(2), open: +(i.open * ratio).toFixed(2), high: +(i.high * ratio).toFixed(2), low: +(i.low * ratio).toFixed(2), close: +(i.close * ratio).toFixed(2) }));
  }, [rates, isEqualizedToBcv]);

  const db = useMemo(() => {
    return activeHistoryCurrency === 'EUR' ? eurDb : activeHistoryCurrency === 'USDT' ? usdtDb : usdDb;
  }, [activeHistoryCurrency, usdDb, eurDb, usdtDb]);

  const generate24hData = (currentRate: number, rateId: string) => {
    const points = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 2 * 60 * 60 * 1000);
      const label = `${time.getHours().toString().padStart(2, '0')}:00`;
      const seed = (rateId.charCodeAt(0) + i * 31) % 100;
      const wave = Math.sin(i * 0.5) * 0.15 + (seed / 1000);
      const rateVal = i === 0 ? currentRate : currentRate * (1 - wave * 0.04);
      points.push({ time: label, rate: +rateVal.toFixed(2) });
    }
    return points;
  };

  const chartData = useMemo(() => {
    if (timeframe === '24h') {
      const usd24 = generate24hData(usdDb[0].rate, 'bcvUsd');
      const eur24 = generate24hData(eurDb[0].rate, 'bcvEur');
      const usdt24 = generate24hData(usdtDb[0].rate, 'binanceP2p');
      return usd24.map((pt, idx) => ({ time: pt.time, bcvUsd: pt.rate, bcvEur: eur24[idx]?.rate || pt.rate, binanceP2p: usdt24[idx]?.rate || pt.rate }));
    }
    return usdDb.slice().reverse().map((item, idx) => {
      const ri = usdDb.length - 1 - idx;
      return { time: item.date, bcvUsd: item.rate, bcvEur: eurDb[ri]?.rate || item.rate, binanceP2p: usdtDb[ri]?.rate || item.rate };
    });
  }, [timeframe, usdDb, eurDb, usdtDb]);

  const { minVal, maxVal } = useMemo(() => {
    let min = Infinity, max = -Infinity;
    chartData.forEach(d => {
      [d.bcvUsd, d.bcvEur, d.binanceP2p].filter(v => typeof v === 'number').forEach(v => { if (v < min) min = v; if (v > max) max = v; });
    });
    return { minVal: min === Infinity ? 650 : min, maxVal: max === -Infinity ? 850 : max };
  }, [chartData]);

  const liveBcvUsd = rates?.find(r => r.id === 'bcvUsd')?.rate || 685.94;
  const liveBcvEur = rates?.find(r => r.id === 'bcvEur')?.rate || 783.78;
  const liveBinance = isEqualizedToBcv ? liveBcvUsd : (rates?.find(r => r.id === 'binanceP2p')?.rate || 817.00);

  const filteredDb = db.filter(item => {
    if (filterType === 'up') return item.rate >= item.open;
    if (filterType === 'down') return item.rate < item.open;
    return true;
  });
  const displayedDb = showAllHistory ? filteredDb : filteredDb.slice(0, 3);

  const currencyCards = [
    { id: 'USD' as const, label: 'BCV DÓLAR', symbol: '$', rate: liveBcvUsd, active: activeHistoryCurrency === 'USD', color: 'emerald' },
    { id: 'EUR' as const, label: 'BCV EURO', symbol: '€', rate: liveBcvEur, active: activeHistoryCurrency === 'EUR', color: 'blue' },
    { id: 'USDT' as const, label: 'P2P USDT', icon: Globe, rate: liveBinance, active: activeHistoryCurrency === 'USDT', color: 'amber' },
  ];

  return (
    <motion.div id="history-tab" className="space-y-10" variants={containerVariants} initial="hidden" animate="visible">
      <motion.header className="space-y-2" variants={itemVariants}>
        <p className="font-mono text-[11px] text-primary/70 uppercase tracking-[0.25em] font-semibold">Análisis de Datos</p>
        <h2 className="font-display text-3xl font-bold tracking-tight text-on-surface">Historial de Tasas</h2>
      </motion.header>

      <motion.section variants={itemVariants} className="glass-card rounded-3xl p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  className="w-2 h-2 rounded-full bg-cyan-400" />
              </div>
              <h3 className="font-display text-lg font-bold text-on-surface">Fluctuaciones en Tiempo Real</h3>
            </div>
            <div className="flex bg-white/[0.03] rounded-xl p-1 gap-1 w-fit">
              {(['24h', '7d'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTimeframe(t); onTriggerToast(`Mostrando ${t === '24h' ? '24 horas' : '7 días'}`, 'info'); }}
                  className={`relative px-4 py-1.5 rounded-[10px] text-xs font-semibold transition-colors cursor-pointer ${
                    timeframe === t ? 'text-on-surface' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {timeframe === t && (
                    <motion.div layoutId="time-pill" className="absolute inset-1 rounded-[8px] bg-gradient-to-r from-primary/20 to-secondary/15 border border-primary/15" transition={{ type: 'spring', stiffness: 400, damping: 28 }} />
                  )}
                  <span className="relative z-10">{t === '24h' ? '24 Horas' : '7 Días'}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full h-64 md:h-80 select-none">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="hUsdGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="hEurGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="hUsdtGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.03} />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 10, fontFamily: 'var(--font-mono)' }} />
              <YAxis domain={[Math.floor(minVal - 5), Math.ceil(maxVal + 5)]} axisLine={false} tickLine={false} tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 10, fontFamily: 'var(--font-mono)' }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="bcvEur" stroke="#60a5fa" strokeWidth={2.5} fillOpacity={1} fill="url(#hEurGrad)" animationDuration={800} />
              <Area type="monotone" dataKey="binanceP2p" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#hUsdtGrad)" animationDuration={600} />
              <Area type="monotone" dataKey="bcvUsd" stroke="#34d399" strokeWidth={2.5} fillOpacity={1} fill="url(#hUsdGrad)" animationDuration={1000} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-white/[0.04]">
          {currencyCards.map((card) => {
            const colorMap: Record<string, string> = {
              emerald: 'border-success/30 bg-success/5',
              blue: 'border-blue-500/30 bg-blue-500/5',
              amber: 'border-warning/30 bg-warning/5',
            };
            return (
              <motion.button
                key={card.id}
                onClick={() => setActiveHistoryCurrency(card.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`text-left w-full p-4 rounded-2xl border transition-all duration-300 cursor-pointer relative ${
                  card.active
                    ? `${colorMap[card.color]} shadow-[0_0_20px_-4px_rgba(255,255,255,0.05)]`
                    : 'border-white/[0.04] bg-white/[0.01] opacity-55 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg border ${
                      card.color === 'emerald' ? 'bg-success/10 text-success border-success/20' :
                      card.color === 'blue' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      'bg-warning/10 text-warning border-warning/20'
                    }`}>
                      {card.icon ? <card.icon className="w-4.5 h-4.5" /> : card.symbol}
                    </div>
                    <div>
                      <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">{card.label}</span>
                      <span className="font-sans text-base font-extrabold text-on-surface mt-0.5 block">
                        {card.rate.toFixed(2)} Bs.
                      </span>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-success bg-success/5 px-2 py-1 rounded-lg border border-success/10 text-[10px] font-mono font-bold shrink-0">
                    <ArrowUp className="w-3 h-3" />
                    <span>2.1%</span>
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.section>

      <motion.section variants={itemVariants} className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl font-bold text-on-surface">Desglose Diario</h3>
          <div className="flex bg-white/[0.03] rounded-xl p-1 gap-1">
            {(['all', 'up', 'down'] as const).map(f => (
              <button
                key={f}
                onClick={() => { setFilterType(f); onTriggerToast(`Filtrando: ${f === 'all' ? 'todos' : f === 'up' ? 'alzas' : 'bajas'}`, 'info'); }}
                className={`px-3.5 py-1.5 rounded-[10px] text-[10px] font-mono uppercase font-bold tracking-wider transition-colors cursor-pointer ${
                  filterType === f ? 'bg-primary/15 text-primary/90' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {f === 'all' ? 'Todos' : f === 'up' ? 'Alzas' : 'Bajas'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {displayedDb.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-14 text-slate-600 text-xs">
                No se encontraron registros.
              </motion.div>
            ) : (
              displayedDb.map((item, idx) => {
                const dailyChange = item.rate - item.open;
                const isDailyUp = dailyChange >= 0;
                const isToday = item.date === 'Hoy';
                return (
                  <motion.div
                    key={item.date + activeHistoryCurrency}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                    whileHover={{ scale: 1.005 }}
                    className="glass-card rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-6"
                  >
                    <div className="flex items-center gap-5">
                      <div className={`p-3 rounded-xl flex flex-col items-center justify-center min-w-[70px] border ${
                        isToday ? 'bg-primary/10 border-primary/20' : 'bg-white/[0.02] border-white/[0.04]'
                      }`}>
                        <span className="font-mono text-[9px] uppercase tracking-wider font-semibold text-slate-500">
                          {isToday ? 'HOY' : item.date.split(' ')[1]}
                        </span>
                        <span className="font-sans text-2xl font-bold text-on-surface">
                          {isToday ? new Date().getDate() : item.date.split(' ')[0]}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <AnimatedNumber value={item.rate} className="font-display text-2xl font-extrabold text-on-surface" />
                          <span className={`px-2.5 py-0.5 rounded-full flex items-center gap-0.5 border text-[10px] font-mono font-bold ${
                            isDailyUp ? 'text-success bg-success/10 border-success/20' : 'text-tertiary bg-tertiary/10 border-tertiary/20'
                          }`}>
                            {isDailyUp ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                            {Math.abs(dailyChange).toFixed(2)}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-1">
                          VES / {activeHistoryCurrency} · {activeHistoryCurrency === 'EUR' ? 'Banco Central de Venezuela' : activeHistoryCurrency === 'USDT' ? 'Binance P2P' : 'Banco Central de Venezuela'}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 flex-1 md:max-w-md bg-white/[0.02] md:bg-transparent p-4 md:p-0 rounded-xl">
                      {(['open', 'high', 'low', 'close'] as const).map(label => (
                        <div key={label} className="flex flex-col">
                          <span className="text-slate-600 text-[9px] uppercase tracking-wider font-mono">{label}</span>
                          <span className={`font-mono text-xs font-medium mt-0.5 ${
                            label === 'high' ? 'text-success' : label === 'low' ? 'text-tertiary' : 'text-on-surface'
                          }`}>{(item as any)[label].toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        {filteredDb.length > 3 && (
          <motion.button
            whileHover={{ scale: 1.005 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => { setShowAllHistory(p => !p); onTriggerToast(showAllHistory ? 'Vista resumida' : 'Mostrando historial completo', 'info'); }}
            className="w-full py-4 glass-card rounded-2xl text-primary font-sans text-sm font-bold hover:bg-primary/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{showAllHistory ? 'Ver Menos' : 'Ver Historial de 7 Días'}</span>
            <motion.span animate={{ rotate: showAllHistory ? 180 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
              <ChevronDown className="w-4 h-4" />
            </motion.span>
          </motion.button>
        )}
      </motion.section>
    </motion.div>
  );
});
