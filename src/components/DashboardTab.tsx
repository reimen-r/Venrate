import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ArrowUpDown, Calculator, TrendingDown, TrendingUp, AlertCircle, Share2, Activity, Scale, ImageIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toPng } from 'html-to-image';
import { ExchangeRate } from '../types';
import { AnimatedNumber } from './AnimatedNumber';
import { SkeletonCard, SkeletonListRow } from './SkeletonCard';
import { SPREAD_HEALTHY_THRESHOLD, SPREAD_MODERATE_THRESHOLD, SPREAD_MAX_SCALE } from '../constants';
import { ShareableConversionCard } from './ShareableConversionCard';
import { CurrencySelect } from './CurrencySelect';

export const CALCULATOR_CURRENCIES = [
  { id: 'VES', name: 'Bolívares (VES)', code: 'VES', getRate: () => 1 },
  { id: 'USD_B', name: 'USD BCV (Oficial)', code: 'USD', getRate: (ratesList: ExchangeRate[]) => ratesList.find(r => r.id === 'bcvUsd')?.rate || 685.94 },
  { id: 'EUR', name: 'Euro (EUR)', code: 'EUR', getRate: (ratesList: ExchangeRate[]) => ratesList.find(r => r.id === 'bcvEur')?.rate || 783.78 },
  { id: 'USDT', name: 'USDT Binance', code: 'USDT', getRate: (ratesList: ExchangeRate[]) => ratesList.find(r => r.id === 'binanceP2p')?.rate || 817.00 },
];

const formatEsVe = (value: number): string => {
  if (value === 0) return '';
  return value.toLocaleString('es-VE', { maximumFractionDigits: 4 });
};

const parseEsVe = (v: string): number => {
  const cleaned = v.replace(/[^0-9,]/g, '').replace(/\./g, '');
  const normalized = cleaned.replace(',', '.');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
};

interface DashboardTabProps {
  rates: ExchangeRate[];
  onTriggerToast: (message: string, type: 'success' | 'info' | 'error') => void;
  onNavigateToAlerts: () => void;
  isFetching: boolean;
  onRefresh: () => void;
  lastFetched: Date | null;
  isEqualizedToBcv?: boolean;
  isInitialLoading?: boolean;
  isOffline?: boolean;
  widgetRateIds: string[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 200, damping: 22, mass: 0.6 },
  },
};

const cardHover = {
  rest: { scale: 1, y: 0 },
  hover: { scale: 1.02, y: -2, transition: { type: 'spring', stiffness: 300, damping: 20 } },
  tap: { scale: 0.98 },
};

export const DashboardTab = React.memo<DashboardTabProps>(({
  rates,
  onTriggerToast,
  onNavigateToAlerts,
  isFetching,
  onRefresh,
  lastFetched,
  isEqualizedToBcv = false,
  isInitialLoading = false,
  isOffline = false,
  widgetRateIds,
}) => {
  const [fromCurrency, setFromCurrency] = useState<string>('USD_B');
  const [toCurrency, setToCurrency] = useState<string>('VES');
  const [calcAmount, setCalcAmount] = useState<number>(1);
  const [rightPanelTab, setRightPanelTab] = useState<'spread' | 'forecast'>('spread');
  const [swapped, setSwapped] = useState(false);
  const [shareNote, setShareNote] = useState<string>('');
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [fromDraft, setFromDraft] = useState<string>('');
  const [fromDraftFocused, setFromDraftFocused] = useState<boolean>(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  const fromObj = CALCULATOR_CURRENCIES.find(c => c.id === fromCurrency) || CALCULATOR_CURRENCIES[1];
  const toObj = CALCULATOR_CURRENCIES.find(c => c.id === toCurrency) || CALCULATOR_CURRENCIES[0];
  const fromRate = fromObj.getRate(rates);
  const toRate = toObj.getRate(rates);
  const convertedAmount = toRate !== 0 ? (calcAmount * fromRate) / toRate : 0;

  const handleSwapCurrencies = () => {
    setSwapped(p => !p);
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    onTriggerToast('Dirección de conversión intercambiada', 'info');
  };

  const bcvRate = rates.find(r => r.id === 'bcvUsd')?.rate || 685.94;
  const binRate = rates.find(r => r.id === 'binanceP2p')?.rate || 817.00;
  const gapBcvBinance = bcvRate > 0 ? ((binRate - bcvRate) / bcvRate) * 100 : 0;
  const diffBcvBinance = binRate - bcvRate;
  const activeGapPct = gapBcvBinance;
  const activeGapDiff = diffBcvBinance;

  const getSpreadLevel = (spreadPct: number) => {
    const absSpread = Math.abs(spreadPct);
    if (absSpread === 0) return { label: 'Sin Brecha', color: 'text-success bg-success/10 border-success/20', barColor: 'bg-emerald-400', desc: 'Las tasas están perfectamente unificadas.' };
    if (absSpread < SPREAD_HEALTHY_THRESHOLD) return { label: 'Saludable', color: 'text-success bg-success/10 border-success/20', barColor: 'bg-emerald-400', desc: 'Brecha saludable. El mercado oficial y el libre están alineados.' };
    if (absSpread < SPREAD_MODERATE_THRESHOLD) return { label: 'Moderado', color: 'text-warning bg-warning/10 border-warning/20', barColor: 'bg-amber-400', desc: 'Brecha de mercado estándar. Monitoree de cerca para compras/ventas importantes.' };
    return { label: 'Elevado', color: 'text-tertiary bg-tertiary/10 border-tertiary/20', barColor: 'bg-rose-400', desc: 'Brecha amplia. Existe alta volatilidad y riesgo de desajuste de precios.' };
  };

  const currentLevel = getSpreadLevel(activeGapPct);

  const handleShareRate = (rateName: string, value: number, currency: string) => {
    if (navigator.share) {
      navigator.share({
        title: `Tasa de cambio ${rateName}`,
        text: `Venrate - Tasa de Cambio para ${rateName}: ${value} VES/${currency}. ¡Monitorizado en tiempo real!`,
        url: window.location.href,
      }).catch(() => {
        onTriggerToast(`Tasa de ${rateName} copiada para compartir`, 'success');
      });
    } else {
      navigator.clipboard.writeText(`Tasa de Cambio ${rateName}: ${value} VES/${currency} (Venrate)`);
      onTriggerToast(`Tasa de ${rateName} copiada al portapapeles`, 'success');
    }
  };

  const handleShareAsImage = async () => {
    if (!shareCardRef.current) return;
    setIsGeneratingImage(true);
    try {
      const dataUrl = await toPng(shareCardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#0a0d1a',
        style: { transform: 'scale(1)', transformOrigin: 'top left' },
      });

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'venrate-conversion.png', { type: 'image/png' });
      const shareText = `${calcAmount} ${fromObj.code} = ${convertedAmount.toFixed(2)} ${toObj.code} (Venrate)`;

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: 'Conversión Venrate',
          text: shareText,
          files: [file],
        });
      } else {
        const link = document.createElement('a');
        link.download = 'venrate-conversion.png';
        link.href = dataUrl;
        link.click();
        onTriggerToast('Imagen descargada', 'success');
      }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        onTriggerToast('Error al generar la imagen', 'error');
      }
    } finally {
      setIsGeneratingImage(false);
      setShowShareModal(false);
    }
  };

  const visibleRates = widgetRateIds
    .map(id => rates.find(r => r.id === id))
    .filter((r): r is ExchangeRate => !!r);
  const heroRate = visibleRates[0] || rates[0];
  const prevRateRef = useRef(heroRate.rate);
  const [heroFlash, setHeroFlash] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (heroRate.rate !== prevRateRef.current) {
      setHeroFlash(heroRate.rate > prevRateRef.current ? 'up' : 'down');
      prevRateRef.current = heroRate.rate;
      const t = setTimeout(() => setHeroFlash(null), 800);
      return () => clearTimeout(t);
    }
  }, [heroRate.rate]);

  if (isInitialLoading) {
    return (
      <div className="space-y-6">
        <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
        <div className="block md:hidden space-y-4">
          <div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/[0.04]">
            {[1, 2, 3].map(i => <SkeletonListRow key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div id="dashboard-tab" className="space-y-10" variants={containerVariants} initial="hidden" animate="visible">
      <motion.header className="flex flex-col md:flex-row md:items-end justify-between gap-5" variants={itemVariants}>
        <div className="space-y-1.5">
          <p className="font-mono text-[11px] text-primary/70 uppercase tracking-[0.25em] font-semibold">
            Mercado en Vivo
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-[#eaecfa]">
            Tasas de Cambio
          </h2>
        </div>
        <motion.div
          className="flex items-center gap-2.5 px-5 py-2.5 rounded-full glass border border-primary/10"
          variants={itemVariants}
        >
          <motion.span
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
            className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"
            style={{ boxShadow: '0 0 10px rgba(52,211,153,0.5)' }}
          />
          <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-success/90">
            Mercado Abierto
          </span>
        </motion.div>
      </motion.header>

      {isEqualizedToBcv && (
        <motion.div variants={itemVariants} className="glass-card rounded-2xl p-5 flex gap-4 text-primary/90">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-sans text-sm font-bold text-[#eaecfa]">Modo Tasa Única BCV Activo</h4>
            <p className="font-sans text-xs text-slate-400 leading-relaxed">
              Para simplificar su facturación, todas las tasas de USD han sido igualadas a la tasa oficial del Banco Central de Venezuela.
            </p>
          </div>
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <div
          className={`glass-card rounded-3xl p-6 md:p-8 relative overflow-hidden transition-colors ${
            heroFlash === 'up' ? 'animate-ticker-flash-green' : heroFlash === 'down' ? 'animate-ticker-flash-red' : ''
          }`}
        >
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-8 -bottom-8 w-36 h-36 rounded-full bg-secondary/8 blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] text-primary/80 uppercase tracking-[0.3em] font-bold bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                  PRINCIPAL
                </span>
                <span className="font-mono text-[10px] text-slate-500">
                  {heroRate.id === 'binanceP2p' ? 'Binance P2P · USDT' : 'Banco Central de Venezuela'}
                </span>
              </div>

              <div className="space-y-2">
                <AnimatedNumber
                  value={heroRate.rate}
                  className="font-display text-5xl md:text-7xl font-bold tracking-tight text-on-surface"
                />
                <p className="font-mono text-sm text-slate-400">
                  VES / {heroRate.code}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <motion.span
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border ${
                    heroRate.change >= 0
                      ? 'text-success bg-success/10 border-success/20'
                      : 'text-tertiary bg-tertiary/10 border-tertiary/20'
                  }`}
                >
                  {heroRate.change >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  <span className="font-mono">{heroRate.change >= 0 ? '+' : ''}{heroRate.change.toFixed(2)}%</span>
                </motion.span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => handleShareRate(heroRate.name, heroRate.rate, heroRate.code)}
                  className="p-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-on-surface transition-colors cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            <div className="flex flex-col gap-3 justify-center">
              {visibleRates.slice(1).map(r => {
                const isUp = r.change >= 0;
                return (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                        r.id === 'binanceP2p'
                          ? 'bg-warning/15 text-warning border border-warning/20'
                          : 'bg-secondary/10 text-secondary border border-secondary/20'
                      }`}>
                        {r.code}
                      </span>
                      <div>
                        <p className="font-sans text-xs font-semibold text-[#eaecfa]">{r.name}</p>
                        <p className="font-mono text-[10px] text-slate-500">{r.lastUpdated}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm font-bold text-on-surface">{r.rate.toFixed(2)}</p>
                      <p className={`font-mono text-[10px] font-semibold ${isUp ? 'text-success' : 'text-tertiary'}`}>
                        {isUp ? '+' : ''}{r.change.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <motion.section variants={itemVariants} className="lg:col-span-3 glass-card rounded-3xl p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="w-11 h-11 rounded-xl bg-secondary/10 flex items-center justify-center border border-secondary/20"
              >
                <Calculator className="text-secondary w-5 h-5" />
              </motion.div>
              <div>
                <h3 className="font-display text-lg font-bold text-on-surface">Conversor Cambiario</h3>
                <p className="font-sans text-[11px] text-slate-500">Calculadora bidireccional en tiempo real</p>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-mono text-[10px] text-slate-500 tracking-wider font-semibold uppercase">De</label>
                <CurrencySelect
                  value={fromCurrency}
                  onChange={setFromCurrency}
                  currencies={CALCULATOR_CURRENCIES}
                  excludeId={toCurrency}
                />
              </div>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={fromDraftFocused ? fromDraft : formatEsVe(calcAmount)}
                  onFocus={() => { setFromDraft(calcAmount === 0 ? '' : String(calcAmount)); setFromDraftFocused(true); }}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9.,]/g, '');
                    setFromDraft(raw);
                    setCalcAmount(parseEsVe(raw));
                  }}
                  onBlur={() => { setFromDraftFocused(false); }}
                  className="w-full bg-white/[0.02] border border-white/[0.06] rounded-2xl px-5 py-4 font-mono text-2xl text-on-surface outline-none focus:border-primary/30 transition-all placeholder:text-slate-700"
                  placeholder="0,00"
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs bg-white/[0.04] px-3 py-1.5 rounded-xl border border-white/[0.05]">
                  {fromObj.code}
                </div>
              </div>
            </div>

            <div className="flex justify-center -my-3 relative z-10">
              <motion.button
                onClick={handleSwapCurrencies}
                animate={{ rotate: swapped ? 180 : 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(34,211,238,0.1)' }}
                whileTap={{ scale: 0.9 }}
                className="glass p-3.5 rounded-full border border-white/[0.06] cursor-pointer text-primary shadow-lg"
                aria-label="Invertir dirección"
              >
                <ArrowUpDown className="w-5 h-5" />
              </motion.button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-mono text-[10px] text-slate-500 tracking-wider font-semibold uppercase">A</label>
                <CurrencySelect
                  value={toCurrency}
                  onChange={setToCurrency}
                  currencies={CALCULATOR_CURRENCIES}
                  excludeId={fromCurrency}
                  accent="secondary"
                />
              </div>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={formatEsVe(convertedAmount)}
                  onChange={(e) => {
                    const v = parseEsVe(e.target.value);
                    if (fromRate !== 0) setCalcAmount(isNaN(v) ? 0 : (v * toRate) / fromRate);
                  }}
                  className="w-full bg-white/[0.02] border border-white/[0.06] rounded-2xl px-5 py-4 font-mono text-2xl text-on-surface outline-none focus:border-primary/30 transition-all placeholder:text-slate-700"
                  placeholder="0,00"
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-secondary font-bold text-xs bg-secondary/10 px-3 py-1.5 rounded-xl border border-secondary/15">
                  {toObj.code}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[10px] font-mono text-slate-600 uppercase tracking-wider mr-1">Preajustes:</span>
              {fromObj.code === 'VES'
                ? [500, 1000, 2000, 5000].map(v => (
                    <motion.button key={v} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }} onClick={() => setCalcAmount(v)}
                      className="px-3 py-1 text-xs font-mono font-bold bg-white/[0.03] hover:bg-primary/20 hover:text-primary/90 rounded-xl border border-white/[0.05] transition-colors text-slate-400 cursor-pointer">
                      Bs {v.toLocaleString('es-VE')}
                    </motion.button>
                  ))
                : [10, 50, 100, 500].map(v => (
                    <motion.button key={v} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }} onClick={() => setCalcAmount(v)}
                      className="px-3 py-1 text-xs font-mono font-bold bg-white/[0.03] hover:bg-primary/20 hover:text-primary/90 rounded-xl border border-white/[0.05] transition-colors text-slate-400 cursor-pointer">
                      {fromObj.code === 'EUR' ? '€' : '$'}{v}
                    </motion.button>
                  ))}
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }}
                onClick={() => { setShareNote(''); setShowShareModal(true); }}
                disabled={calcAmount === 0}
                className="px-3 py-1 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 rounded-xl border border-primary/15 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ImageIcon className="w-3 h-3 inline mr-1" />
                Compartir
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }}
                onClick={() => { setCalcAmount(0); onTriggerToast('Campos vaciados', 'info'); }}
                className="ml-auto px-3 py-1 text-xs font-semibold bg-tertiary/10 text-tertiary hover:bg-tertiary/20 rounded-xl border border-tertiary/15 transition-colors cursor-pointer"
              >
                Limpiar
              </motion.button>
            </div>

            <div className="p-3 bg-white/[0.02] rounded-xl border border-white/[0.04] flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-mono text-slate-500">
              <span>1 {fromObj.code}</span>
              <span>≈</span>
              <span className="font-bold text-primary/90">{(fromRate / toRate).toFixed(4)}</span>
              <span>{toObj.code}</span>
            </div>
          </div>
        </motion.section>

        <motion.section variants={itemVariants} className="lg:col-span-2 glass-card rounded-3xl p-6 md:p-8 flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-4">
            <div className="flex bg-white/[0.03] rounded-xl p-1 gap-1">
              {(['spread', 'forecast'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setRightPanelTab(tab)}
                  className={`relative px-4 py-2 rounded-[10px] text-[11px] font-bold tracking-wide uppercase transition-colors cursor-pointer ${
                    rightPanelTab === tab ? 'text-on-surface' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {rightPanelTab === tab && (
                    <motion.div layoutId="analysis-pill" className="absolute inset-1 rounded-[8px] bg-gradient-to-r from-primary/20 to-secondary/15 border border-primary/15" transition={{ type: 'spring', stiffness: 400, damping: 28 }} />
                  )}
                  <span className="relative z-10">{tab === 'spread' ? 'Brecha' : 'Proyección'}</span>
                </button>
              ))}
            </div>
            <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
              <Activity className="w-4 h-4 text-primary" />
            </motion.div>
          </div>

          {rightPanelTab === 'spread' ? (
            <div className="space-y-5 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h4 className="font-display text-base font-bold text-on-surface">Monitor de Diferencial</h4>
                  <p className="font-sans text-[11px] text-slate-500">Diferencia BCV Oficial vs. Binance P2P</p>
                </div>

                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider">BCV vs Binance P2P</span>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${currentLevel.color}`}>
                      {currentLevel.label}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-3">
                    <span className="font-display text-3xl font-extrabold text-on-surface">
                      {isEqualizedToBcv ? '0.00%' : `${activeGapPct >= 0 ? '+' : ''}${activeGapPct.toFixed(2)}%`}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">
                      Δ {isEqualizedToBcv ? '0.00' : `${activeGapDiff >= 0 ? '+' : ''}${activeGapDiff.toFixed(2)}`} VES
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="w-full h-2 rounded-full bg-white/[0.04] overflow-hidden relative">
                      <div className="absolute inset-0 flex">
                        <div className="w-[20%] h-full bg-success/20" />
                        <div className="w-[40%] h-full bg-warning/20" />
                        <div className="w-[40%] h-full bg-tertiary/20" />
                      </div>
                      {!isEqualizedToBcv && (
                        <motion.div
                          className={`absolute top-0 bottom-0 w-3 rounded-full border border-white/30 ${currentLevel.barColor}`}
                          animate={{ left: `${Math.min(Math.max((activeGapPct / SPREAD_MAX_SCALE) * 100, 3), 97)}%` }}
                          transition={{ type: 'spring', stiffness: 100, damping: 18 }}
                          style={{ translateX: '-50%' }}
                        />
                      )}
                    </div>
                    <div className="flex justify-between font-mono text-[8px] text-slate-600">
                      <span>0%</span><span>5%</span><span>10%+</span>
                    </div>
                  </div>

                  <p className="font-sans text-[11px] text-slate-500 leading-relaxed">{currentLevel.desc}</p>
                </div>
              </div>

              {isEqualizedToBcv ? (
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-[11px] text-primary/90 space-y-1">
                  <div className="font-bold flex items-center gap-1.5"><Scale className="w-3.5 h-3.5" /><span>Modo Tasa Única BCV Activo</span></div>
                  <p className="leading-relaxed opacity-90">Las brechas se muestran como 0.00% porque todas las referencias igualan al BCV.</p>
                </div>
              ) : (
                <div className="p-3 bg-secondary/10 border border-secondary/20 rounded-xl text-[11px] text-secondary/90 space-y-1">
                  <div className="font-bold flex items-center gap-1.5"><Scale className="w-3.5 h-3.5" /><span>Recomendación</span></div>
                  <p className="leading-relaxed opacity-90">Por ley en Venezuela, los cobros deben regirse por la tasa oficial del BCV.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 flex-1 flex flex-col justify-end min-h-[300px] relative rounded-2xl overflow-hidden p-6 group">
              <div className="absolute inset-0">
                <div className="w-full h-full bg-gradient-to-br from-violet-500/8 via-transparent to-cyan-500/8" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,0.06)_0%,transparent_50%),radial-gradient(circle_at_70%_80%,rgba(139,92,246,0.06)_0%,transparent_50%)]" />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center gap-1.5 bg-tertiary/15 text-tertiary/90 px-3.5 py-1 rounded-full border border-tertiary/20 backdrop-blur-md">
                  <TrendingUp className="w-3 h-3" />
                  <span className="font-mono text-[9px] uppercase font-bold tracking-wider">Tendencia Alcista</span>
                </div>
                <h4 className="font-display text-lg font-bold text-on-surface">Proyección Semanal</h4>
                <p className="font-sans text-xs text-slate-400 leading-relaxed">
                  Se observa una volatilidad moderada en el par VES/USDT durante las últimas 72 horas debido a los ajustes de liquidez semanal. Se aconseja mantener activos sus avisos en tiempo real para capturar fluctuaciones.
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onNavigateToAlerts}
                  className="text-xs font-semibold text-primary hover:text-primary/90 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  Configurar alertas inteligentes →
                </motion.button>
              </div>
            </div>
          )}
        </motion.section>
      </div>

      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowShareModal(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong rounded-3xl p-6 max-w-md w-full space-y-5 relative overflow-hidden"
            >
              <button
                onClick={() => setShowShareModal(false)}
                aria-label="Cerrar"
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-on-surface hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div>
                <h4 className="font-display text-lg font-bold text-on-surface">Compartir conversión</h4>
                <p className="font-sans text-[11px] text-slate-500">Genera una imagen con el resultado y compártela</p>
              </div>

              <div className="flex justify-center">
                <ShareableConversionCard
                  ref={shareCardRef}
                  fromAmount={calcAmount}
                  fromCurrencyCode={fromObj.code}
                  toAmount={convertedAmount}
                  toCurrencyCode={toObj.code}
                  rate={fromRate / toRate}
                  note={shareNote}
                />
              </div>

              <div className="space-y-2">
                <label className="font-mono text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  Nota (opcional)
                </label>
                <textarea
                  value={shareNote}
                  onChange={(e) => setShareNote(e.target.value)}
                  placeholder="Ej: Tasa del día para referencia..."
                  rows={2}
                  maxLength={160}
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-on-surface outline-none focus:border-primary/30 transition-all placeholder:text-slate-700 resize-none"
                />
                <p className="text-right font-mono text-[9px] text-slate-600">{shareNote.length}/160</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="flex-1 px-4 py-2.5 text-xs font-semibold bg-white/[0.04] text-slate-400 hover:text-on-surface rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleShareAsImage}
                  disabled={isGeneratingImage}
                  className="flex-1 px-4 py-2.5 text-xs font-bold bg-primary/20 text-primary hover:bg-primary/30 rounded-xl border border-primary/20 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingImage ? 'Generando...' : 'Compartir como foto'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
