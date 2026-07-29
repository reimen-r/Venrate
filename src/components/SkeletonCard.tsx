export function SkeletonCard() {
  return (
    <div className="p-6 rounded-2xl bg-surface-container/50 border border-on-surface/5 min-h-[190px] animate-pulse">
      <div className="flex justify-between items-start">
        <div className="space-y-3">
          <div className="h-5 w-28 rounded-lg bg-on-surface/10" />
          <div className="h-3 w-20 rounded-lg bg-on-surface/5" />
        </div>
        <div className="h-6 w-16 rounded-full bg-on-surface/10" />
      </div>
      <div className="mt-8 flex items-baseline justify-between">
        <div className="space-y-2">
          <div className="h-9 w-32 rounded-lg bg-on-surface/10" />
          <div className="h-3 w-16 rounded-lg bg-on-surface/5" />
        </div>
        <div className="h-8 w-8 rounded-full bg-on-surface/10" />
      </div>
    </div>
  );
}

export function SkeletonListRow() {
  return (
    <div className="p-4 flex items-center justify-between animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-on-surface/10" />
        <div className="space-y-2">
          <div className="h-4 w-24 rounded bg-on-surface/10" />
          <div className="h-3 w-16 rounded bg-on-surface/5" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="space-y-1 text-right">
          <div className="h-4 w-20 rounded bg-on-surface/10 ml-auto" />
          <div className="h-3 w-10 rounded bg-on-surface/5 ml-auto" />
        </div>
        <div className="h-5 w-14 rounded-full bg-on-surface/10" />
      </div>
    </div>
  );
}
