import { AlertTriangle, RefreshCw } from 'lucide-react';

interface FallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="min-h-screen bg-[#05060e] flex items-center justify-center p-6">
      <div className="glass-strong rounded-3xl p-8 max-w-md w-full text-center space-y-6 border border-tertiary/10">
        <div className="w-16 h-16 mx-auto rounded-full bg-tertiary/10 flex items-center justify-center border border-tertiary/20">
          <AlertTriangle className="w-8 h-8 text-tertiary" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-xl font-bold text-on-surface">Algo salió mal</h2>
          <p className="font-sans text-sm text-slate-400 leading-relaxed">
            Ocurrió un error inesperado. Puedes intentar recargar la aplicación.
          </p>
        </div>
        {error && (
          <details className="text-left">
            <summary className="font-mono text-xs text-slate-500 cursor-pointer hover:text-slate-300">
              Detalles técnicos
            </summary>
            <pre className="mt-2 p-3 bg-white/[0.02] rounded-xl font-mono text-[10px] text-tertiary leading-relaxed overflow-auto max-h-32">
              {error.message}
            </pre>
          </details>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={resetErrorBoundary}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-primary to-secondary text-on-surface font-sans font-semibold text-sm transition-all hover:brightness-110 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-2xl bg-white/[0.04] text-slate-300 font-sans font-semibold text-sm hover:bg-white/[0.06] transition-all cursor-pointer"
          >
            Recargar página
          </button>
        </div>
      </div>
    </div>
  );
}
