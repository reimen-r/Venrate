import React from 'react';
import { ArrowDown } from 'lucide-react';

interface ShareableConversionCardProps {
  fromAmount: number;
  fromCurrencyCode: string;
  toAmount: number;
  toCurrencyCode: string;
  rate: number;
  note: string;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  USDT: '₮',
  VES: 'Bs',
};

const formatAmount = (value: number, decimals: number) =>
  value.toLocaleString('es-VE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const cardRef = React.forwardRef<HTMLDivElement, ShareableConversionCardProps>(
  ({ fromAmount, fromCurrencyCode, toAmount, toCurrencyCode, rate, note }, ref) => {
    const fromSymbol = CURRENCY_SYMBOLS[fromCurrencyCode] || fromCurrencyCode;
    const toSymbol = CURRENCY_SYMBOLS[toCurrencyCode] || toCurrencyCode;
    const toDecimals = toCurrencyCode === 'VES' ? 2 : 4;
    const today = new Date().toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });

    return (
      <div
        ref={ref}
        style={{ background: '#0a0d1a' }}
        className="relative overflow-hidden rounded-3xl w-[320px] p-6 font-sans text-[#eaecfa]"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 w-48 h-48 rounded-full bg-[#22d3ee]/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 w-40 h-40 rounded-full bg-[#8b5cf6]/10 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.3)' }}>
              <svg viewBox="0 0 100 100" className="w-4 h-4" fill="none">
                <defs>
                  <linearGradient id="vShareGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00D9FF" />
                    <stop offset="50%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#FF00E5" />
                  </linearGradient>
                </defs>
                <path d="M 28 22 L 50 65 L 72 22" stroke="url(#vShareGrad)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-[#eaecfa]">Venrate</span>
            <span className="ml-auto font-mono text-[9px] uppercase tracking-widest text-[#9094bf]">Conversor</span>
          </div>

          <div className="rounded-2xl p-4 mb-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#9094bf] font-semibold">De</span>
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ background: 'rgba(255,255,255,0.06)' }}>
                {fromCurrencyCode}
              </span>
            </div>
            <p className="font-mono text-2xl font-extrabold tracking-tight text-[#eaecfa]">
              {fromSymbol} {formatAmount(fromAmount, 2)}
            </p>
          </div>

          <div className="flex justify-center -my-1.5 relative z-10">
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#0a0d1a', border: '1px solid rgba(255,255,255,0.1)' }}>
              <ArrowDown className="w-4 h-4 text-[#22d3ee]" />
            </div>
          </div>

          <div
            className="rounded-2xl p-4 mb-4"
            style={{
              background: 'linear-gradient(135deg, rgba(34,211,238,0.14), rgba(139,92,246,0.16))',
              border: '1px solid rgba(34,211,238,0.2)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#9094bf] font-semibold">A</span>
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md text-[#22d3ee]" style={{ background: 'rgba(34,211,238,0.12)' }}>
                {toCurrencyCode}
              </span>
            </div>
            <p className="font-mono text-3xl font-extrabold tracking-tight bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, #22d3ee, #8b5cf6)' }}>
              {toSymbol} {formatAmount(toAmount, toDecimals)}
            </p>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-[#9094bf] mb-4">
            <span>1 {fromCurrencyCode}</span>
            <span>≈</span>
            <span className="font-bold text-[#22d3ee]">{rate.toFixed(4)}</span>
            <span>{toCurrencyCode}</span>
          </div>

          {note.trim() !== '' && (
            <div
              className="rounded-2xl p-4 mb-4"
              style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)' }}
            >
              <p className="font-sans text-sm leading-relaxed text-[#f5d78e] whitespace-pre-wrap break-words">{note}</p>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <span className="font-mono text-[9px] text-[#9094bf]">{today}</span>
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#9094bf]">Tasa en vivo · Venrate</span>
          </div>
        </div>
      </div>
    );
  }
);

cardRef.displayName = 'ShareableConversionCard';

export const ShareableConversionCard = cardRef;