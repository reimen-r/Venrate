import { AlertTriangle, RefreshCw } from 'lucide-react';

interface FallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="fluid-card rounded-2xl p-8 max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-error/10 flex items-center justify-center border border-error/20">
          <AlertTriangle className="w-8 h-8 text-error" />
        </div>
        <div className="space-y-2">
          <h2 className="font-sans text-xl font-bold text-on-surface">Algo salió mal</h2>
          <p className="font-sans text-sm text-on-surface-variant/80 leading-relaxed">
            Ocurrió un error inesperado. Puedes intentar recargar la aplicación.
          </p>
        </div>
        {error && (
          <details className="text-left">
            <summary className="font-mono text-xs text-on-surface-variant/60 cursor-pointer hover:text-on-surface">
              Detalles técnicos
            </summary>
            <pre className="mt-2 p-3 bg-surface-container-low rounded-xl font-mono text-[10px] text-error leading-relaxed overflow-auto max-h-32">
              {error.message}
            </pre>
          </details>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={resetErrorBoundary}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary font-sans font-semibold text-sm rounded-xl hover:brightness-105 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-on-surface/5 text-on-surface font-sans font-semibold text-sm rounded-xl hover:bg-on-surface/10 transition-all cursor-pointer"
          >
            Recargar página
          </button>
        </div>
      </div>
    </div>
  );
}
