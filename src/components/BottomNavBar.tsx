import React from 'react';
import { LayoutDashboard, TrendingUp, Bell, Settings as SettingsIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type TabType = 'dashboard' | 'history' | 'alerts' | 'settings';

interface BottomNavBarProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  alertsCount?: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, onChangeTab, alertsCount = 0 }) => {
  const navItems = [
    { id: 'dashboard' as TabType, label: 'Inicio', icon: LayoutDashboard },
    { id: 'history' as TabType, label: 'Historial', icon: TrendingUp },
    { id: 'alerts' as TabType, label: 'Alertas', icon: Bell, badge: alertsCount > 0 ? alertsCount : undefined },
    { id: 'settings' as TabType, label: 'Ajustes', icon: SettingsIcon },
  ];

  return (
    <nav className="fixed bottom-0 w-full z-50 pb-[max(env(safe-area-inset-bottom,8px),8px)] px-4">
      <div className="max-w-md mx-auto glass-strong rounded-3xl p-1.5 flex justify-around items-center">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className="relative flex flex-col items-center justify-center py-2 px-3 cursor-pointer outline-none flex-1"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-1 rounded-2xl bg-gradient-to-br from-primary/15 to-secondary/10 border border-primary/15"
                  style={{ boxShadow: '0 0 18px rgba(34,211,238,0.1)' }}
                  transition={{ type: 'spring', stiffness: 380, damping: 28, mass: 0.8 }}
                />
              )}

              <div className="relative z-10">
                <IconComponent
                  className={`w-5 h-5 transition-all duration-300 ${
                    isActive
                      ? 'text-primary stroke-[2.5px]'
                      : 'text-slate-500 stroke-[1.8px]'
                  }`}
                />
                {item.badge !== undefined && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-2 -right-3 bg-rose-500 text-on-surface font-mono text-[9px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-1 shadow-[0_0_10px_rgba(251,113,133,0.5)]"
                  >
                    {item.badge}
                  </motion.span>
                )}
              </div>
              <span
                className={`font-sans text-[10px] mt-0.5 relative z-10 transition-colors duration-300 ${
                  isActive ? 'text-primary/90 font-semibold' : 'text-slate-500 font-medium'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
