import React from 'react';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Volume2, 
  BarChart3, 
  Layers, 
  Info,
  ShieldCheck
} from 'lucide-react';

export default function StockDetailModal({ stock, isOpen, onClose }) {
  if (!isOpen || !stock) return null;

  const isPriceUp = stock.delta_percent >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl rounded-2xl bg-groww-card border border-groww-cardBorder shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-groww-cardBorder flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-groww-textPrimary">{stock.name}</h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-groww-bg border border-groww-cardBorder text-groww-textMuted">
                {stock.symbol}
              </span>
            </div>
            <div className="flex items-center space-x-2 mt-1 text-xs text-groww-textSecondary">
              <span>Sector: <strong className="text-groww-textPrimary">{stock.sector}</strong></span>
              <span>•</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                stock.attention_tier === "HIGH_ATTENTION"
                  ? "bg-groww-red/15 text-groww-red"
                  : stock.attention_tier === "DEVELOPING"
                  ? "bg-groww-amber/15 text-groww-amber"
                  : "bg-groww-green/10 text-groww-green"
              }`}>
                {stock.attention_tier.replace("_", " ")}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-groww-textMuted hover:text-groww-textPrimary hover:bg-groww-bg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current & Delta Price Ribbon */}
        <div className="p-5 bg-groww-bg/50 border-b border-groww-cardBorder grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-groww-textMuted">Current Price</div>
            <div className="text-lg font-bold font-mono text-groww-textPrimary mt-0.5">
              ₹{stock.current_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div>
            <div className="text-xs text-groww-textMuted">Since You Left</div>
            <div className={`text-lg font-bold font-mono mt-0.5 ${isPriceUp ? "text-groww-green" : "text-groww-red"}`}>
              {isPriceUp ? "+" : ""}{stock.delta_percent}%
            </div>
          </div>

          <div>
            <div className="text-xs text-groww-textMuted">Baseline Price</div>
            <div className="text-lg font-bold font-mono text-groww-textSecondary mt-0.5">
              ₹{stock.last_seen_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div>
            <div className="text-xs text-groww-textMuted">Volume Surge</div>
            <div className="text-lg font-bold font-mono text-groww-amber mt-0.5">
              {stock.volume_ratio}x
            </div>
          </div>
        </div>

        {/* Intelligence Breakdown: 4 Factors of Attention */}
        <div className="p-5 space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-groww-textMuted flex items-center space-x-1.5">
            <Zap className="w-4 h-4 text-groww-green" />
            <span>Attention Score Breakdown ({stock.attention_score} / 1.0)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Factor 1: Volume */}
            <div className="p-3 rounded-xl bg-groww-bg border border-groww-cardBorder">
              <div className="flex items-center justify-between text-xs text-groww-textMuted">
                <span>Volume Ratio</span>
                <Volume2 className="w-3.5 h-3.5 text-groww-amber" />
              </div>
              <div className="text-base font-bold font-mono text-groww-textPrimary mt-1">
                {stock.volume_ratio}x
              </div>
              <div className="text-[11px] text-groww-textSecondary mt-1">
                {stock.volume_ratio >= 2.0 ? "Heavy institutional flow" : "Normal trading activity"}
              </div>
            </div>

            {/* Factor 2: Sector Alpha */}
            <div className="p-3 rounded-xl bg-groww-bg border border-groww-cardBorder">
              <div className="flex items-center justify-between text-xs text-groww-textMuted">
                <span>Sector Alpha</span>
                <Layers className="w-3.5 h-3.5 text-groww-accent" />
              </div>
              <div className={`text-base font-bold font-mono mt-1 ${stock.relative_alpha >= 0 ? "text-groww-green" : "text-groww-red"}`}>
                {stock.relative_alpha >= 0 ? "+" : ""}{stock.relative_alpha}%
              </div>
              <div className="text-[11px] text-groww-textSecondary mt-1">
                vs {stock.sector} benchmark ({stock.sector_delta_percent >= 0 ? "+" : ""}{stock.sector_delta_percent}%)
              </div>
            </div>

            {/* Factor 3: Milestone Breaches */}
            <div className="p-3 rounded-xl bg-groww-bg border border-groww-cardBorder">
              <div className="flex items-center justify-between text-xs text-groww-textMuted">
                <span>Milestones</span>
                <ShieldCheck className="w-3.5 h-3.5 text-groww-green" />
              </div>
              <div className="text-sm font-bold text-groww-textPrimary mt-1">
                {stock.milestone_flags.length > 0 ? stock.milestone_flags.join(", ") : "None"}
              </div>
              <div className="text-[11px] text-groww-textSecondary mt-1">
                52W High/Low status
              </div>
            </div>

          </div>

          {/* Actionable Catalysts Bullet Points */}
          <div className="pt-3 border-t border-groww-cardBorder">
            <div className="text-xs font-semibold text-groww-textPrimary mb-2">
              Why This Stock Deserves Your Attention:
            </div>
            <ul className="space-y-2">
              {stock.catalysts.map((cat, i) => (
                <li key={i} className="text-xs text-groww-textSecondary flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-groww-green mt-1.5 flex-shrink-0" />
                  <span>{cat}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-groww-bg/80 border-t border-groww-cardBorder flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-groww-card hover:bg-groww-cardBorder border border-groww-cardBorder text-xs font-semibold text-groww-textPrimary transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
