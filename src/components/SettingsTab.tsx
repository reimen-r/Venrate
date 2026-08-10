import React, { useState, useEffect, useRef } from 'react';
import { Moon, Sun, ChevronRight, CloudLightning, LayoutGrid, LogOut, RefreshCw, Smartphone, Scale, Bell, BellOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ExchangeRate } from '../types';
import { requestNotificationPermission, getNotificationPermission, NotificationPermission } from '../lib/notifications';

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 220, damping: 22, mass: 0.6 } },
};

export const SettingsTab = React.memo<SettingsTabProps>(({
  isDarkMode, onToggleDarkMode, isCompactView, onToggleCompactView,
  isEqualizedToBcv, onToggleEqualizedToBcv, rates, onTriggerToast, onResetApp,
}) => {
  const [syncTime, setSyncTime] = useState('Hace 2 minutos');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showPersonalizeModal, setShowPersonalizeModal] = useState(false);
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>(() => getNotificationPermission());
  const [selectedWidgetRates, setSelectedWidgetRates] = useState<string[]>(['bcvUsd', 'bcvEur', 'binanceP2p']);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showPersonalizeModal) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setShowPersonalizeModal(false);
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showPersonalizeModal]);

  const handleManualSync = () => {
    setIsSyncing(true);
    onTriggerToast('Estableciendo conexión segura con VeneRate Cloud...', 'info');
    setTimeout(() => { setSyncTime('Hace un momento'); setIsSyncing(false); onTriggerToast('Sincronización completada con éxito', 'success'); }, 1500);
  };

  const handleToggleWidgetRate = (rateId: string) => {
    if (selectedWidgetRates.includes(rateId)) {
      if (selectedWidgetRates.length <= 1) { onTriggerToast('Debes mantener al menos una tasa en pantalla', 'error'); return; }
      setSelectedWidgetRates(p => p.filter(id => id !== rateId));
    } else {
      setSelectedWidgetRates(p => [...p, rateId]);
    }
    onTriggerToast('Configuración de visualización modificada', 'success');
  };

  const handleNotificationRequest = async () => {
    const perm = await requestNotificationPermission();
    setNotifPerm(perm);
    if (perm === 'granted') onTriggerToast('Notificaciones nativas activadas', 'success');
    else if (perm === 'denied') onTriggerToast('Permiso de notificaciones denegado. Actívalo en la configuración del navegador.', 'error');
    else if (perm === 'unsupported') onTriggerToast('Tu navegador no soporta notificaciones nativas', 'error');
    else onTriggerToast('Permiso de notificaciones pendiente', 'info');
  };

  const settingsToggles = [
    { key: 'dark', label: 'Modo Oscuro', description: isDarkMode ? 'Visibilidad nocturna mejorada activa' : 'Tema claro activo', icon: isDarkMode ? Moon : Sun, value: isDarkMode, onToggle: onToggleDarkMode, color: 'cyan' },
    { key: 'compact', label: 'Vista Compacta', description: isCompactView ? 'Lista compacta para pantallas pequeñas activa' : 'Tarjetas detalladas en pantallas pequeñas', icon: Smartphone, value: isCompactView, onToggle: onToggleCompactView, color: 'violet' },
    { key: 'equalize', label: 'Igualar Tasas al BCV', description: isEqualizedToBcv ? 'Todas las tasas USD igualadas a la tasa oficial BCV' : 'Tasas de cambio diferenciadas (BCV, Binance P2P)', icon: Scale, value: isEqualizedToBcv, onToggle: onToggleEqualizedToBcv, color: 'emerald' },
  ];

  return (
    <motion.div id="settings-tab" className="space-y-8" variants={containerVariants} initial="hidden" animate="visible">
      <motion.header className="space-y-2" variants={itemVariants}>
        <p className="font-mono text-[11px] text-primary/70 uppercase tracking-[0.25em] font-semibold">Preferencias del Sistema</p>
        <h2 className="font-display text-3xl font-bold tracking-tight text-on-surface">Ajustes</h2>
        <p className="font-sans text-sm text-slate-400">Gestiona tu experiencia de monitoreo cambiario</p>
      </motion.header>

      <motion.div variants={itemVariants} className="space-y-3">
        {settingsToggles.map((item) => (
          <motion.section
            key={item.key}
            whileHover={{ scale: 1.005 }}
            whileTap={{ scale: 0.995 }}
            onClick={item.onToggle}
            className="glass-card rounded-2xl p-5 flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex items-center gap-4">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center border ${
                item.color === 'cyan' ? 'bg-primary/10 border-primary/20' :
                item.color === 'violet' ? 'bg-secondary/10 border-secondary/20' :
                'bg-success/10 border-success/20'
              }`}>
                <item.icon className={`w-5 h-5 ${
                  item.color === 'cyan' ? 'text-primary' : item.color === 'violet' ? 'text-secondary' : 'text-success'
                }`} />
              </div>
              <div>
                <h3 className="font-sans text-sm font-bold text-on-surface">{item.label}</h3>
                <p className="font-sans text-[11px] text-slate-500">{item.description}</p>
              </div>
            </div>
            <motion.div
              className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors ${
                item.value
                  ? item.color === 'cyan' ? 'bg-primary/50' : item.color === 'violet' ? 'bg-secondary/50' : 'bg-success/50'
                  : 'bg-white/[0.06]'
              }`}
            >
              <motion.div
                className="w-4.5 h-4.5 bg-white rounded-full shadow-md"
                animate={{ x: item.value ? 20 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 28, mass: 0.6 }}
              />
            </motion.div>
          </motion.section>
        ))}
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center border shrink-0 ${
              notifPerm === 'granted' ? 'bg-success/10 border-success/20' :
              notifPerm === 'denied' ? 'bg-tertiary/10 border-tertiary/20' :
              'bg-warning/10 border-warning/20'
            }`}>
              {notifPerm === 'granted' ? <Bell className="w-5 h-5 text-success" /> : <BellOff className="w-5 h-5 text-slate-500" />}
            </div>
            <div>
              <h3 className="font-sans text-sm font-bold text-on-surface">Notificaciones del Sistema</h3>
              <p className="font-sans text-[11px] text-slate-500">
                {notifPerm === 'granted' && 'Notificaciones nativas activadas'}
                {notifPerm === 'denied' && 'Permiso denegado — actívalo en el navegador'}
                {notifPerm === 'unsupported' && 'No soportado en este navegador'}
                {(notifPerm === 'default' || !notifPerm) && 'Activa para recibir alertas en tu escritorio'}
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNotificationRequest}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ml-4 shrink-0 ${
              notifPerm === 'granted'
                ? 'bg-success/10 text-success border border-success/20'
                : 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20'
            }`}
          >
            {notifPerm === 'granted' ? 'Activadas' : 'Activar'}
          </motion.button>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card rounded-2xl overflow-hidden divide-y divide-white/[0.04]">
        <motion.button
          whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
          onClick={() => onTriggerToast('VeneRate Premium Activo: Licencia Enterprise concedida', 'success')}
          className="w-full p-5 flex items-center justify-between group cursor-pointer text-left"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-primary/20 shadow-lg shrink-0">
              <img alt="Avatar" loading="lazy" className="w-full h-full object-cover" referrerPolicy="no-referrer"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAXoIac5JUko8NRGdL6exVbiUpTDnAKR8Vui3KWkmlQZGwesXEJXeDd5bR_N0438hwBwqruPl7ymOxSxi9hgRfdICWGimmmTCvSNcaiKxl7ARtrbV8P2RI6hZXbi-Tfnrllbq4vQM2ErRMA3speoJtJ8vxPPaGcnFx18AeUpGHiKTNHzF-dNcnb4nVa8VQEJZiCdDpYN8urzJSTRUxht_PJFnT2Y___W_niacu1TQthNzS8y7n_nz4Ngg" />
            </div>
            <div>
              <h3 className="font-sans text-sm font-bold text-on-surface">Cuenta</h3>
              <p className="font-mono text-[10px] text-slate-500">Premium · ID: 8824</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:translate-x-1 transition-transform" />
        </motion.button>

        <motion.button
          whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
          onClick={handleManualSync}
          disabled={isSyncing}
          className="w-full p-5 flex items-center justify-between group cursor-pointer text-left"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-white/[0.03] flex items-center justify-center text-secondary border border-white/[0.05] shrink-0">
              <CloudLightning className={`w-5 h-5 ${isSyncing ? 'animate-spin text-primary' : ''}`} />
            </div>
            <div>
              <h3 className="font-sans text-sm font-bold text-on-surface">Sincronización Cloud</h3>
              <p className="font-mono text-[10px] text-slate-500">Última: {syncTime}</p>
            </div>
          </div>
          {isSyncing ? <RefreshCw className="w-4 h-4 text-primary animate-spin" /> : <ChevronRight className="w-4 h-4 text-slate-600 group-hover:translate-x-1 transition-transform" />}
        </motion.button>

        <motion.button
          whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
          onClick={() => setShowPersonalizeModal(true)}
          className="w-full p-5 flex items-center justify-between group cursor-pointer text-left"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-white/[0.03] flex items-center justify-center text-tertiary border border-white/[0.05] shrink-0">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-sans text-sm font-bold text-on-surface">Widgets</h3>
              <p className="font-mono text-[10px] text-slate-500">Personalizar referencias</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:translate-x-1 transition-transform" />
        </motion.button>
      </motion.div>

      <motion.div variants={itemVariants} className="pt-4">
        <motion.button
          whileHover={{ scale: 1.01, backgroundColor: 'rgba(251,113,133,0.12)' }}
          whileTap={{ scale: 0.98 }}
          onClick={onResetApp}
          className="w-full py-4 px-6 rounded-2xl glass-card border-tertiary/20 text-tertiary font-sans font-bold hover:bg-tertiary/10 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          Reiniciar Alertas por Defecto
        </motion.button>
      </motion.div>

      <motion.footer variants={itemVariants} className="text-center space-y-1 pb-20">
        <p className="font-mono text-xs text-slate-600 font-semibold">VeneRate <span className="text-primary">v4.2.0</span></p>
        <p className="font-mono text-[9px] text-slate-700 uppercase tracking-[0.2em] font-bold">
          <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-rose-400 bg-clip-text text-transparent">Enterprise Edition</span>
        </p>
      </motion.footer>

      <AnimatePresence>
        {showPersonalizeModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowPersonalizeModal(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-6"
          >
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong rounded-3xl max-w-sm w-full p-6 space-y-5 border border-primary/10"
            >
              <div className="space-y-1">
                <h4 className="font-display text-base font-bold text-on-surface">Widgets</h4>
                <p className="font-sans text-[11px] text-slate-500">Elige las tasas a mostrar en el inicio</p>
              </div>
              <div className="space-y-2.5">
                {rates.map(rate => {
                  const isChecked = selectedWidgetRates.includes(rate.id);
                  return (
                    <motion.div
                      key={rate.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleToggleWidgetRate(rate.id)}
                      className={`flex items-center justify-between p-3.5 rounded-xl cursor-pointer border transition-colors ${
                        isChecked ? 'bg-primary/10 border-primary/20' : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04]'
                      }`}
                    >
                      <span className="font-sans text-xs font-semibold text-on-surface">{rate.name} ({rate.code})</span>
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                        isChecked ? 'bg-cyan-500 border-cyan-500 text-on-surface' : 'border-slate-700'
                      }`}>
                        {isChecked && <span className="font-bold text-[10px]">✓</span>}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowPersonalizeModal(false)}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-primary to-secondary text-on-surface font-sans font-semibold text-xs cursor-pointer shadow-lg"
              >
                Guardar
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
