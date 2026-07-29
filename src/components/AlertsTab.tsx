import React, { useState } from 'react';
import { Bell, ChevronDown, Trash2, TrendingUp, Landmark, Sparkles, Gauge, Smartphone, CloudOff, Plus, Check } from 'lucide-react';
import { PriceAlert, IntelligentAlerts } from '../types';

interface AlertsTabProps {
  alerts: PriceAlert[];
  onAddAlert: (currencyId: string, currencyName: string, condition: 'greater' | 'less' | 'equal', targetValue: number) => void;
  onDeleteAlert: (id: string) => void;
  intelligentAlerts: IntelligentAlerts;
  onToggleIntelligentAlert: (key: keyof IntelligentAlerts) => void;
  onTriggerToast: (message: string, type: 'success' | 'info' | 'error') => void;
}

export const AlertsTab = React.memo<AlertsTabProps>(({
  alerts,
  onAddAlert,
  onDeleteAlert,
  intelligentAlerts,
  onToggleIntelligentAlert,
  onTriggerToast,
}) => {
  const [selectedCurrency, setSelectedCurrency] = useState<string>('bcvUsd');
  const [condition, setCondition] = useState<'greater' | 'less' | 'equal'>('greater');
  const [targetValue, setTargetValue] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Currency option list mapping IDs to descriptive names
  const currencyOptions = [
    { id: 'bcvUsd', name: 'Dólar BCV (Banco Central)' },
    { id: 'bcvEur', name: 'Euro BCV (Banco Central)' },
    { id: 'binanceP2p', name: 'Binance P2P (USDT)' },
  ];

  const handleSubmitAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(targetValue);
    
    if (isNaN(value) || value <= 0) {
      onTriggerToast('Por favor introduce un valor objetivo válido mayor que cero', 'error');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API delay for a polished feedback micro-interaction
    setTimeout(() => {
      const option = currencyOptions.find(o => o.id === selectedCurrency);
      const name = option ? option.name.split(' (')[0] : 'USD';
      
      onAddAlert(selectedCurrency, name, condition, value);
      setTargetValue('');
      setIsSubmitting(false);
    }, 800);
  };

  return (
    <div id="alerts-tab" className="space-y-12 animate-fade-in">
      {/* Header Section */}
      <section className="space-y-3">
        <h2 className="font-sans text-3xl font-bold text-on-surface dark:text-white tracking-tight">
          Alertas y Notificaciones
        </h2>
        <p className="font-sans text-sm text-on-surface-variant max-w-2xl leading-relaxed opacity-95">
          Gestiona tus avisos personalizados y mantente informado sobre los movimientos más críticos del mercado cambiario en tiempo real.
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form and Active Alerts (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* New Price Alert Form Card */}
          <div className="fluid-card p-6 md:p-8 rounded-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center border border-secondary/20">
                <Bell className="text-secondary w-5 h-5" />
              </div>
              <div>
                <h3 className="font-sans text-lg font-bold text-on-surface dark:text-white">
                  Nueva Alerta de Precio
                </h3>
                <p className="font-sans text-xs text-on-surface-variant/80">
                  Fija avisos según rangos específicos
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitAlert} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Reference Currency select */}
                <div className="space-y-1.5">
                  <label className="block font-mono text-[10px] uppercase font-bold text-primary/70 tracking-wider ml-2">
                    Divisa de Referencia
                  </label>
                  <div className="relative">
                    <select
                      id="alert-currency-select"
                      value={selectedCurrency}
                      onChange={(e) => setSelectedCurrency(e.target.value)}
                      className="fluid-input w-full bg-surface-container-lowest/50 border border-on-surface/5 px-5 py-3 text-sm text-on-surface appearance-none focus:outline-none focus:border-primary/50 cursor-pointer"
                    >
                      {currencyOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-5 top-3.5 w-4 h-4 pointer-events-none opacity-50 text-on-surface" />
                  </div>
                </div>

                {/* Condition select */}
                <div className="space-y-1.5">
                  <label className="block font-mono text-[10px] uppercase font-bold text-primary/70 tracking-wider ml-2">
                    Condición
                  </label>
                  <div className="relative">
                    <select
                      id="alert-condition-select"
                      value={condition}
                      onChange={(e) => setCondition(e.target.value as any)}
                      className="fluid-input w-full bg-surface-container-lowest/50 border border-on-surface/5 px-5 py-3 text-sm text-on-surface appearance-none focus:outline-none focus:border-primary/50 cursor-pointer"
                    >
                      <option value="greater">Es mayor que ( &gt; )</option>
                      <option value="less">Es menor que ( &lt; )</option>
                      <option value="equal">Igual a ( = )</option>
                    </select>
                    <ChevronDown className="absolute right-5 top-3.5 w-4 h-4 pointer-events-none opacity-50 text-on-surface" />
                  </div>
                </div>
              </div>

              {/* Target Value Input */}
              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] uppercase font-bold text-primary/70 tracking-wider ml-2">
                  Valor Objetivo (VES)
                </label>
                <div className="relative flex items-center">
                  <input
                    id="alert-target-value-input"
                    type="number"
                    step="0.01"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    placeholder="Ej: 40.00"
                    required
                    className="fluid-input w-full bg-surface-container-lowest/50 border border-on-surface/5 px-5 py-3.5 text-sm text-on-surface focus:outline-none focus:border-primary/50"
                  />
                  <span className="absolute right-6 font-mono text-[11px] font-bold text-outline/60">
                    VES
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                id="btn-create-alert"
                type="submit"
                disabled={isSubmitting}
                className={`w-full font-sans font-semibold py-4 rounded-full flex justify-center items-center gap-2 hover:brightness-110 shadow-lg transition-all active:scale-[0.98] cursor-pointer ${
                  isSubmitting
                    ? 'bg-secondary-container text-white cursor-wait'
                    : 'bg-primary text-on-primary shadow-primary/20'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Check className="w-5 h-5 animate-bounce" />
                    Alerta Guardada
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Crear Alerta
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Active Alerts List Card */}
          <div className="fluid-card p-6 md:p-8 rounded-2xl">
            <h3 className="font-sans text-lg font-bold text-on-surface dark:text-white mb-5">
              Alertas Activas
            </h3>
            
            <div className="space-y-4">
              {alerts.length === 0 ? (
                <div className="text-center py-10 text-on-surface-variant/50 text-sm italic">
                  No tienes alertas activas en este momento.
                </div>
              ) : (
                alerts.map((alert) => {
                  const conditionSymbol = alert.condition === 'greater' ? '>' : alert.condition === 'less' ? '<' : '=';
                  return (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-5 bg-white/5 dark:bg-white/[0.03] rounded-2xl border border-on-surface/5 hover:bg-white/10 dark:hover:bg-white/[0.07] transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                          alert.condition === 'greater'
                            ? 'bg-secondary/10 text-secondary'
                            : 'bg-primary/10 text-primary'
                        }`}>
                          {alert.condition === 'greater' ? (
                            <TrendingUp className="w-5 h-5" />
                          ) : (
                            <Landmark className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-sans text-sm font-semibold text-on-surface dark:text-white">
                            {alert.currencyName} {conditionSymbol} {alert.targetValue.toFixed(2)} VES
                          </p>
                          <p className="font-mono text-[10px] text-on-surface-variant/80">
                            Creada: {alert.createdDate}
                          </p>
                        </div>
                      </div>

                      <button
                        id={`btn-delete-alert-${alert.id}`}
                        onClick={() => onDeleteAlert(alert.id)}
                        className="text-on-surface-variant/50 hover:text-error transition-all hover:bg-error/10 p-2.5 rounded-full cursor-pointer"
                        title="Eliminar Alerta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Toggles & Info (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Intelligent Alerts Toggles Card */}
          <div className="fluid-card p-6 md:p-8 rounded-2xl">
            <h3 className="font-sans text-lg font-bold text-on-surface dark:text-white mb-6 flex items-center gap-2.5">
              <Sparkles className="text-tertiary w-5 h-5" />
              Alertas Inteligentes
            </h3>

            <div className="space-y-6">
              {/* Toggle 1: Significant Fluctuations */}
              <div className="flex items-start justify-between gap-5 border-b border-on-surface/5 pb-5">
                <div className="flex-1 space-y-1">
                  <p className="font-sans text-sm font-bold text-on-surface dark:text-white">
                    Fluctuaciones Significativas
                  </p>
                  <p className="font-sans text-xs text-on-surface-variant/80 leading-relaxed">
                    Notificar si hay cambios mayores al 2% en menos de 1 hora.
                  </p>
                </div>
                
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    id="toggle-significant-fluctuations"
                    type="checkbox"
                    checked={intelligentAlerts.fluctuations}
                    onChange={() => onToggleIntelligentAlert('fluctuations')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-on-surface/10 dark:bg-white/10 rounded-full transition-colors peer-checked:bg-secondary relative">
                    <div className="absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full transition-all shadow-md transform peer-checked:translate-x-5"></div>
                  </div>
                </label>
              </div>

              {/* Toggle 2: Daily Summary */}
              <div className="flex items-start justify-between gap-5 border-b border-on-surface/5 pb-5">
                <div className="flex-1 space-y-1">
                  <p className="font-sans text-sm font-bold text-on-surface dark:text-white">
                    Resumen Diario
                  </p>
                  <p className="font-sans text-xs text-on-surface-variant/80 leading-relaxed">
                    Recibe un resumen de los tipos de cambio al cierre del día (4:00 PM).
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    id="toggle-daily-summary"
                    type="checkbox"
                    checked={intelligentAlerts.dailySummary}
                    onChange={() => onToggleIntelligentAlert('dailySummary')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-on-surface/10 dark:bg-white/10 rounded-full transition-colors peer-checked:bg-secondary relative">
                    <div className="absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full transition-all shadow-md transform peer-checked:translate-x-5"></div>
                  </div>
                </label>
              </div>

              {/* Toggle 3: BCV vs Binance Gap */}
              <div className="flex items-start justify-between gap-5">
                <div className="flex-1 space-y-1">
                  <p className="font-sans text-sm font-bold text-on-surface dark:text-white">
                    Brecha BCV vs Binance
                  </p>
                  <p className="font-sans text-xs text-on-surface-variant/80 leading-relaxed">
                    Avisar si la brecha entre el oficial y Binance P2P supera el 10%.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    id="toggle-bcv-parallel-gap"
                    type="checkbox"
                    checked={intelligentAlerts.bcvParallelGap}
                    onChange={() => onToggleIntelligentAlert('bcvParallelGap')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-on-surface/10 dark:bg-white/10 rounded-full transition-colors peer-checked:bg-secondary relative">
                    <div className="absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full transition-all shadow-md transform peer-checked:translate-x-5"></div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Info Card: How they work? */}
          <div className="fluid-card p-6 md:p-8 rounded-2xl overflow-hidden relative">
            <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-secondary/5 rounded-full blur-[80px]"></div>
            <h3 className="font-sans text-lg font-bold text-on-surface dark:text-white mb-5">
              ¿Cómo funcionan?
            </h3>
            
            <div className="space-y-5 relative z-10">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary/5 flex items-center justify-center shrink-0 border border-secondary/10">
                  <Gauge className="text-secondary w-4.5 h-4.5" />
                </div>
                <div className="space-y-0.5">
                  <strong className="text-on-surface dark:text-white block text-sm font-bold">Tiempo Real</strong>
                  <p className="font-sans text-xs text-on-surface-variant/80 leading-relaxed">
                    Alertas procesadas en milisegundos tras cada actualización oficial de entes bancarios y portales P2P.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary/5 flex items-center justify-center shrink-0 border border-secondary/10">
                  <Smartphone className="text-secondary w-4.5 h-4.5" />
                </div>
                <div className="space-y-0.5">
                  <strong className="text-on-surface dark:text-white block text-sm font-bold">Multi-dispositivo</strong>
                  <p className="font-sans text-xs text-on-surface-variant/80 leading-relaxed">
                    Sincronización instantánea en la nube entre tu móvil, tableta, extensión y navegador web.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary/5 flex items-center justify-center shrink-0 border border-secondary/10">
                  <CloudOff className="text-secondary w-4.5 h-4.5" />
                </div>
                <div className="space-y-0.5">
                  <strong className="text-on-surface dark:text-white block text-sm font-bold">Optimización</strong>
                  <p className="font-sans text-xs text-on-surface-variant/80 leading-relaxed">
                    Protocolos de bajo consumo diseñados específicamente para conexiones a redes móviles lentas o inestables.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Server Status Graphic Card */}
          <div className="rounded-2xl overflow-hidden h-40 relative group border border-on-surface/5">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent z-10"></div>
            
            <div className="absolute bottom-5 left-5 z-20 space-y-1">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-secondary text-[9px] font-bold uppercase tracking-widest border border-white/10">
                Estado del Servidor
              </span>
              <p className="font-sans text-base text-white font-bold tracking-tight">
                Sistemas Operativos Operando (99.9%)
              </p>
            </div>
            
            <div 
              className="bg-cover bg-center w-full h-full transform group-hover:scale-105 transition-transform duration-[4000ms]" 
              style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBWzfzKAxIUgQgJuZbeWYlR-h1NTb6HRcEGYZ4rltoc0kRs1yEeExkpTKnB3A5NRAY8LjWz2dWmCJscJtGaygJJ8Sa8QiEQS4speCECIk9sS_ncD1XH7_iM4hz-jrvg-_OL5v1ME6rzwjuNAo87EIo0FJMI90TbJ6Dg816Ev6PKuYsUiJZLp0m4M5tpUqdvhlLtzI5TB1SCGpOZJMkCm3BJgW0_TQ8OkCtTz0JopmdO2VoLvo6AcLSRFw')" }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
});
