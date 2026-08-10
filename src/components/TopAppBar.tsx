import React, { useEffect, useState } from 'react';
import { Activity, Share2, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

interface TopAppBarProps {
  onShare: () => void;
  isFetching: boolean;
  onRefresh: () => void;
  lastFetched: Date | null;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({ onShare, isFetching, onRefresh, lastFetched }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const formattedTime = lastFetched
    ? lastFetched.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—';

  return (
    <motion.header
      id="top-app-bar"
      className={`fixed top-0 w-full z-50 transition-all duration-400 ${
        scrolled
          ? 'glass-strong border-b border-white/[0.04] shadow-[0_4px_24px_rgba(0,0,0,0.2)]'
          : 'bg-transparent border-transparent'
      }`}
    >
      <div className="flex justify-between items-center px-5 h-16 w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-10 h-10 rounded-xl flex items-center justify-center border border-primary/30 bg-gradient-to-br from-primary/10 to-secondary/10"
            style={{ boxShadow: '0 0 24px rgba(34,211,238,0.12)' }}
          >
            <Activity className="text-primary w-5 h-5" />
          </motion.div>
          <div>
            <h1 className="font-display text-lg font-bold tracking-tight text-[#eaecfa]">
              VeneRate
            </h1>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
              </span>
              <span className="font-mono text-[9px] text-primary/90/80 uppercase tracking-widest font-semibold leading-none mt-px">
                EN VIVO · {formattedTime}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <motion.button
            id="btn-refresh-rates"
            onClick={onRefresh}
            disabled={isFetching}
            whileTap={{ scale: 0.9 }}
            className={`p-2.5 rounded-xl transition-colors cursor-pointer text-slate-400 hover:text-on-surface hover:bg-white/[0.06] disabled:opacity-50 ${
              isFetching ? '' : ''
            }`}
            aria-label="Actualizar tasas de cambio"
          >
            <motion.div
              animate={isFetching ? { rotate: 360 } : { rotate: 0 }}
              transition={isFetching ? { repeat: Infinity, ease: 'linear', duration: 1.4 } : { type: 'spring', stiffness: 200, damping: 15 }}
            >
              <RefreshCw className={`w-5 h-5 ${isFetching ? 'text-primary' : ''}`} />
            </motion.div>
          </motion.button>

          <motion.button
            id="btn-share-app"
            onClick={onShare}
            whileTap={{ scale: 0.9 }}
            className="p-2.5 rounded-xl text-slate-400 hover:text-on-surface hover:bg-white/[0.06] transition-colors cursor-pointer"
            aria-label="Compartir"
          >
            <Share2 className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
};
