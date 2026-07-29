import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Moon, Sun, ChevronRight, CloudLightning, LayoutGrid, LogOut, RefreshCw, Smartphone, Scale, Coins } from 'lucide-react';
import { ExchangeRate } from '../types';

interface SettingsTabProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isCompactView: boolean;
  onToggleCompactView: () => void;
  isEqualizedToBcv: boolean;
  onToggleEqualizedToBcv: () => void;
  rates: ExchangeRate[];
  onTriggerToast: (message: string, type: 'success' | 'info' | 'error') => void;
  onResetApp: () => void;
}

export const SettingsTab = React.memo<SettingsTabProps>(({
  isDarkMode,
  onToggleDarkMode,
  isCompactView,
  onToggleCompactView,
  isEqualizedToBcv,
  onToggleEqualizedToBcv,
  rates,
  onTriggerToast,
  onResetApp,
}) => {
  const [syncTime, setSyncTime] = useState<string>('Hace 2 minutos');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [selectedWidgetRates, setSelectedWidgetRates] = useState<string[]>(['bcvUsd', 'bcvEur', 'binanceP2p']);
  const [showPersonalizeModal, setShowPersonalizeModal] = useState<boolean>(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Focus trap for modal
  useEffect(() => {
    if (showPersonalizeModal) {
      closeBtnRef.current?.focus();
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setShowPersonalizeModal(false);
        if (e.key === 'Tab' && modalRef.current) {
          const focusable = modalRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showPersonalizeModal]);

  const handleManualSync = () => {
    setIsSyncing(true);
    onTriggerToast('Estableciendo conexión segura con VeneRate Cloud...', 'info');
    
    setTimeout(() => {
      setSyncTime('Hace un momento');
      setIsSyncing(false);
      onTriggerToast('Sincronización de alertas completada con éxito', 'success');
    }, 1500);
  };

  const handleToggleWidgetRate = (rateId: string) => {
    if (selectedWidgetRates.includes(rateId)) {
      if (selectedWidgetRates.length <= 1) {
        onTriggerToast('Debes mantener al menos una tasa de referencia en pantalla', 'error');
        return;
      }
      setSelectedWidgetRates(prev => prev.filter(id => id !== rateId));
    } else {
      setSelectedWidgetRates(prev => [...prev, rateId]);
    }
    onTriggerToast('Configuración de visualización modificada', 'success');
  };

  const handleProfileClick = () => {
    onTriggerToast('VeneRate Premium Activo: Licencia Enterprise concedida', 'success');
  };

  return (
    <div id="settings-tab" className="space-y-10 animate-fade-in relative">
      {/* Settings Header */}
      <header className="space-y-2">
        <h2 className="font-sans text-3xl font-bold text-on-surface dark:text-white tracking-tight">
          Settings
        </h2>
        <p className="font-sans text-sm text-on-surface-variant opacity-95">
          Manage your currency tracking experience
        </p>
      </header>

      {/* Bento Layout Settings */}
      <div className="space-y-6">
        
        {/* Dark Mode Toggle Section */}
        <section 
          onClick={onToggleDarkMode}
          className="fluid-card rounded-2xl p-6 flex items-center justify-between transition-all duration-200 active:scale-[0.99] hover:bg-white/5 cursor-pointer select-none"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center text-primary shadow-[0_0_16px_rgba(0,217,255,0.12)] border border-primary/30">
              {isDarkMode ? <Moon className="w-5 h-5 fill-current" /> : <Sun className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-sans text-base font-bold text-on-surface dark:text-white">
                Dark Mode
              </h3>
              <p className="font-sans text-xs text-on-surface-variant/80">
                {isDarkMode ? 'Enhanced night visibility active' : 'Light themes enabled'}
              </p>
            </div>
          </div>
          
          {/* Custom Switch toggle visual with neon gradient */}
          <button 
            id="toggle-dark-mode-switch"
            onClick={(e) => {
              e.stopPropagation();
              onToggleDarkMode();
            }}
            className={`w-12 h-6 rounded-full relative flex items-center px-0.5 transition-all duration-300 outline-none cursor-pointer group ${
              isDarkMode 
                ? 'bg-gradient-to-r from-primary via-secondary to-tertiary shadow-[0_0_12px_rgba(0,217,255,0.3)]' 
                : 'bg-on-surface/10 dark:bg-white/10'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow-lg transition-all duration-300 transform group-hover:scale-110 ${
              isDarkMode ? 'translate-x-6' : 'translate-x-0'
            }`}></div>
          </button>
        </section>
        
        {/* Compact View Toggle Section */}
        <section 
          id="toggle-compact-view"
          onClick={onToggleCompactView}
          className="fluid-card rounded-2xl p-6 flex items-center justify-between transition-all duration-200 active:scale-[0.99] hover:bg-white/5 cursor-pointer select-none"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shadow-inner border border-secondary/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-sans text-base font-bold text-on-surface dark:text-white">
                Compact List View
              </h3>
              <p className="font-sans text-xs text-on-surface-variant/80">
                {isCompactView ? 'Compact list layout for small screens active' : 'Detailed cards layout active on small screens'}
              </p>
            </div>
          </div>
          
          {/* Custom Switch toggle visual */}
          <button 
            id="toggle-compact-view-switch"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCompactView();
            }}
            className={`w-12 h-6 rounded-full relative flex items-center px-0.5 transition-all duration-300 outline-none cursor-pointer group ${
              isCompactView 
                ? 'bg-gradient-to-r from-secondary to-primary shadow-[0_0_12px_rgba(139,92,246,0.3)]' 
                : 'bg-on-surface/10 dark:bg-white/10'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow-lg transition-all duration-300 transform group-hover:scale-110 ${
              isCompactView ? 'translate-x-6' : 'translate-x-0'
            }`}></div>
          </button>
        </section>
        
        {/* Equalize to BCV Toggle Section */}
        <section 
          id="toggle-equalize-bcv"
          onClick={onToggleEqualizedToBcv}
          className="fluid-card rounded-2xl p-6 flex items-center justify-between transition-all duration-200 active:scale-[0.99] hover:bg-white/5 cursor-pointer select-none"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-sans text-base font-bold text-on-surface dark:text-white">
                Igualar Tasas al BCV
              </h3>
              <p className="font-sans text-xs text-on-surface-variant/80">
                {isEqualizedToBcv ? 'Todas las tasas de cambio de USD están igualadas a la tasa oficial BCV' : 'Tasas de cambio diferenciadas (BCV, Binance P2P)'}
              </p>
            </div>
          </div>
          
          {/* Custom Switch toggle visual */}
          <button 
            id="toggle-equalize-bcv-switch"
            onClick={(e) => {
              e.stopPropagation();
              onToggleEqualizedToBcv();
            }}
            className={`w-12 h-6 rounded-full relative flex items-center px-0.5 transition-all duration-300 outline-none cursor-pointer group ${
              isEqualizedToBcv 
                ? 'bg-gradient-to-r from-success to-primary shadow-[0_0_12px_rgba(0,255,136,0.3)]' 
                : 'bg-on-surface/10 dark:bg-white/10'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow-lg transition-all duration-300 transform group-hover:scale-110 ${
              isEqualizedToBcv ? 'translate-x-6' : 'translate-x-0'
            }`}></div>
          </button>
        </section>

        {/* Settings List Container */}
        <div className="fluid-card rounded-2xl overflow-hidden divide-y divide-on-surface/5">
          
          {/* Account Profile button */}
          <button
            id="btn-settings-profile"
            onClick={handleProfileClick}
            className="w-full p-6 flex items-center justify-between hover:bg-white/5 dark:hover:bg-white/[0.03] transition-all group cursor-pointer text-left outline-none"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 shadow-lg shrink-0">
                <img 
                  alt="Avatar de perfil"
                  loading="lazy"
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAXoIac5JUko8NRGdL6exVbiUpTDnAKR8Vui3KWkmlQZGwesXEJXeDd5bR_N0438hwBwqruPl7ymOxSxi9hgRfdICWGimmmTCvSNcaiKxl7ARtrbV8P2RI6hZXbi-Tfnrllbq4vQM2ErRMA3speoJtJ8vxPPaGcnFx18AeUpGHiKTNHzF-dNcnb4nVa8VQEJZiCdDpYN8urzJSTRUxht_PJFnT2Y___W_niacu1TQthNzS8y7n_nz4Ngg"
                />
              </div>
              <div>
                <h3 className="font-sans text-sm font-bold text-on-surface dark:text-white">
                  Account Profile
                </h3>
                <p className="font-mono text-[10px] text-on-surface-variant/80">
                  Premium Member • ID: 8824
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-outline group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Cloud Sync button */}
          <button
            id="btn-settings-sync"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="w-full p-6 flex items-center justify-between hover:bg-white/5 dark:hover:bg-white/[0.03] transition-all group cursor-pointer text-left outline-none"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-secondary border border-on-surface/5 shrink-0 shadow-inner">
                <CloudLightning className={`w-5 h-5 ${isSyncing ? 'animate-spin text-primary' : ''}`} />
              </div>
              <div>
                <h3 className="font-sans text-sm font-bold text-on-surface dark:text-white">
                  Cloud Sync
                </h3>
                <p className="font-mono text-[10px] text-on-surface-variant/80">
                  Last synced: {syncTime}
                </p>
              </div>
            </div>
            
            {isSyncing ? (
              <RefreshCw className="w-4 h-4 text-primary animate-spin" />
            ) : (
              <ChevronRight className="w-4 h-4 text-outline group-hover:translate-x-1 transition-transform" />
            )}
          </button>

          {/* Widget Personalization button */}
          <button
            id="btn-settings-widgets"
            onClick={() => setShowPersonalizeModal(true)}
            className="w-full p-6 flex items-center justify-between hover:bg-white/5 dark:hover:bg-white/[0.03] transition-all group cursor-pointer text-left outline-none"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-tertiary border border-on-surface/5 shrink-0 shadow-inner">
                <LayoutGrid className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-sans text-sm font-bold text-on-surface dark:text-white">
                  Widget Personalization
                </h3>
                <p className="font-mono text-[10px] text-on-surface-variant/80">
                  Customize home screen references
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-outline group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Modal Overlay for Widget Personalization */}
        {showPersonalizeModal && (
          <div role="dialog" aria-modal="true" aria-label="Personalizar referencias" className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-fade-in">
            <div ref={modalRef} className="fluid-card rounded-2xl max-w-sm w-full p-6 space-y-6 relative border border-primary/20 shadow-2xl">
              <div className="space-y-1">
                <h4 className="font-sans text-base font-bold text-on-surface dark:text-white">
                  Personalizar Referencias
                </h4>
                <p className="font-sans text-xs text-on-surface-variant/80">
                  Elige las tasas a mostrar en la calculadora y dashboard
                </p>
              </div>

              <div className="space-y-3">
                {rates.map(rate => {
                  const isChecked = selectedWidgetRates.includes(rate.id);
                  return (
                    <div 
                      key={rate.id}
                      onClick={() => handleToggleWidgetRate(rate.id)}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer border border-on-surface/5 select-none"
                    >
                      <span className="font-sans text-xs font-semibold text-on-surface dark:text-white">
                        {rate.name} ({rate.code})
                      </span>
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                        isChecked 
                          ? 'bg-primary border-primary text-on-primary' 
                          : 'border-outline-variant'
                      }`}>
                        {isChecked && <span className="font-bold text-[10px]">&#10003;</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                ref={closeBtnRef}
                id="btn-close-personalization"
                onClick={() => setShowPersonalizeModal(false)}
                className="w-full py-3 bg-primary text-on-primary font-sans font-semibold text-xs rounded-xl shadow-md cursor-pointer hover:brightness-105"
              >
                Guardar Configuración
              </button>
            </div>
          </div>
        )}

        {/* Sign Out Button (Simulates resetting alerts / mock state) */}
        <div className="pt-4">
          <button
            id="btn-settings-signout"
            onClick={onResetApp}
            className="w-full py-4 px-6 bg-error/10 border border-error/30 text-error rounded-full font-sans font-bold hover:bg-error/20 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,51,102,0.1)] hover:shadow-[0_0_30px_rgba(255,51,102,0.2)]"
          >
            <LogOut className="w-5 h-5" />
            Reiniciar Alertas por Defecto
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <footer className="mt-12 text-center space-y-1 pb-16">
        <p className="font-mono text-xs text-outline font-semibold">
          VeneRate <span className="text-primary">v4.2.0</span>
        </p>
        <p className="font-mono text-[9px] text-outline/40 uppercase tracking-[0.25em] font-bold">
          <span className="bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text text-transparent">Enterprise Edition</span>
        </p>
      </footer>

      {/* Atmosphere radial glows */}
      <div className="absolute inset-0 pointer-events-none z-[-1] opacity-25">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[140px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/20 rounded-full blur-[140px]"></div>
      </div>
    </div>
  );
});
