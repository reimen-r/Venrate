import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, ChevronDown, Trash2, TrendingUp, Landmark, Sparkles, Gauge, Smartphone, CloudOff, Plus, Check, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PriceAlert, IntelligentAlerts } from '../types';

interface AlertsTabProps {
  alerts: PriceAlert[];
  onAddAlert: (currencyId: string, currencyName: string, condition: 'greater' | 'less' | 'equal', targetValue: number) => void;
  onDeleteAlert: (id: string) => void;
  intelligentAlerts: IntelligentAlerts;
  onToggleIntelligentAlert: (key: keyof IntelligentAlerts) => void;
  onTriggerToast: (message: string, type: 'success' | 'info' | 'error') => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 22, mass: 0.6 } },
};

const currencyOptions = [
  { id: 'bcvUsd', name: 'Dólar BCV (Banco Central)' },
  { id: 'bcvEur', name: 'Euro BCV (Banco Central)' },
  { id: 'binanceP2p', name: 'Binance P2P (USDT)' },
];

export const AlertsTab = React.memo<AlertsTabProps>(({
  alerts, onAddAlert, onDeleteAlert, intelligentAlerts, onToggleIntelligentAlert, onTriggerToast,
}) => {
  const [selectedCurrency, setSelectedCurrency] = useState<string>('bcvUsd');
  const [condition, setCondition] = useState<'greater' | 'less' | 'equal'>('greater');
  const [targetValue, setTargetValue] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const valueInputRef = useRef<HTMLInputElement>(null);

  const handleSubmitAlert = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    const value = parseFloat(targetValue);
    if (isNaN(value) || value <= 0) {
      setValidationError('Introduce un valor objetivo válido mayor que cero');
      valueInputRef.current?.focus();
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      const option = currencyOptions.find(o => o.id === selectedCurrency);
      const name = option ? option.name.split(' (')[0] : 'USD';
      onAddAlert(selectedCurrency, name, condition, value);
      setTargetValue('');
      setSubmitted(true);
      setIsSubmitting(false);
      setTimeout(() => setSubmitted(false), 2000);
      valueInputRef.current?.focus();
    }, 600);
  };

  useEffect(() => {
    if (targetValue && validationError) setValidationError(null);
  }, [targetValue, validationError]);

  return (
    <motion.div id="alerts-tab" className="space-y-10" variants={containerVariants} initial="hidden" animate="visible">
      <motion.header className="space-y-2" variants={itemVariants}>
        <p className="font-mono text-[11px] text-primary/70 uppercase tracking-[0.25em] font-semibold">Configuración de Avisos</p>
        <h2 className="font-display text-3xl font-bold tracking-tight text-on-surface">Alertas y Notificaciones</h2>
        <p className="font-sans text-sm text-slate-400 max-w-2xl leading-relaxed">
          Gestiona tus avisos personalizados y mantente informado sobre los movimientos más críticos del mercado cambiario en tiempo real.
        </p>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <motion.div variants={itemVariants} className="glass-card rounded-3xl p-6 md:p-8">
            <div className="flex items-center gap-4 mb-6">
              <motion.div whileHover={{ scale: 1.05, rotate: 5 }}
                className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center border border-secondary/20">
                <Bell className="text-secondary w-5 h-5" />
              </motion.div>
              <div>
                <h3 className="font-display text-lg font-bold text-on-surface">Nueva Alerta de Precio</h3>
                <p className="font-sans text-[11px] text-slate-500">Fija avisos según rangos específicos</p>
              </div>
            </div>

            <form onSubmit={handleSubmitAlert} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block font-mono text-[10px] uppercase font-bold text-primary/60 tracking-wider ml-2">Divisa</label>
                  <div className="relative">
                    <select
                      value={selectedCurrency}
                      onChange={(e) => setSelectedCurrency(e.target.value)}
                      className="w-full bg-white/[0.02] border border-white/[0.06] rounded-2xl px-5 py-3 text-sm text-slate-300 appearance-none focus:outline-none focus:border-primary/30 cursor-pointer"
                    >
                      {currencyOptions.map(opt => (<option key={opt.id} value={opt.id} className="bg-[#12152a]">{opt.name}</option>))}
                    </select>
                    <ChevronDown className="absolute right-5 top-3.5 w-4 h-4 pointer-events-none text-slate-500" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block font-mono text-[10px] uppercase font-bold text-primary/60 tracking-wider ml-2">Condición</label>
                  <div className="relative">
                    <select
                      value={condition}
                      onChange={(e) => setCondition(e.target.value as any)}
                      className="w-full bg-white/[0.02] border border-white/[0.06] rounded-2xl px-5 py-3 text-sm text-slate-300 appearance-none focus:outline-none focus:border-primary/30 cursor-pointer"
                    >
                      <option value="greater">Es mayor que (&gt;)</option>
                      <option value="less">Es menor que (&lt;)</option>
                      <option value="equal">Igual a (=)</option>
                    </select>
                    <ChevronDown className="absolute right-5 top-3.5 w-4 h-4 pointer-events-none text-slate-500" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] uppercase font-bold text-primary/60 tracking-wider ml-2">Valor Objetivo (VES)</label>
                <div className="relative flex items-center">
                  <input
                    ref={valueInputRef}
                    type="number" step="0.01" value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    placeholder="Ej: 700.00"
                    required
                    className={`w-full bg-white/[0.02] border rounded-2xl px-5 py-3.5 text-sm text-on-surface focus:outline-none focus:border-primary/30 transition-colors ${
                      validationError ? 'border-tertiary/50' : 'border-white/[0.06]'
                    }`}
                  />
                  <span className="absolute right-6 font-mono text-[11px] font-bold text-slate-600">VES</span>
                </div>
                {validationError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-1.5 font-sans text-[11px] text-tertiary ml-2"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    {validationError}
                  </motion.p>
                )}
              </div>

              <motion.button
                type="submit" disabled={isSubmitting || submitted}
                whileHover={!isSubmitting ? { scale: 1.01, filter: 'brightness(1.1)' } : {}}
                whileTap={!isSubmitting ? { scale: 0.97 } : {}}
                className={`w-full font-sans font-semibold py-4 rounded-2xl flex justify-center items-center gap-2 shadow-lg transition-all cursor-pointer ${
                  submitted
                    ? 'bg-success/20 text-success/90 border border-success/30'
                    : isSubmitting
                      ? 'bg-secondary/20 text-secondary/90'
                      : 'bg-gradient-to-r from-primary to-secondary text-on-surface'
                }`}
              >
                {submitted ? (
                  <motion.span className="flex items-center gap-2" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
                    <Check className="w-5 h-5" /> Alerta Creada
                  </motion.span>
                ) : isSubmitting ? (
                  <><motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full inline-block" /> Guardando...</>
                ) : (
                  <><Plus className="w-5 h-5" /> Crear Alerta</>
                )}
              </motion.button>
            </form>
          </motion.div>

          <motion.div variants={itemVariants} className="glass-card rounded-3xl p-6 md:p-8">
            <h3 className="font-display text-lg font-bold text-on-surface mb-5">Alertas Activas</h3>
            <div className="space-y-3">
              {alerts.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 text-slate-600 text-xs">
                  No tienes alertas activas en este momento.
                </motion.div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {alerts.map((alert) => {
                    const conditionSymbol = alert.condition === 'greater' ? '>' : alert.condition === 'less' ? '<' : '=';
                    return (
                      <motion.div
                        key={alert.id}
                        layout
                        initial={{ opacity: 0, y: 12, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -30, scale: 0.94 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                        whileHover={{ scale: 1.01 }}
                        className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors group"
                      >
                        <div className="flex items-center gap-4">
                          <motion.div whileHover={{ scale: 1.1 }}
                            className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                              alert.condition === 'greater' ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'
                            }`}>
                            {alert.condition === 'greater' ? <TrendingUp className="w-5 h-5" /> : <Landmark className="w-5 h-5" />}
                          </motion.div>
                          <div>
                            <p className="font-sans text-sm font-semibold text-on-surface">
                              {alert.currencyName} {conditionSymbol} {alert.targetValue.toFixed(2)} VES
                            </p>
                            <p className="font-mono text-[10px] text-slate-500">Creada: {alert.createdDate}</p>
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1, backgroundColor: 'rgba(251,113,133,0.1)' }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => onDeleteAlert(alert.id)}
                          className="text-slate-600 hover:text-tertiary transition-all p-2 rounded-xl cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        </div>

        <motion.div variants={itemVariants} className="lg:col-span-5 space-y-6">
          <div className="glass-card rounded-3xl p-6 md:p-8">
            <h3 className="font-display text-lg font-bold text-on-surface mb-6 flex items-center gap-2.5">
              <Sparkles className="text-tertiary w-5 h-5" />
              Alertas Inteligentes
            </h3>

            <div className="space-y-6">
              {([
                { key: 'fluctuations' as keyof IntelligentAlerts, title: 'Fluctuaciones Significativas', desc: 'Notificar si hay cambios mayores al 2% en menos de 1 hora.' },
                { key: 'dailySummary' as keyof IntelligentAlerts, title: 'Resumen Diario', desc: 'Recibe un resumen de los tipos de cambio al cierre del día (4:00 PM).' },
                { key: 'bcvParallelGap' as keyof IntelligentAlerts, title: 'Brecha BCV vs Binance', desc: 'Avisar si la brecha entre el oficial y Binance P2P supera el 10%.' },
              ]).map((item, idx) => (
                <div key={item.key} className={`flex items-start justify-between gap-5 ${idx < 2 ? 'border-b border-white/[0.04] pb-5' : ''}`}>
                  <div className="flex-1 space-y-1">
                    <p className="font-sans text-sm font-bold text-on-surface">{item.title}</p>
                    <p className="font-sans text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                    <input
                      type="checkbox" checked={intelligentAlerts[item.key]}
                      onChange={() => onToggleIntelligentAlert(item.key)}
                      className="sr-only peer"
                    />
                    <motion.div
                      className="w-10 h-5 rounded-full bg-white/[0.08] transition-colors peer-checked:bg-secondary/60 flex items-center px-0.5"
                      animate={{ backgroundColor: intelligentAlerts[item.key] ? 'rgba(139,92,246,0.6)' : 'rgba(255,255,255,0.08)' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                      <motion.div
                        className="w-4 h-4 bg-white rounded-full shadow-md"
                        animate={{ x: intelligentAlerts[item.key] ? 18 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 28, mass: 0.6 }}
                      />
                    </motion.div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6 md:p-8 overflow-hidden relative">
            <div className="absolute -right-10 -bottom-10 w-36 h-36 rounded-full bg-secondary/8 blur-[80px] pointer-events-none" />
            <h3 className="font-display text-lg font-bold text-on-surface mb-5 relative z-10">¿Cómo funcionan?</h3>
            <div className="space-y-5 relative z-10">
              {[
                { icon: Gauge, title: 'Tiempo Real', desc: 'Alertas procesadas en milisegundos tras cada actualización oficial de entes bancarios y portales P2P.' },
                { icon: Smartphone, title: 'Multi-dispositivo', desc: 'Sincronización instantánea en la nube entre tu móvil, tableta y navegador web.' },
                { icon: CloudOff, title: 'Optimización', desc: 'Protocolos de bajo consumo diseñados para conexiones a redes móviles lentas o inestables.' },
              ].map((info, i) => (
                <motion.div key={i} className="flex gap-4" whileHover={{ x: 3 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                  <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center shrink-0 border border-secondary/15">
                    <info.icon className="text-secondary w-4.5 h-4.5" />
                  </div>
                  <div className="space-y-0.5">
                    <strong className="text-on-surface block text-sm font-bold">{info.title}</strong>
                    <p className="font-sans text-[11px] text-slate-500 leading-relaxed">{info.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
});
