import React from 'react';
import { LayoutDashboard, TrendingUp, Bell, Settings as SettingsIcon } from 'lucide-react';

export type TabType = 'dashboard' | 'history' | 'alerts' | 'settings';

interface BottomNavBarProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  alertsCount?: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, onChangeTab, alertsCount = 0 }) => {
  const navItems = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'history' as TabType, label: 'Historial', icon: TrendingUp },
    { id: 'alerts' as TabType, label: 'Alertas', icon: Bell, badge: alertsCount > 0 ? alertsCount : undefined },
    { id: 'settings' as TabType, label: 'Ajustes', icon: SettingsIcon },
  ];

  return (
    <nav id="bottom-nav-bar" className="fixed bottom-0 w-full z-50 bg-surface-container/60 dark:bg-background/60 backdrop-blur-3xl border-t border-primary/10 transition-colors pb-safe">
      <div className="flex justify-around items-center h-20 px-4 max-w-7xl mx-auto">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => onChangeTab(item.id)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center transition-all duration-300 relative px-4 py-2 rounded-xl cursor-pointer ${
                isActive 
                  ? 'bg-primary/15 text-primary border border-primary/30 shadow-[0_0_20px_rgba(0,217,255,0.12)]' 
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
              }`}
            >
              <div className="relative">
                <IconComponent className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 bg-error text-on-error font-mono text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce shadow-[0_0_12px_rgba(255,51,102,0.5)]">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`font-sans text-[11px] mt-1 ${isActive ? 'font-semibold' : 'font-normal'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
