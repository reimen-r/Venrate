export function SkeletonCard() {
  return (
    <div className="glass-card rounded-2xl min-h-[200px] overflow-hidden relative">
      <div className="absolute inset-0 shimmer" />
      <div className="p-6 relative z-10">
        <div className="flex justify-between items-start">
          <div className="space-y-3">
            <div className="h-5 w-28 rounded-xl bg-white/[0.04]" />
            <div className="h-3 w-20 rounded-xl bg-white/[0.03]" />
          </div>
          <div className="h-6 w-16 rounded-full bg-white/[0.04]" />
        </div>
        <div className="mt-8 flex items-baseline justify-between">
          <div className="space-y-2">
            <div className="h-9 w-32 rounded-xl bg-white/[0.04]" />
            <div className="h-3 w-16 rounded-xl bg-white/[0.03]" />
          </div>
          <div className="h-8 w-8 rounded-full bg-white/[0.04]" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonListRow() {
  return (
    <div className="p-4 flex items-center justify-between relative overflow-hidden">
      <div className="absolute inset-0 shimmer" />
      <div className="flex items-center gap-3 relative z-10">
        <div className="w-10 h-10 rounded-xl bg-white/[0.04]" />
        <div className="space-y-2">
          <div className="h-4 w-24 rounded bg-white/[0.04]" />
          <div className="h-3 w-16 rounded bg-white/[0.03]" />
        </div>
      </div>
      <div className="flex items-center gap-4 relative z-10">
        <div className="space-y-1 text-right">
          <div className="h-4 w-20 rounded bg-white/[0.04] ml-auto" />
          <div className="h-3 w-10 rounded bg-white/[0.03] ml-auto" />
        </div>
        <div className="h-5 w-14 rounded-full bg-white/[0.04]" />
      </div>
    </div>
  );
}
