import React, { useState, useMemo } from 'react';
import { ArrowUpDown, Calculator, Landmark, Share2, TrendingDown, TrendingUp, AlertCircle, RefreshCw, Activity, Scale } from 'lucide-react';
import { ExchangeRate } from '../types';
import { SkeletonCard, SkeletonListRow } from './SkeletonCard';
import { SPREAD_HEALTHY_THRESHOLD, SPREAD_MODERATE_THRESHOLD, SPREAD_MAX_SCALE, FALLBACK_RATES } from '../constants';

export const CALCULATOR_CURRENCIES = [
  { id: 'VES', name: 'Bolívares (VES)', code: 'VES', getRate: () => 1 },
  { id: 'USD_B', name: 'USD BCV (Oficial)', code: 'USD', getRate: (ratesList: ExchangeRate[]) => ratesList.find(r => r.id === 'bcvUsd')?.rate || 36.24 },
  { id: 'EUR', name: 'Euro (EUR)', code: 'EUR', getRate: (ratesList: ExchangeRate[]) => ratesList.find(r => r.id === 'bcvEur')?.rate || 39.12 },
  { id: 'USDT', name: 'USDT Binance', code: 'USDT', getRate: (ratesList: ExchangeRate[]) => ratesList.find(r => r.id === 'binanceP2p')?.rate || 38.45 },
];

interface DashboardTabProps {
  rates: ExchangeRate[];
  onTriggerToast: (message: string, type: 'success' | 'info' | 'error') => void;
  onNavigateToAlerts: () => void;
  isFetching: boolean;
  onRefresh: () => void;
  lastFetched: Date | null;
  isCompactView: boolean;
  isEqualizedToBcv?: boolean;
  isInitialLoading?: boolean;
  isOffline?: boolean;
}

export const DashboardTab = React.memo<DashboardTabProps>(({ 
  rates, 
  onTriggerToast, 
  onNavigateToAlerts,
  isFetching,
  onRefresh,
  lastFetched,
  isCompactView,
  isEqualizedToBcv = false,
  isInitialLoading = false,
  isOffline = false
}) => {
  // New customized calculator states (USD, EUR, USDT, VES)
  const [fromCurrency, setFromCurrency] = useState<string>('USD_B');
  const [toCurrency, setToCurrency] = useState<string>('VES');
  const [calcAmount, setCalcAmount] = useState<number>(100);

  // New right panel tab & gap states
  const [rightPanelTab, setRightPanelTab] = useState<'spread' | 'forecast'>('spread');
  const [activeGapPair, setActiveGapPair] = useState<'bcv_binance'>('bcv_binance');

  // Derive calculator rate conversions
  const fromObj = CALCULATOR_CURRENCIES.find(c => c.id === fromCurrency) || CALCULATOR_CURRENCIES[1];
  const toObj = CALCULATOR_CURRENCIES.find(c => c.id === toCurrency) || CALCULATOR_CURRENCIES[0];

  const fromRate = fromObj.getRate(rates);
  const toRate = toObj.getRate(rates);

  const convertedAmount = toRate !== 0 ? (calcAmount * fromRate) / toRate : 0;

  // Swap currencies
  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    onTriggerToast('Dirección de conversión intercambiada', 'info');
  };

  // Spreads analysis
  const bcvRate = rates.find(r => r.id === 'bcvUsd')?.rate || 36.24;
  const binRate = rates.find(r => r.id === 'binanceP2p')?.rate || 38.45;

  const gapBcvBinance = bcvRate > 0 ? ((binRate - bcvRate) / bcvRate) * 100 : 0;
  const diffBcvBinance = binRate - bcvRate;

  // Active gap calculations based on selection
  let activeGapLabel = 'BCV Oficial vs. Binance P2P';
  let activeGapPct = gapBcvBinance;
  let activeGapDiff = diffBcvBinance;
  let activeGapSource = 'BCV (Oficial)';
  let activeGapDest = 'Binance P2P';

  const getSpreadLevel = (spreadPct: number) => {
    const absSpread = Math.abs(spreadPct);
    if (absSpread === 0) {
      return { 
        label: 'Sin Brecha', 
        color: 'text-success bg-success/10 border-success/20', 
        barColor: 'bg-success', 
        desc: 'Las tasas están perfectamente unificadas.' 
      };
    } else if (absSpread < SPREAD_HEALTHY_THRESHOLD) {
      return { 
        label: 'Saludable / Muy Bajo', 
        color: 'text-success bg-success/10 border-success/20', 
        barColor: 'bg-success', 
        desc: 'Brecha saludable. El mercado oficial y el libre están alineados.' 
      };
    } else if (absSpread < SPREAD_MODERATE_THRESHOLD) {
      return { 
        label: 'Moderado', 
        color: 'text-warning bg-warning/10 border-warning/20', 
        barColor: 'bg-warning', 
        desc: 'Brecha de mercado estándar. Monitoree de cerca para compras/ventas importantes.' 
      };
    } else {
      return { 
        label: 'Elevado (Distorsión)', 
        color: 'text-error bg-error/10 border-error/20', 
        barColor: 'bg-error', 
        desc: 'Brecha amplia. Existe alta volatilidad y riesgo de desajuste de precios.' 
      };
    }
  };

  const currentLevel = getSpreadLevel(activeGapPct);

  const handleShareRate = (rateName: string, value: number, currency: string) => {
    if (navigator.share) {
      navigator.share({
        title: `Tasa de cambio ${rateName}`,
        text: `VeneRate - Tasa de Cambio para ${rateName}: ${value} VES/${currency}. ¡Monitorizado en tiempo real!`,
        url: window.location.href,
      }).catch(() => {
        onTriggerToast(`Tasa de ${rateName} copiada para compartir`, 'success');
      });
    } else {
      navigator.clipboard.writeText(`Tasa de Cambio ${rateName}: ${value} VES/${currency} (VeneRate)`);
      onTriggerToast(`Tasa de ${rateName} copiada al portapapeles`, 'success');
    }
  };

  return (
    <div id="dashboard-tab" className="space-y-12 animate-fade-in">
      {/* Header & Market Status */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <p className="font-mono text-xs text-secondary dark:text-secondary uppercase tracking-[0.2em] font-medium opacity-80">
            Mercado en Vivo
          </p>
          <h2 className="font-sans text-3xl md:text-4xl font-bold text-on-surface dark:text-white tracking-tight">
            Tasas de Cambio
          </h2>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 px-5 py-2.5 bg-secondary/10 text-secondary border border-secondary/20 rounded-full w-fit backdrop-blur-sm shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse shadow-[0_0_12px_rgba(137,206,255,0.5)]"></span>
            <span className="font-mono text-[11px] uppercase font-bold tracking-widest">
              Mercado Abierto
            </span>
          </div>
        </div>
      </header>

      {isEqualizedToBcv && (
        <div id="bcv-equalized-banner" className="bg-primary/10 border border-primary/20 rounded-2xl p-5 flex gap-4 text-primary animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-sans text-sm font-bold text-on-surface dark:text-white">
              Modo Tasa Única BCV Activo
            </h4>
            <p className="font-sans text-xs text-on-surface-variant/80 leading-relaxed">
              Para simplificar su facturación o administración comercial, todas las tasas de dólares (Binance P2P) han sido igualadas a la tasa oficial del Banco Central de Venezuela. Las calculadoras y comparativas utilizarán este valor.
            </p>
          </div>
        </div>
      )}

      {/* Rates Monitoring Container */}
      {isInitialLoading ? (
        <div className="space-y-6">
          <div className="block md:hidden space-y-4">
            <div className="fluid-card rounded-2xl overflow-hidden divide-y divide-on-surface/5">
              {[1, 2, 3].map(i => <SkeletonListRow key={i} />)}
            </div>
          </div>
          <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </div>
        </div>
      ) : isCompactView ? (
        <>
          {/* Mobile Compact List View - Visible on small screens, hidden/fallback on larger */}
          <div className="block md:hidden space-y-4">
            <div className="fluid-card rounded-2xl overflow-hidden divide-y divide-on-surface/5">
              {rates.map((rate) => {
                const isUp = rate.change >= 0;
                const isZero = rate.change === 0;
                return (
                  <div
                    key={rate.id}
                    onClick={() => {
                      if (rate.id === 'binanceP2p') {
                        setFromCurrency('USDT');
                        setToCurrency('VES');
                      } else if (rate.id === 'bcvUsd') {
                        setFromCurrency('USD_B');
                        setToCurrency('VES');
                      } else if (rate.id === 'bcvEur') {
                        setFromCurrency('EUR');
                        setToCurrency('VES');
                      } else {
                        setFromCurrency('USD_B');
                        setToCurrency('VES');
                      }
                    }}
                    className="p-4 flex items-center justify-between hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      {/* Currency Symbol Badge with neon glow */}
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs ${
                        rate.id === 'binanceP2p'
                          ? 'bg-primary/15 text-primary border border-primary/30 shadow-[0_0_12px_rgba(0,217,255,0.15)]'
                          : isZero
                            ? 'bg-surface-variant text-on-surface-variant border border-on-surface/5'
                            : isUp
                              ? 'bg-success/10 text-success border border-success/20'
                              : 'bg-error/10 text-error border border-error/20'
                      }`}>
                        {rate.code === 'USDT' ? 'USDT' : rate.code}
                      </div>
                      <div>
                        <h4 className="font-sans text-sm font-bold text-on-surface dark:text-white">
                          {rate.name}
                        </h4>
                        <p className="font-sans text-[10px] text-on-surface-variant/70 leading-none">
                          {rate.id === 'binanceP2p' ? 'P2P Promedio' : 'Tasa de Referencia'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="font-mono text-sm font-extrabold text-on-surface dark:text-white">
                          {rate.rate.toFixed(2)}
                        </span>
                        <span className="font-mono text-[9px] text-on-surface-variant block leading-none">
                          VES
                        </span>
                      </div>

                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShareRate(rate.name, rate.rate, rate.code);
                        }}
                        className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isZero 
                            ? 'bg-on-surface/5 text-on-surface-variant/60'
                            : isUp 
                              ? 'text-success bg-success/10' 
                              : 'text-error bg-error/10'
                        }`}
                      >
                        <span className="font-mono">
                          {isZero ? '0.00' : isUp ? '+' : ''}{rate.change.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Desktop/Tablet detailed Grid/List View - Hidden on mobile, visible on larger */}
          <div className="hidden md:block">
            {/* Bento Grid for Rates */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rates.filter(r => ['bcvUsd', 'bcvEur', 'binanceP2p'].includes(r.id)).map((rate) => {
                const isUp = rate.change >= 0;
                return (
                  <div
                    key={rate.id}
                    onClick={() => {
                      if (rate.id === 'binanceP2p') {
                        setFromCurrency('USDT');
                        setToCurrency('VES');
                      } else if (rate.id === 'bcvUsd') {
                        setFromCurrency('USD_B');
                        setToCurrency('VES');
                      } else if (rate.id === 'bcvEur') {
                        setFromCurrency('EUR');
                        setToCurrency('VES');
                      }
                    }}
                    className={`p-6 rounded-2xl flex flex-col justify-between min-h-[190px] transition-all duration-300 hover:scale-[1.02] cursor-pointer group relative overflow-hidden ${
                      rate.id === 'binanceP2p'
                        ? 'bg-primary/10 border border-primary/30 shadow-[0_0_30px_rgba(0,217,255,0.12)]'
                        : isUp
                          ? 'bg-gradient-to-br from-success/5 via-surface-container/50 to-surface-container border border-success/20 shadow-[0_0_30px_rgba(0,255,136,0.06)]'
                          : 'fluid-card'
                    }`}
                  >
                    {/* Glow overlay */}
                    <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full blur-3xl group-hover:scale-150 transition-all duration-700 ${
                      rate.id === 'binanceP2p'
                        ? 'bg-primary/15'
                        : isUp
                          ? 'bg-success/10'
                          : 'bg-error/10'
                    }`}></div>

                    <div className="flex justify-between items-start relative z-10">
                      <div className="space-y-1">
                        <h3 className="font-sans text-lg font-bold text-on-surface dark:text-white group-hover:text-primary transition-colors">
                          {rate.name}
                        </h3>
                        <p className="font-sans text-xs text-on-surface-variant/80">
                          {rate.id === 'binanceP2p' ? 'USDT Promedio' : 'Oficial Venezuela'}
                        </p>
                      </div>

                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShareRate(rate.name, rate.rate, rate.code);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${
                          isUp 
                            ? 'text-success bg-success/10 border-success/20 shadow-[0_0_12px_rgba(0,255,136,0.1)]' 
                            : 'text-error bg-error/10 border-error/20 shadow-[0_0_12px_rgba(255,51,102,0.1)]'
                        }`}
                      >
                        <TrendingUp className={`w-3.5 h-3.5 ${!isUp ? 'rotate-180' : ''}`} />
                        <span className="font-mono">
                          {isUp ? '+' : ''}{rate.change.toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    <div className="mt-8 flex items-baseline justify-between relative z-10">
                      <div className="flex items-baseline gap-2">
                        <span className={`font-sans text-4xl font-extrabold tracking-tight ${
                          rate.id === 'binanceP2p' ? 'text-primary' : 'text-on-surface dark:text-white'
                        }`}>
                          {rate.rate.toFixed(2)}
                        </span>
                        <span className="font-mono text-xs text-on-surface-variant uppercase">
                          VES/{rate.code}
                        </span>
                      </div>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShareRate(rate.name, rate.rate, rate.code);
                        }}
                        aria-label={`Compartir tasa de ${rate.name}`}
                        className="p-2 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
                      >
                        <Share2 className="w-4 h-4 text-on-surface-variant" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        /* Regular Detailed layout for all screen sizes */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rates.filter(r => ['bcvUsd', 'bcvEur', 'binanceP2p'].includes(r.id)).map((rate) => {
            const isUp = rate.change >= 0;
            return (
              <div
                key={rate.id}
                onClick={() => {
                  if (rate.id === 'binanceP2p') {
                    setFromCurrency('USDT');
                    setToCurrency('VES');
                  } else if (rate.id === 'bcvUsd') {
                    setFromCurrency('USD_B');
                    setToCurrency('VES');
                  } else if (rate.id === 'bcvEur') {
                    setFromCurrency('EUR');
                    setToCurrency('VES');
                  }
                }}
                className={`p-6 rounded-2xl flex flex-col justify-between min-h-[190px] transition-all duration-300 hover:scale-[1.02] cursor-pointer group relative overflow-hidden ${
                  rate.id === 'binanceP2p'
                    ? 'bg-primary/10 border border-primary/30 shadow-[0_0_30px_rgba(0,217,255,0.12)]'
                    : isUp
                      ? 'bg-gradient-to-br from-success/5 via-surface-container/50 to-surface-container border border-success/20 shadow-[0_0_30px_rgba(0,255,136,0.06)]'
                      : 'fluid-card'
                }`}
              >
                {/* Dynamic glow overlay */}
                <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full blur-3xl group-hover:scale-150 transition-all duration-700 ${
                  rate.id === 'binanceP2p'
                    ? 'bg-primary/15'
                    : isUp
                      ? 'bg-success/10'
                      : 'bg-error/10'
                }`}></div>

                <div className="flex justify-between items-start relative z-10">
                  <div className="space-y-1">
                    <h3 className="font-sans text-lg font-bold text-on-surface dark:text-white group-hover:text-primary transition-colors">
                      {rate.name}
                    </h3>
                    <p className="font-sans text-xs text-on-surface-variant/80">
                      {rate.id === 'binanceP2p' ? 'USDT Promedio' : 'Oficial Venezuela'}
                    </p>
                  </div>

                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShareRate(rate.name, rate.rate, rate.code);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${
                      isUp 
                        ? 'text-success bg-success/10 border-success/20 shadow-[0_0_12px_rgba(0,255,136,0.1)]' 
                        : 'text-error bg-error/10 border-error/20 shadow-[0_0_12px_rgba(255,51,102,0.1)]'
                    }`}
                  >
                    {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    <span className="font-mono">
                      {isUp ? '+' : ''}{rate.change.toFixed(2)}%
                    </span>
                  </div>
                </div>

                <div className="mt-8 flex items-baseline justify-between relative z-10">
                  <div className="flex items-baseline gap-2">
                    <span className={`font-sans text-4xl font-extrabold tracking-tight ${
                      rate.id === 'binanceP2p' ? 'text-primary' : 'text-on-surface dark:text-white'
                    }`}>
                      {rate.rate.toFixed(2)}
                    </span>
                    <span className="font-mono text-xs text-on-surface-variant uppercase">
                      VES/{rate.code}
                    </span>
                  </div>

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShareRate(rate.name, rate.rate, rate.code);
                    }}
                    className="p-2 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
                  >
                    <Share2 className="w-4 h-4 text-on-surface-variant" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Conversion Section & Weekly Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Quick Calculator */}
        <section id="quick-calculator-panel" className="lg:col-span-3 fluid-card p-8 rounded-2xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-secondary/10 rounded-xl flex items-center justify-center border border-secondary/20 animate-fade-in">
                <Calculator className="text-secondary w-5 h-5" />
              </div>
              <div>
                <h3 className="font-sans text-lg font-bold text-on-surface dark:text-white">
                  Conversor Cambiario Rápido
                </h3>
                <p className="font-sans text-xs text-on-surface-variant/80">
                  Calculadora integrada bidireccional en tiempo real
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            {/* Input 1 (From Currency Selection & Input) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-2">
                <span className="flex items-center gap-2">
                  <label className="font-mono text-[11px] text-on-surface-variant tracking-wider font-semibold uppercase">
                    De
                  </label>
                  <span className="text-[10px] font-mono font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">
                    Tasa: {fromRate.toFixed(2)} VES
                  </span>
                </span>
                <select
                  id="calc-from-selector"
                  value={fromCurrency}
                  onChange={(e) => {
                    setFromCurrency(e.target.value);
                  }}
                  className="bg-surface-container-low dark:bg-surface-container-lowest border border-on-surface/5 rounded-lg px-2.5 py-1 text-xs text-on-surface font-semibold outline-none cursor-pointer hover:border-primary/50 transition-all"
                >
                  {CALCULATOR_CURRENCIES.map(curr => (
                    <option key={curr.id} value={curr.id}>{curr.name}</option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <input
                  id="calc-source-input"
                  type="number"
                  value={calcAmount === 0 ? '' : calcAmount}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setCalcAmount(isNaN(val) ? 0 : val);
                  }}
                  className="w-full bg-surface-container-lowest/50 border border-on-surface/5 rounded-xl px-5 py-4 font-mono text-2xl text-on-surface outline-none focus:border-primary/50 transition-all placeholder:text-on-surface-variant/30"
                  placeholder="0.00"
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold tracking-wider text-xs bg-on-surface/5 px-3 py-1.5 rounded-lg border border-on-surface/5">
                  {fromObj.code}
                </div>
              </div>
            </div>

            {/* Swap Button container */}
            <div className="flex justify-center -my-3 relative z-10">
              <button
                id="btn-calc-swap"
                onClick={handleSwapCurrencies}
                aria-label="Invertir dirección de conversión"
                className="bg-surface-bright dark:bg-surface-container-high p-3.5 rounded-full border border-on-surface/5 hover:rotate-180 transition-transform duration-500 shadow-lg cursor-pointer text-primary hover:text-secondary group"
                title="Invertir dirección"
              >
                <ArrowUpDown className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
            </div>

            {/* Input 2 (To Currency Selection & Result) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-2">
                <span className="flex items-center gap-2">
                  <label className="font-mono text-[11px] text-on-surface-variant tracking-wider font-semibold uppercase">
                    A
                  </label>
                  <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    Tasa: {toRate.toFixed(2)} VES
                  </span>
                </span>
                <select
                  id="calc-to-selector"
                  value={toCurrency}
                  onChange={(e) => {
                    setToCurrency(e.target.value);
                  }}
                  className="bg-surface-container-low dark:bg-surface-container-lowest border border-on-surface/5 rounded-lg px-2.5 py-1 text-xs text-on-surface font-semibold outline-none cursor-pointer hover:border-primary/50 transition-all"
                >
                  {CALCULATOR_CURRENCIES.map(curr => (
                    <option key={curr.id} value={curr.id}>{curr.name}</option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <input
                  id="calc-destination-input"
                  type="number"
                  value={convertedAmount === 0 ? '' : parseFloat(convertedAmount.toFixed(4))}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    const destVal = isNaN(val) ? 0 : val;
                    if (fromRate !== 0) {
                      setCalcAmount((destVal * toRate) / fromRate);
                    }
                  }}
                  className="w-full bg-surface-container-lowest/50 border border-on-surface/5 rounded-xl px-5 py-4 font-mono text-2xl text-on-surface outline-none focus:border-primary/50 transition-all placeholder:text-on-surface-variant/30"
                  placeholder="0.00"
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-secondary font-bold tracking-wider text-xs bg-secondary/10 px-3 py-1.5 rounded-lg border border-secondary/10">
                  {toObj.code}
                </div>
              </div>
            </div>

            {/* Quick Presets Section */}
            <div className="pt-2">
              <div className="flex flex-wrap gap-2 justify-start items-center">
                <span className="text-[10px] font-mono text-on-surface-variant/60 uppercase tracking-wider mr-1">Preajustes:</span>
                {fromObj.code === 'VES' ? (
                  [500, 1000, 2000, 5000].map(val => (
                    <button
                      key={val}
                      onClick={() => {
                        setCalcAmount(val);
                      }}
                      className="px-3 py-1 text-xs font-mono font-bold bg-surface-container-low/80 hover:bg-primary hover:text-white rounded-lg border border-on-surface/5 transition-all text-on-surface cursor-pointer"
                    >
                      Bs {val.toLocaleString('es-VE')}
                    </button>
                  ))
                ) : (
                  [10, 50, 100, 500].map(val => (
                    <button
                      key={val}
                      onClick={() => {
                        setCalcAmount(val);
                      }}
                      className="px-3 py-1 text-xs font-mono font-bold bg-surface-container-low/80 hover:bg-primary hover:text-white rounded-lg border border-on-surface/5 transition-all text-on-surface cursor-pointer"
                    >
                      {fromObj.code === 'EUR' ? '€' : '$'}{val}
                    </button>
                  ))
                )}
                <button
                  onClick={() => {
                    setCalcAmount(0);
                    onTriggerToast('Campos vaciados', 'info');
                  }}
                  className="ml-auto px-3 py-1 text-xs font-semibold bg-tertiary/10 text-tertiary hover:bg-tertiary/20 rounded-lg border border-tertiary/10 transition-all cursor-pointer"
                >
                  Limpiar
                </button>
              </div>
            </div>

            {/* Calculation formula breakdown */}
            <div className="p-3 bg-surface-container-lowest/40 rounded-xl border border-on-surface/5 flex flex-wrap items-center justify-center gap-2 text-xs font-mono text-on-surface-variant leading-relaxed">
              <span>Fórmula:</span>
              <span className="font-bold text-on-surface">{calcAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
              <span>{fromObj.code}</span>
              <span>×</span>
              <span className="font-bold text-on-surface">{(fromRate / toRate).toFixed(4)}</span>
              <span>=</span>
              <span className="font-bold text-primary">{(convertedAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span>{toObj.code}</span>
            </div>

            <div className="text-center font-mono text-[10px] text-on-surface-variant/70 italic space-y-0.5">
              <p>
                1 {fromObj.code} ≈ {(fromRate / toRate).toFixed(4)} {toObj.code}
              </p>
              <p className="text-[9px] opacity-75">
                (Actualización en vivo en base a cotizaciones activas en la plataforma)
              </p>
            </div>
          </div>
        </section>

        {/* Weekly Insights & Spread Monitor Card */}
        <section id="analysis-panel" className="lg:col-span-2 fluid-card p-6 md:p-8 rounded-2xl flex flex-col justify-between space-y-6">
          {/* Header tabs to switch between Spread and Projections */}
          <div className="flex items-center justify-between border-b border-on-surface/10 pb-4">
            <div className="flex gap-2">
              <button
                onClick={() => setRightPanelTab('spread')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold tracking-wide transition-all uppercase cursor-pointer ${
                  rightPanelTab === 'spread'
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-on-surface/5'
                }`}
              >
                Brecha Cambiaria
              </button>
              <button
                onClick={() => setRightPanelTab('forecast')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold tracking-wide transition-all uppercase cursor-pointer ${
                  rightPanelTab === 'forecast'
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-on-surface/5'
                }`}
              >
                Proyecciones
              </button>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
              <Activity className="w-4 h-4 text-primary animate-pulse" />
            </div>
          </div>

          {rightPanelTab === 'spread' ? (
            <div className="space-y-5 flex-1 flex flex-col justify-between">
              {/* Spread calculations content */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-sans text-base font-bold text-on-surface dark:text-white">
                    Monitor de Diferencial (Spread)
                  </h4>
                  <p className="font-sans text-xs text-on-surface-variant/80">
                    Mide la diferencia porcentual entre referencias cambiarias de Venezuela.
                  </p>
                </div>

                <div className="h-2"></div>

                {/* Detail Box */}
                <div className="p-4 bg-surface-container-lowest/60 rounded-xl border border-on-surface/5 space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-on-surface-variant/80 uppercase font-bold tracking-wider">
                      {activeGapLabel}
                    </span>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${currentLevel.color}`}>
                      {currentLevel.label}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-3">
                    <span className="font-sans text-3xl font-extrabold text-on-surface dark:text-white tracking-tight">
                      {isEqualizedToBcv ? '0.00%' : `${activeGapPct >= 0 ? '+' : ''}${activeGapPct.toFixed(2)}%`}
                    </span>
                    <span className="font-mono text-xs text-on-surface-variant">
                      Diferencia: {isEqualizedToBcv ? '0.00' : `${activeGapDiff >= 0 ? '+' : ''}${activeGapDiff.toFixed(2)}`} VES
                    </span>
                  </div>

                  {/* Horizontal gauge bar */}
                  <div className="space-y-1.5">
                    <div className="w-full h-2 rounded-full bg-surface-container-low overflow-hidden relative border border-on-surface/5">
                      {/* Color zones: emerald (0-2), amber (2-6), rose (6-10) */}
                      <div className="absolute inset-0 flex">
                        <div className="w-[20%] h-full bg-success/20"></div>
                        <div className="w-[40%] h-full bg-warning/20"></div>
                        <div className="w-[40%] h-full bg-error/20"></div>
                      </div>
                      {/* Dynamic cursor */}
                      {!isEqualizedToBcv && (
                        <div 
                          className={`absolute top-0 bottom-0 w-3 rounded-full -translate-x-1/2 border border-white/40 shadow-sm ${currentLevel.barColor}`}
                          style={{ left: `${Math.min(Math.max((activeGapPct / SPREAD_MAX_SCALE) * 100, 4), 96)}%` }}
                        ></div>
                      )}
                      {isEqualizedToBcv && (
                        <div className="absolute top-0 bottom-0 left-0 w-3 rounded-full bg-emerald-500 border border-white/40 shadow-sm"></div>
                      )}
                    </div>
                    <div className="flex justify-between font-mono text-[8px] text-on-surface-variant/60 uppercase">
                      <span>0% Alineado</span>
                      <span>5% Promedio</span>
                      <span>10%+ Distorsión</span>
                    </div>
                  </div>

                  <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                    {currentLevel.desc}
                  </p>
                </div>
              </div>

              {/* Invoicing warning if equalized is active */}
              {isEqualizedToBcv ? (
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-[11px] text-primary space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 shrink-0" />
                    <span>Modo Tasa Única BCV Activo</span>
                  </div>
                  <p className="leading-relaxed opacity-90">
                    Las brechas del monitor se visualizan como 0.00% porque forzó a todas las referencias a igualar el valor BCV oficial.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-secondary/10 border border-secondary/20 rounded-xl text-[11px] text-secondary space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 shrink-0" />
                    <span>Recomendación de Operación</span>
                  </div>
                  <p className="leading-relaxed opacity-90">
                    Por ley en Venezuela, los cobros en comercios deben regirse estrictamente por la tasa oficial del BCV. El diferencial respecto a Binance representa la fluctuación del mercado cripto e informal.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Forecast panel with the exact same beautiful original forecast component structure! */
            <div className="space-y-4 flex-1 flex flex-col justify-end min-h-[300px] relative rounded-xl overflow-hidden p-6 group">
              <div className="absolute inset-0 z-0 transition-transform duration-[4000ms] group-hover:scale-110">
                <div 
                  className="w-full h-full bg-cover bg-center" 
                  style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBhtx1l3eE-MCiGv_fbacv5WIZcJQbdNM4G9GqFRDn5F4rCs-801bj6b1TOtM7RPl7QixrWL_ilSVZI1pETxs9qJlAmIcvTKBufFamaW8sJBFeZ3mfK9wUuciEWQEd5vWxdxoaM85esu8_32nkfx-R1ScHHys-lcFH8hPkrn0ml0FREAOnQFLSEZY777EJVnJkLeVwkU2qgRpaJIIEESsB2W0jhYUayUNGE3jVy7eCDM2U6xeq98BPQuw')" }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent"></div>
              </div>
              
              <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center gap-1.5 bg-tertiary/20 text-tertiary px-3.5 py-1 rounded-full border border-tertiary/30 backdrop-blur-md">
                  <TrendingUp className="w-3 h-3" />
                  <span className="font-mono text-[9px] uppercase font-bold tracking-wider">Tendencia Alcista</span>
                </div>
                
                <h4 className="font-sans text-lg font-bold text-on-surface dark:text-white">
                  Proyección Semanal
                </h4>
                
                <p className="font-sans text-xs text-on-surface-variant leading-relaxed opacity-95">
                  Se observa una volatilidad moderada en el par VES/USDT durante las últimas 72 horas debido a los ajustes de liquidez semanal. Se aconseja mantener activos sus avisos en tiempo real para capturar fluctuaciones.
                </p>

                <button 
                  onClick={onNavigateToAlerts}
                  className="text-xs font-semibold text-primary group-hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  Configurar alertas inteligentes &rarr;
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

    </div>
  );
});
