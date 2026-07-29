import React, { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
import { TopAppBar } from './components/TopAppBar';
import { BottomNavBar, TabType } from './components/BottomNavBar';
import { ExchangeRate, PriceAlert, IntelligentAlerts } from './types';
import { Info, CheckCircle2, AlertTriangle, BellRing } from 'lucide-react';
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

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [rates, setRates] = useState<ExchangeRate[]>(INITIAL_RATES);
  const [alerts, setAlerts] = useState<PriceAlert[]>(INITIAL_ALERTS);
  const [intelligentAlerts, setIntelligentAlerts] = useState<IntelligentAlerts>({
    fluctuations: true,
    dailySummary: true,
    bcvParallelGap: false
  });
  
  // Real live API states
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  
  // Dark mode active by default
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Compact view state for mobile screens
  const [isCompactView, setIsCompactView] = useState<boolean>(() => {
    const saved = localStorage.getItem('isCompactView');
    return saved ? JSON.parse(saved) : false;
  });

  // Equalize rates to BCV state
  const [isEqualizedToBcv, setIsEqualizedToBcv] = useState<boolean>(() => {
    const saved = localStorage.getItem('isEqualizedToBcv');
    return saved ? JSON.parse(saved) : false;
  });

  // Track initial load for skeleton display
  const [initialLoadComplete, setInitialLoadComplete] = useState<boolean>(false);
  const isInitialLoading = !initialLoadComplete && lastFetched === null && isFetching;

  // Offline state detection
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

  // Toast notifications state
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'info' | 'error' | 'alert_triggered';
  }>({
    visible: false,
    message: '',
    type: 'success'
  });

  // Handle setting active/inactive classes on documentElement for Dark Mode
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Toast feedback trigger helper
  const triggerToast = useCallback((message: string, type: 'success' | 'info' | 'error' | 'alert_triggered') => {
    setToast({
      visible: true,
      message,
      type
    });
  }, []);

  // Toast self-dismiss timer
  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, visible: false }));
      }, TOAST_DURATION);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  // Real live API update function with automatic retries
  const updateRatesFromApi = useCallback(async (showToast = false) => {
    setIsFetching(true);
    let attempts = API_RETRY_ATTEMPTS;
    let success = false;
    let lastError: any = null;

    while (attempts > 0 && !success) {
      try {
        // Fetch combined rates from our backend proxy to avoid client CORS failures
        const res = await fetch('/api/rates');
        if (!res.ok) throw new Error('Error al conectar con el servidor de tasas');
        const data = await res.json();
        
        const mainData = data?.main;
        const bcvData = data?.bcv;
        
        const monitors = mainData?.monitors || {};
        const bcvMonitors = bcvData?.monitors || {};
        
        // Extract bcv usd
        const bcvUsdPrice = bcvMonitors?.usd?.price || monitors?.bcv?.price || 674.93;
        const bcvUsdChange = bcvMonitors?.usd?.change ?? monitors?.bcv?.change ?? 0;
        
        // Extract bcv eur
        const bcvEurPrice = bcvMonitors?.eur?.price || 770.68;
        const bcvEurChange = bcvMonitors?.eur?.change ?? 0;
        
        // Extract binance
        const binancePrice = monitors?.binance?.price || monitors?.binance_p2p?.price || monitors?.criptobuy?.price || 776.00;
        const binanceChange = monitors?.binance?.change ?? monitors?.binance_p2p?.change ?? monitors?.criptobuy?.change ?? 0;
        
        // Update rates state with actual values
        setRates(prevRates => {
          return prevRates.map(item => {
            if (item.id === 'bcvUsd') {
              return { ...item, rate: bcvUsdPrice, change: bcvUsdChange, lastUpdated: 'En Vivo' };
            }
            if (item.id === 'bcvEur') {
              return { ...item, rate: bcvEurPrice, change: bcvEurChange, lastUpdated: 'En Vivo' };
            }
            if (item.id === 'binanceP2p') {
              return { ...item, rate: binancePrice, change: binanceChange, lastUpdated: 'En Vivo' };
            }
            return item;
          });
        });
        
        setLastFetched(new Date());
        setInitialLoadComplete(true);
        if (showToast) {
          triggerToast('Tasas de cambio actualizadas en tiempo real', 'success');
        }
        success = true;
      } catch (err: any) {
        lastError = err;
        attempts--;
        if (attempts > 0) {
          // Wait 1.5 seconds before retrying
          await new Promise(resolve => setTimeout(resolve, API_RETRY_DELAY));
        }
      }
    }

    if (!success) {
      console.error('Error fetching real rates after 3 attempts:', lastError);
      if (showToast) {
        triggerToast('Error al actualizar tasas en vivo. Inténtelo más tarde.', 'error');
      }
    }
    setIsFetching(false);
  }, [triggerToast]);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Setup smart, visibility-aware auto-update intervals for Real API
  useEffect(() => {
    // Initial fetch on application start
    updateRatesFromApi();
    
    // Auto-update every 60 seconds (1 minute) but only if the tab is visible to the user!
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && !isOffline) {
        updateRatesFromApi();
      }
    }, AUTO_REFRESH_INTERVAL);

    // Fetch immediately when the tab becomes active/visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateRatesFromApi();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [updateRatesFromApi, isOffline]);

  // Alert tracking logic whenever rates update
  const prevRatesRef = useRef<ExchangeRate[]>(rates);
  useEffect(() => {
    const oldRates = prevRatesRef.current;
    if (oldRates && oldRates !== rates) {
      alerts.forEach(alert => {
        const oldItem = oldRates.find(r => r.id === alert.currencyId);
        const newItem = rates.find(r => r.id === alert.currencyId);
        if (oldItem && newItem && oldItem.rate !== newItem.rate) {
          const oldRate = oldItem.rate;
          const newRate = newItem.rate;
          
          const triggered = 
            (alert.condition === 'greater' && newRate > alert.targetValue) ||
            (alert.condition === 'less' && newRate < alert.targetValue) ||
            (alert.condition === 'equal' && newRate === alert.targetValue);

          const wasAlreadyTriggered = 
            (alert.condition === 'greater' && oldRate > alert.targetValue) ||
            (alert.condition === 'less' && oldRate < alert.targetValue) ||
            (alert.condition === 'equal' && oldRate === alert.targetValue);

          if (triggered && !wasAlreadyTriggered) {
            const symbol = alert.condition === 'greater' ? '>' : alert.condition === 'less' ? '<' : '=';
            triggerToast(
              `🔔 ¡Alerta Disparada! ${alert.currencyName} alcanzó ${newRate.toFixed(2)} VES (Límite: ${symbol} ${alert.targetValue.toFixed(2)})`,
              'alert_triggered'
            );
          }
        }
      });
    }
    prevRatesRef.current = rates;
  }, [rates, alerts]);

  // Alert actions
  const handleAddAlert = useCallback((
    currencyId: string, 
    currencyName: string, 
    condition: 'greater' | 'less' | 'equal', 
    targetValue: number
  ) => {
    const newAlert: PriceAlert = {
      id: `alert-${Date.now()}`,
      currencyId,
      currencyName,
      condition,
      targetValue,
      createdDate: 'Hoy'
    };

    setAlerts(prev => [newAlert, ...prev]);
    triggerToast(`Alerta para ${currencyName} creada con éxito a ${targetValue.toFixed(2)} VES`, 'success');
  }, [triggerToast]);

  const handleDeleteAlert = useCallback((id: string) => {
    const alertToDelete = alerts.find(a => a.id === id);
    setAlerts(prev => prev.filter(alert => alert.id !== id));
    if (alertToDelete) {
      triggerToast(`Alerta para ${alertToDelete.currencyName} eliminada`, 'info');
    }
  }, [alerts, triggerToast]);

  const handleToggleIntelligentAlert = useCallback((key: keyof IntelligentAlerts) => {
    setIntelligentAlerts(prev => {
      const newVal = !prev[key];
      triggerToast(`Preferencia de alerta inteligente modificada`, 'success');
      return {
        ...prev,
        [key]: newVal
      };
    });
  }, [triggerToast]);

  const handleToggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => {
      const nextMode = !prev;
      triggerToast(`Modo ${nextMode ? 'Oscuro' : 'Claro'} activado`, 'info');
      return nextMode;
    });
  }, [triggerToast]);

  const handleToggleCompactView = useCallback(() => {
    setIsCompactView(prev => {
      const newVal = !prev;
      localStorage.setItem('isCompactView', JSON.stringify(newVal));
      triggerToast(`Vista compacta para móviles ${newVal ? 'activada' : 'desactivada'}`, 'success');
      return newVal;
    });
  }, [triggerToast]);

  const handleToggleEqualizedToBcv = useCallback(() => {
    setIsEqualizedToBcv(prev => {
      const newVal = !prev;
      localStorage.setItem('isEqualizedToBcv', JSON.stringify(newVal));
      triggerToast(
        newVal 
          ? 'Tasas de USD igualadas al valor de referencia del BCV' 
          : 'Tasas de cambio diferenciadas y en tiempo real restauradas', 
        'success'
      );
      return newVal;
    });
  }, [triggerToast]);

  const handleResetApp = useCallback(() => {
    setAlerts(INITIAL_ALERTS);
    setIntelligentAlerts({
      fluctuations: true,
      dailySummary: true,
      bcvParallelGap: false
    });
    updateRatesFromApi(true);
    triggerToast('Configuración del sistema reiniciada y tasas sincronizadas', 'success');
  }, [updateRatesFromApi, triggerToast]);

  const handleShareApp = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: 'VeneRate - Monitor de Divisas',
        text: 'Sigue el tipo de cambio oficial del BCV y Binance P2P en tiempo real. Configura alertas y calculadoras gratis.',
        url: window.location.href,
      }).catch(() => {
        triggerToast('Enlace de VeneRate copiado al portapapeles', 'success');
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      triggerToast('Enlace de VeneRate copiado al portapapeles', 'success');
    }
  }, [triggerToast]);

  const displayedRates = useMemo(() => {
    return isEqualizedToBcv
      ? rates.map(r => {
          if (r.id === 'binanceP2p') {
            const bcvUsdRate = rates.find(x => x.id === 'bcvUsd')?.rate || r.rate;
            return { ...r, rate: bcvUsdRate, change: 0, lastUpdated: 'Igualado al BCV' };
          }
          return r;
        })
      : rates;
  }, [rates, isEqualizedToBcv]);

  return (
    <div className="min-h-screen bg-background text-on-surface dark:bg-background transition-colors pb-32">
      {/* Top Application Bar */}
      <TopAppBar 
        onShare={handleShareApp} 
        isFetching={isFetching}
        onRefresh={() => updateRatesFromApi(true)}
        lastFetched={lastFetched}
      />

      {/* Offline banner */}
      {isOffline && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-warning/15 border-b border-warning/30 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-center gap-2 text-warning">
            <span className="w-2 h-2 rounded-full bg-warning animate-pulse shadow-[0_0_8px_rgba(255,184,0,0.5)]" />
            <span className="font-sans text-xs font-semibold">Sin conexión a internet — los datos pueden estar desactualizados</span>
          </div>
        </div>
      )}

      {/* Main Content View Port */}
      <main className="pt-24 px-6 w-full max-w-7xl mx-auto min-h-[calc(100vh-16rem)]">
        <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div></div>}>
          {activeTab === 'dashboard' && (
            <DashboardTab 
              rates={displayedRates} 
              onTriggerToast={triggerToast} 
              onNavigateToAlerts={() => setActiveTab('alerts')}
              isFetching={isFetching}
              onRefresh={() => updateRatesFromApi(true)}
              lastFetched={lastFetched}
              isCompactView={isCompactView}
              isEqualizedToBcv={isEqualizedToBcv}
              isInitialLoading={isInitialLoading}
              isOffline={isOffline}
            />
          )}
          
          {activeTab === 'history' && (
            <HistoryTab 
              onTriggerToast={triggerToast} 
              rates={displayedRates}
              isEqualizedToBcv={isEqualizedToBcv}
            />
          )}
          
          {activeTab === 'alerts' && (
            <AlertsTab 
              alerts={alerts}
              onAddAlert={handleAddAlert}
              onDeleteAlert={handleDeleteAlert}
              intelligentAlerts={intelligentAlerts}
              onToggleIntelligentAlert={handleToggleIntelligentAlert}
              onTriggerToast={triggerToast}
            />
          )}
          
          {activeTab === 'settings' && (
            <SettingsTab 
              isDarkMode={isDarkMode}
              onToggleDarkMode={handleToggleDarkMode}
              isCompactView={isCompactView}
              onToggleCompactView={handleToggleCompactView}
              isEqualizedToBcv={isEqualizedToBcv}
              onToggleEqualizedToBcv={handleToggleEqualizedToBcv}
              rates={displayedRates}
              onTriggerToast={triggerToast}
              onResetApp={handleResetApp}
            />
          )}
        </Suspense>
      </main>

      {/* Bottom Navigation System */}
      <BottomNavBar 
        activeTab={activeTab} 
        onChangeTab={setActiveTab} 
        alertsCount={alerts.length}
      />

      {/* Interactive Responsive Toast System */}
      {toast.visible && (
        <div 
          id="system-toast-alert"
          role="alert"
          aria-live="polite"
          onClick={() => setToast(prev => ({ ...prev, visible: false }))}
          className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-4 rounded-xl border shadow-2xl cursor-pointer select-none max-w-md w-[calc(100%-2rem)] animate-fade-in transition-all ${
            toast.type === 'success'
              ? 'bg-success/15 border-success/30 text-success shadow-[0_0_20px_rgba(0,255,136,0.1)]'
              : toast.type === 'error'
                ? 'bg-error/15 border-error/30 text-error shadow-[0_0_20px_rgba(255,51,102,0.1)]'
                : toast.type === 'alert_triggered'
                  ? 'bg-tertiary/15 border-tertiary/30 text-tertiary shadow-[0_0_24px_rgba(255,0,229,0.15)] animate-pulse'
                  : 'bg-surface-bright/90 dark:bg-surface-container-high/90 border-on-surface/10 text-on-surface'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0" />}
          {toast.type === 'error' && <AlertTriangle className="w-5 h-5 shrink-0" />}
          {toast.type === 'alert_triggered' && <BellRing className="w-5 h-5 shrink-0 animate-bounce" />}
          {toast.type === 'info' && <Info className="w-5 h-5 shrink-0" />}

          <span className="font-sans text-xs md:text-sm font-medium leading-tight">
            {toast.message}
          </span>
        </div>
      )}
    </div>
  );
}
