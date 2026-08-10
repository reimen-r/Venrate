import React, { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TopAppBar } from './components/TopAppBar';
import { BottomNavBar, TabType } from './components/BottomNavBar';
import { Background } from './components/Background';
import { ExchangeRate, PriceAlert, IntelligentAlerts } from './types';
import { Info, CheckCircle2, AlertTriangle, BellRing } from 'lucide-react';
import { sendNativeNotification, vibrateOnAlert, requestNotificationPermission } from './lib/notifications';
import { AUTO_REFRESH_INTERVAL, TOAST_DURATION, API_RETRY_ATTEMPTS, API_RETRY_DELAY } from './constants';

const DashboardTab = lazy(() => import('./components/DashboardTab').then(m => ({ default: m.DashboardTab })));
const HistoryTab = lazy(() => import('./components/HistoryTab').then(m => ({ default: m.HistoryTab })));
const AlertsTab = lazy(() => import('./components/AlertsTab').then(m => ({ default: m.AlertsTab })));
const SettingsTab = lazy(() => import('./components/SettingsTab').then(m => ({ default: m.SettingsTab })));

const INITIAL_RATES: ExchangeRate[] = [
  { id: 'bcvUsd', name: 'BCV USD', code: 'USD', rate: 685.94, change: 0.15, category: 'official', lastUpdated: 'En Vivo' },
  { id: 'bcvEur', name: 'BCV EUR', code: 'EUR', rate: 783.78, change: 0.22, category: 'official', lastUpdated: 'En Vivo' },
  { id: 'binanceP2p', name: 'Binance P2P', code: 'USDT', rate: 817.00, change: -0.05, category: 'crypto', lastUpdated: 'En Vivo' }
];

const INITIAL_ALERTS: PriceAlert[] = [
  { id: 'alert-1', currencyId: 'binanceP2p', currencyName: 'Binance P2P', condition: 'greater', targetValue: 820.00, createdDate: '12 Oct 2023' },
  { id: 'alert-2', currencyId: 'bcvUsd', currencyName: 'BCV', condition: 'less', targetValue: 680.00, createdDate: 'Ayer' }
];

const pageTransition = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.32, 0.72, 0, 1] } },
  exit: { opacity: 0, y: -12, scale: 0.99, transition: { duration: 0.22, ease: [0.32, 0.72, 0, 1] } },
};

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-64">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-cyan-400 animate-spin" />
      <span className="font-mono text-[10px] text-slate-600 animate-pulse">Cargando...</span>
    </div>
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [rates, setRates] = useState<ExchangeRate[]>(INITIAL_RATES);
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => {
    try {
      const saved = localStorage.getItem('venrate-alerts');
      return saved ? JSON.parse(saved) : INITIAL_ALERTS;
    } catch { return INITIAL_ALERTS; }
  });
  const [intelligentAlerts, setIntelligentAlerts] = useState<IntelligentAlerts>(() => {
    try {
      const saved = localStorage.getItem('venrate-intelligent-alerts');
      return saved ? JSON.parse(saved) : { fluctuations: true, dailySummary: true, bcvParallelGap: false };
    } catch { return { fluctuations: true, dailySummary: true, bcvParallelGap: false }; }
  });
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  const [isCompactView, setIsCompactView] = useState<boolean>(() => {
    const saved = localStorage.getItem('isCompactView');
    return saved ? JSON.parse(saved) : false;
  });

  const [isEqualizedToBcv, setIsEqualizedToBcv] = useState<boolean>(() => {
    const saved = localStorage.getItem('isEqualizedToBcv');
    return saved ? JSON.parse(saved) : false;
  });

  const [initialLoadComplete, setInitialLoadComplete] = useState<boolean>(false);
  const isInitialLoading = !initialLoadComplete && lastFetched === null && isFetching;
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

  const [toast, setToast] = useState<{
    visible: boolean; message: string; type: 'success' | 'info' | 'error' | 'alert_triggered';
  }>({ visible: false, message: '', type: 'success' });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) { root.classList.add('dark'); root.classList.remove('light'); }
    else { root.classList.add('light'); root.classList.remove('dark'); }
  }, [isDarkMode]);

  const triggerToast = useCallback((message: string, type: 'success' | 'info' | 'error' | 'alert_triggered') => {
    setToast({ visible: true, message, type });
  }, []);

  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => setToast(prev => ({ ...prev, visible: false })), TOAST_DURATION);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  const updateRatesFromApi = useCallback(async (showToast = false) => {
    setIsFetching(true);
    let attempts = API_RETRY_ATTEMPTS;
    let success = false;
    while (attempts > 0 && !success) {
      try {
        const res = await fetch('/api/rates');
        if (!res.ok) throw new Error('Error al conectar con el servidor');
        const data = await res.json();
        const mainData = data?.main;
        const bcvData = data?.bcv;
        const monitors = mainData?.monitors || {};
        const bcvMonitors = bcvData?.monitors || {};
        const bcvUsdPrice = bcvMonitors?.usd?.price || monitors?.bcv?.price || 685.94;
        const bcvUsdChange = bcvMonitors?.usd?.change ?? monitors?.bcv?.change ?? 0;
        const bcvEurPrice = bcvMonitors?.eur?.price || 783.78;
        const bcvEurChange = bcvMonitors?.eur?.change ?? 0;
        const binancePrice = monitors?.binance?.price || monitors?.binance_p2p?.price || 817.00;
        const binanceChange = monitors?.binance?.change ?? monitors?.binance_p2p?.change ?? 0;

        setRates(prev => prev.map(item => {
          if (item.id === 'bcvUsd') return { ...item, rate: bcvUsdPrice, change: bcvUsdChange, lastUpdated: 'En Vivo' };
          if (item.id === 'bcvEur') return { ...item, rate: bcvEurPrice, change: bcvEurChange, lastUpdated: 'En Vivo' };
          if (item.id === 'binanceP2p') return { ...item, rate: binancePrice, change: binanceChange, lastUpdated: 'En Vivo' };
          return item;
        }));

        setLastFetched(new Date());
        setInitialLoadComplete(true);
        if (showToast) triggerToast('Tasas de cambio actualizadas en tiempo real', 'success');
        success = true;
      } catch (err: any) {
        attempts--;
        if (attempts > 0) await new Promise(r => setTimeout(r, API_RETRY_DELAY));
      }
    }
    if (!success && showToast) triggerToast('Error al actualizar tasas. Inténtelo más tarde.', 'error');
    setIsFetching(false);
  }, [triggerToast]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  useEffect(() => { try { localStorage.setItem('venrate-alerts', JSON.stringify(alerts)); } catch {} }, [alerts]);
  useEffect(() => { try { localStorage.setItem('venrate-intelligent-alerts', JSON.stringify(intelligentAlerts)); } catch {} }, [intelligentAlerts]);

  useEffect(() => {
    updateRatesFromApi();
    requestNotificationPermission();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && !isOffline) updateRatesFromApi();
    }, AUTO_REFRESH_INTERVAL);
    const handleVisibilityChange = () => { if (document.visibilityState === 'visible') updateRatesFromApi(); };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', handleVisibilityChange); };
  }, [updateRatesFromApi, isOffline]);

  // Alert tracking
  const prevRatesRef = useRef<ExchangeRate[]>(rates);
  useEffect(() => {
    const oldRates = prevRatesRef.current;
    if (oldRates && oldRates !== rates) {
      alerts.forEach(alert => {
        const oldItem = oldRates.find(r => r.id === alert.currencyId);
        const newItem = rates.find(r => r.id === alert.currencyId);
        if (oldItem && newItem && oldItem.rate !== newItem.rate) {
          const triggered =
            (alert.condition === 'greater' && newItem.rate > alert.targetValue) ||
            (alert.condition === 'less' && newItem.rate < alert.targetValue) ||
            (alert.condition === 'equal' && newItem.rate === alert.targetValue);
          const wasAlready =
            (alert.condition === 'greater' && oldItem.rate > alert.targetValue) ||
            (alert.condition === 'less' && oldItem.rate < alert.targetValue) ||
            (alert.condition === 'equal' && oldItem.rate === alert.targetValue);
          if (triggered && !wasAlready) {
            const symbol = alert.condition === 'greater' ? '>' : alert.condition === 'less' ? '<' : '=';
            const msg = `¡Alerta Disparada! ${alert.currencyName} alcanzó ${newItem.rate.toFixed(2)} VES (Límite: ${symbol} ${alert.targetValue.toFixed(2)})`;
            triggerToast(msg, 'alert_triggered');
            sendNativeNotification('VeneRate - Alerta de Precio', msg);
            vibrateOnAlert();
          }
        }
      });
    }
    prevRatesRef.current = rates;
  }, [rates, alerts, triggerToast]);

  const handleAddAlert = useCallback((currencyId: string, currencyName: string, condition: 'greater' | 'less' | 'equal', targetValue: number) => {
    const newAlert: PriceAlert = { id: `alert-${Date.now()}`, currencyId, currencyName, condition, targetValue, createdDate: 'Hoy' };
    setAlerts(prev => [newAlert, ...prev]);
    triggerToast(`Alerta para ${currencyName} creada con éxito a ${targetValue.toFixed(2)} VES`, 'success');
  }, [triggerToast]);

  const handleDeleteAlert = useCallback((id: string) => {
    const alertToDelete = alerts.find(a => a.id === id);
    setAlerts(prev => prev.filter(a => a.id !== id));
    if (alertToDelete) triggerToast(`Alerta para ${alertToDelete.currencyName} eliminada`, 'info');
  }, [alerts, triggerToast]);

  const handleToggleIntelligentAlert = useCallback((key: keyof IntelligentAlerts) => {
    setIntelligentAlerts(prev => {
      triggerToast(`Preferencia de alerta inteligente modificada`, 'success');
      return { ...prev, [key]: !prev[key] };
    });
  }, [triggerToast]);

  const handleToggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => {
      triggerToast(`Modo ${!prev ? 'Oscuro' : 'Claro'} activado`, 'info');
      return !prev;
    });
  }, [triggerToast]);

  const handleToggleCompactView = useCallback(() => {
    setIsCompactView(prev => {
      const newVal = !prev;
      localStorage.setItem('isCompactView', JSON.stringify(newVal));
      triggerToast(`Vista compacta ${newVal ? 'activada' : 'desactivada'}`, 'success');
      return newVal;
    });
  }, [triggerToast]);

  const handleToggleEqualizedToBcv = useCallback(() => {
    setIsEqualizedToBcv(prev => {
      const newVal = !prev;
      localStorage.setItem('isEqualizedToBcv', JSON.stringify(newVal));
      triggerToast(newVal ? 'Tasas igualadas al BCV' : 'Tasas diferenciadas restauradas', 'success');
      return newVal;
    });
  }, [triggerToast]);

  const handleResetApp = useCallback(() => {
    setAlerts(INITIAL_ALERTS);
    setIntelligentAlerts({ fluctuations: true, dailySummary: true, bcvParallelGap: false });
    updateRatesFromApi(true);
    triggerToast('Configuración reiniciada y tasas sincronizadas', 'success');
  }, [updateRatesFromApi, triggerToast]);

  const handleShareApp = useCallback(() => {
    if (navigator.share) {
      navigator.share({ title: 'VeneRate - Monitor de Divisas', text: 'Sigue el tipo de cambio oficial del BCV y Binance P2P en tiempo real. Calculadora, alertas y spread cambiario.', url: window.location.href })
        .catch(() => triggerToast('Enlace copiado al portapapeles', 'success'));
    } else {
      navigator.clipboard.writeText(window.location.href);
      triggerToast('Enlace copiado al portapapeles', 'success');
    }
  }, [triggerToast]);

  const displayedRates = useMemo(() => {
    return isEqualizedToBcv
      ? rates.map(r => r.id === 'binanceP2p' ? { ...r, rate: rates.find(x => x.id === 'bcvUsd')?.rate || r.rate, change: 0, lastUpdated: 'Igualado al BCV' } : r)
      : rates;
  }, [rates, isEqualizedToBcv]);

  return (
    <div className="min-h-screen bg-background text-on-surface transition-colors pb-28 relative">
      <Background />

      <TopAppBar onShare={handleShareApp} isFetching={isFetching} onRefresh={() => updateRatesFromApi(true)} lastFetched={lastFetched} />

      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="fixed top-16 left-0 right-0 z-40"
          >
            <div className="mx-auto max-w-7xl px-5 py-2 flex items-center justify-center gap-2 bg-warning/10 border-b border-warning/20 backdrop-blur-xl">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" style={{ boxShadow: '0 0 10px rgba(251,191,36,0.5)' }} />
              <span className="font-sans text-[11px] font-semibold text-warning/90">Sin conexión — datos pueden estar desactualizados</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="pt-24 px-5 w-full max-w-7xl mx-auto min-h-[calc(100vh-16rem)]">
        <AnimatePresence mode="wait">
          <Suspense fallback={<LoadingFallback />}>
            <motion.div key={activeTab} {...pageTransition}>
              {activeTab === 'dashboard' && (
                <DashboardTab rates={displayedRates} onTriggerToast={triggerToast} onNavigateToAlerts={() => setActiveTab('alerts')}
                  isFetching={isFetching} onRefresh={() => updateRatesFromApi(true)} lastFetched={lastFetched}
                  isCompactView={isCompactView} isEqualizedToBcv={isEqualizedToBcv} isInitialLoading={isInitialLoading} isOffline={isOffline} />
              )}
              {activeTab === 'history' && (
                <HistoryTab onTriggerToast={triggerToast} rates={displayedRates} isEqualizedToBcv={isEqualizedToBcv} />
              )}
              {activeTab === 'alerts' && (
                <AlertsTab alerts={alerts} onAddAlert={handleAddAlert} onDeleteAlert={handleDeleteAlert}
                  intelligentAlerts={intelligentAlerts} onToggleIntelligentAlert={handleToggleIntelligentAlert} onTriggerToast={triggerToast} />
              )}
              {activeTab === 'settings' && (
                <SettingsTab isDarkMode={isDarkMode} onToggleDarkMode={handleToggleDarkMode}
                  isCompactView={isCompactView} onToggleCompactView={handleToggleCompactView}
                  isEqualizedToBcv={isEqualizedToBcv} onToggleEqualizedToBcv={handleToggleEqualizedToBcv}
                  rates={displayedRates} onTriggerToast={triggerToast} onResetApp={handleResetApp} />
              )}
            </motion.div>
          </Suspense>
        </AnimatePresence>
      </main>

      <BottomNavBar activeTab={activeTab} onChangeTab={setActiveTab} alertsCount={alerts.length} />

      <AnimatePresence>
        {toast.visible && (
          <motion.div
            id="system-toast"
            role="alert" aria-live="polite"
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 25, mass: 0.6 } }}
            exit={{ opacity: 0, y: 20, scale: 0.92, transition: { duration: 0.2 } }}
            onClick={() => setToast(prev => ({ ...prev, visible: false }))}
            className={`fixed bottom-28 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl border cursor-pointer select-none max-w-md w-[calc(100%-2rem)] backdrop-blur-xl relative overflow-hidden ${
              toast.type === 'success' ? 'glass-strong border-success/25 text-success shadow-[0_0_24px_rgba(52,211,153,0.1)]' :
              toast.type === 'error' ? 'glass-strong border-tertiary/25 text-tertiary shadow-[0_0_24px_rgba(236,72,153,0.1)]' :
              toast.type === 'alert_triggered' ? 'glass-strong border-tertiary/30 text-tertiary shadow-[0_0_32px_rgba(236,72,153,0.2)]' :
              'glass-strong border-white/[0.08] text-on-surface'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0 text-success" />}
            {toast.type === 'error' && <AlertTriangle className="w-5 h-5 shrink-0 text-tertiary" />}
            {toast.type === 'alert_triggered' && (
              <motion.span
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 0.5, ease: 'easeInOut' }}
              >
                <BellRing className="w-6 h-6 shrink-0 text-tertiary" />
              </motion.span>
            )}
            {toast.type === 'info' && <Info className="w-5 h-5 shrink-0 text-primary" />}
            <span className="font-sans text-xs font-semibold leading-tight">{toast.message}</span>

            <motion.div
              className="absolute bottom-0 left-0 h-1 rounded-r-full bg-current opacity-30"
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: TOAST_DURATION / 1000, ease: 'linear' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
