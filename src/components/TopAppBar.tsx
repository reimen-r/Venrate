import React from 'react';
import { Activity, Share2, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

interface TopAppBarProps {
  onShare: () => void;
  isFetching: boolean;
  onRefresh: () => void;
  lastFetched: Date | null;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({ onShare, isFetching, onRefresh, lastFetched }) => {
  const formattedTime = lastFetched 
    ? lastFetched.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'No cargado';

  return (
    <header id="top-app-bar" className="fixed top-0 w-full z-50 bg-surface-dim/50 dark:bg-background/50 backdrop-blur-xl border-b border-primary/10 transition-colors">
      <div className="flex justify-between items-center px-6 h-16 w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center border border-primary/30 shadow-[0_0_20px_rgba(0,217,255,0.15)]">
            <Activity className="text-primary w-5 h-5" />
          </div>
          <div>
            <h1 className="font-sans text-xl font-bold tracking-tight text-on-surface dark:text-white">
              VeneRate
            </h1>
            {lastFetched && (
              <p className="font-mono text-[9px] text-on-surface-variant/70 leading-none mt-0.5">
                API en vivo: {formattedTime}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Refresh Button with neon glow loader */}
          <button
            id="btn-refresh-rates"
            onClick={onRefresh}
            disabled={isFetching}
            className={`transition-all duration-200 active:scale-95 bg-on-surface/5 dark:bg-white/5 hover:bg-on-surface/10 dark:hover:bg-white/10 p-2.5 rounded-full text-on-surface-variant cursor-pointer disabled:opacity-50 ${isFetching ? 'cursor-not-allowed shadow-[0_0_20px_rgba(0,217,255,0.3)]' : ''}`}
            aria-label="Actualizar tasas de cambio"
            title="Actualizar tasas de cambio"
          >
            <motion.div
              animate={isFetching ? { rotate: 360 } : { rotate: 0 }}
              transition={isFetching ? {
                repeat: Infinity,
                ease: "linear",
                duration: 1.8
              } : {
                type: "spring",
                stiffness: 200,
                damping: 15
              }}
              className="flex items-center justify-center"
            >
              <RefreshCw className={`w-5 h-5 ${isFetching ? 'text-primary' : ''}`} />
            </motion.div>
          </button>

          <button
            id="btn-share-app"
            onClick={onShare}
            aria-label="Compartir aplicación"
            className="transition-all duration-200 active:scale-95 bg-on-surface/5 dark:bg-white/5 hover:bg-on-surface/10 dark:hover:bg-white/10 p-2.5 rounded-full text-on-surface-variant cursor-pointer"
            title="Compartir aplicación"
          >
            <Share2 className="text-xl w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
