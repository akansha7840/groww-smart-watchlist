import React from 'react';
import { 
  Clock, 
  Sparkles, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  Volume2, 
  ShieldCheck,
  Zap
} from 'lucide-react';

export default function BriefingCard({ 
  diffSummary, 
  activeFilter, 
  onFilterChange,
  isLoading 
}) {
  if (isLoading || !diffSummary) {
    return (
      <div className="rounded-2xl bg-groww-card border border-groww-cardBorder p-6 animate-pulse">
        <div className="h-4 bg-groww-cardBorder rounded w-1/4 mb-4" />
        <div className="h-6 bg-groww-cardBorder rounded w-2/3 mb-6" />
        <div className="grid grid-cols-3 gap-4">
          <div className="h-16 bg-groww-cardBorder rounded-xl" />
          <div className="h-16 bg-groww-cardBorder rounded-xl" />
          <div className="h-16 bg-groww-cardBorder rounded-xl" />
        </div>
      </div>
    );
  }

  const {
    elapsed_minutes,
    last_seen_at,
    headline_summary,
    high_attention_count,
    developing_count,
    noise_count,
    sector_summary
  } = diffSummary;

  const formattedTime = new Date(last_seen_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  const formattedElapsed = 
    elapsed_minutes >= 60 
      ? `${Math.floor(elapsed_minutes / 60)}h ${elapsed_minutes % 60}m ago`
      : `${elapsed_minutes}m ago`;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-groww-card to-groww-card/90 border border-groww-cardBorder shadow-xl p-5 sm:p-6 mb-8">
      {/* Subtle Glow Accent */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-groww-green/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-groww-green">
          <Sparkles className="w-4 h-4" />
          <span>While You Were Away • Intelligence Briefing</span>
        </div>
        <div className="flex items-center space-x-1.5 text-xs text-groww-textMuted bg-groww-bg/80 px-2.5 py-1 rounded-full border border-groww-cardBorder">
          <Clock className="w-3.5 h-3.5 text-groww-textSecondary" />
          <span>Last checked: <strong className="text-groww-textPrimary">{formattedTime}</strong> ({formattedElapsed})</span>
        </div>
      </div>

      {/* Main Headline */}
      <h2 className="text-lg sm:text-xl font-bold text-groww-textPrimary mb-4 leading-snug">
        {headline_summary}
      </h2>

      {/* Attention Tier Quick Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        
        {/* High Attention Pill */}
        <button
          onClick={() => onFilterChange(activeFilter === "HIGH_ATTENTION" ? "ALL" : "HIGH_ATTENTION")}
          className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
            activeFilter === "HIGH_ATTENTION"
              ? "bg-groww-red/15 border-groww-red ring-1 ring-groww-red text-groww-red"
              : "bg-groww-bg/60 border-groww-cardBorder hover:border-groww-red/50 text-groww-textSecondary"
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-groww-red/20 flex items-center justify-center text-groww-red">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-medium text-groww-textMuted">Action Required</div>
              <div className="text-sm font-bold text-groww-textPrimary">High Attention</div>
            </div>
          </div>
          <span className="text-lg font-black text-groww-red px-2 py-0.5 rounded-lg bg-groww-red/10">
            {high_attention_count}
          </span>
        </button>

        {/* Developing Pill */}
        <button
          onClick={() => onFilterChange(activeFilter === "DEVELOPING" ? "ALL" : "DEVELOPING")}
          className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
            activeFilter === "DEVELOPING"
              ? "bg-groww-amber/15 border-groww-amber ring-1 ring-groww-amber text-groww-amber"
              : "bg-groww-bg/60 border-groww-cardBorder hover:border-groww-amber/50 text-groww-textSecondary"
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-groww-amber/20 flex items-center justify-center text-groww-amber">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-medium text-groww-textMuted">Momentum Drift</div>
              <div className="text-sm font-bold text-groww-textPrimary">Developing</div>
            </div>
          </div>
          <span className="text-lg font-black text-groww-amber px-2 py-0.5 rounded-lg bg-groww-amber/10">
            {developing_count}
          </span>
        </button>

        {/* Calm / In-line Pill */}
        <button
          onClick={() => onFilterChange(activeFilter === "NOISE" ? "ALL" : "NOISE")}
          className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
            activeFilter === "NOISE"
              ? "bg-groww-green/15 border-groww-green ring-1 ring-groww-green text-groww-green"
              : "bg-groww-bg/60 border-groww-cardBorder hover:border-groww-green/50 text-groww-textSecondary"
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-groww-green/20 flex items-center justify-center text-groww-green">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-medium text-groww-textMuted">Within Normal Bands</div>
              <div className="text-sm font-bold text-groww-textPrimary">Calm / Noise</div>
            </div>
          </div>
          <span className="text-lg font-black text-groww-green px-2 py-0.5 rounded-lg bg-groww-green/10">
            {noise_count}
          </span>
        </button>

      </div>

      {/* Sector Relative Performance Strip */}
      {sector_summary && Object.keys(sector_summary).length > 0 && (
        <div className="pt-3 border-t border-groww-cardBorder/60 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-groww-textMuted font-medium">Sector Baseline Moves:</span>
          {Object.entries(sector_summary).map(([sector, avgDelta]) => {
            const isPositive = avgDelta >= 0;
            return (
              <span 
                key={sector}
                className="px-2 py-0.5 rounded-md bg-groww-bg border border-groww-cardBorder text-groww-textSecondary flex items-center space-x-1"
              >
                <span>{sector}:</span>
                <span className={`font-semibold ${isPositive ? "text-groww-green" : "text-groww-red"}`}>
                  {isPositive ? "+" : ""}{avgDelta}%
                </span>
              </span>
            );
          })}
        </div>
      )}

    </div>
  );
}
