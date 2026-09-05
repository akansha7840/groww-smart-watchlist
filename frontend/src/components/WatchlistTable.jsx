import React, { useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Info, 
  Trash2, 
  Plus, 
  AlertTriangle, 
  Check, 
  Zap, 
  ChevronRight,
  TrendingUp
} from 'lucide-react';

export default function WatchlistTable({
  items,
  liveQuotes,
  activeFilter,
  onFilterChange,
  onOpenAddModal,
  onOpenDetailModal,
  onRemoveStock,
  priceFlashMap
}) {
  const [sortBy, setSortBy] = useState("ATTENTION"); // "ATTENTION", "CHANGE", "VOLUME", "PRICE"

  // Filter items
  const filtered = items.filter((item) => {
    if (activeFilter === "ALL") return true;
    return item.attention_tier === activeFilter;
  });

  // Sort items
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "ATTENTION") return b.attention_score - a.attention_score;
    if (sortBy === "CHANGE") return Math.abs(b.delta_percent) - Math.abs(a.delta_percent);
    if (sortBy === "VOLUME") return b.volume_ratio - a.volume_ratio;
    if (sortBy === "PRICE") return b.current_price - a.current_price;
    return 0;
  });

  return (
    <div className="rounded-2xl bg-groww-card border border-groww-cardBorder overflow-hidden shadow-xl">
      
      {/* Table Header Controls */}
      <div className="p-4 sm:p-5 border-b border-groww-cardBorder flex flex-wrap items-center justify-between gap-3">
        
        {/* Filter Tabs */}
        <div className="flex items-center space-x-1.5 bg-groww-bg p-1 rounded-xl border border-groww-cardBorder">
          {[
            { id: "ALL", label: `All (${items.length})` },
            { id: "HIGH_ATTENTION", label: "🔴 High Attention" },
            { id: "DEVELOPING", label: "🟡 Developing" },
            { id: "NOISE", label: "🟢 Calm / Noise" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => onFilterChange(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeFilter === tab.id
                  ? "bg-groww-card text-groww-textPrimary shadow-sm border border-groww-cardBorder"
                  : "text-groww-textMuted hover:text-groww-textSecondary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Action & Sorting Controls */}
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center space-x-1 text-xs text-groww-textMuted">
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-groww-bg text-groww-textPrimary text-xs px-2 py-1 rounded-lg border border-groww-cardBorder focus:outline-none focus:border-groww-green"
            >
              <option value="ATTENTION">⚡ Attention Rank</option>
              <option value="CHANGE">% Delta Move</option>
              <option value="VOLUME">📊 Volume Ratio</option>
              <option value="PRICE">Price</option>
            </select>
          </div>

          <button
            onClick={onOpenAddModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-groww-green text-black font-semibold text-xs hover:bg-emerald-400 transition-colors shadow-md shadow-groww-green/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Stock</span>
          </button>
        </div>

      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-[11px] font-semibold text-groww-textMuted uppercase tracking-wider bg-groww-bg/50 border-b border-groww-cardBorder">
            <tr>
              <th className="py-3 px-4">Company / Sector</th>
              <th className="py-3 px-4 text-right">Current Price</th>
              <th className="py-3 px-4 text-right">Delta Since Away</th>
              <th className="py-3 px-4 text-center">Volume Ratio</th>
              <th className="py-3 px-4 text-center">Attention Rank</th>
              <th className="py-3 px-4">Why It Deserves Attention</th>
              <th className="py-3 px-3 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-groww-cardBorder/50">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-groww-textMuted">
                  No stocks match this filter.
                </td>
              </tr>
            ) : (
              sorted.map((item) => {
                const live = liveQuotes[item.symbol] || {};
                const currentPrice = live.price || item.current_price;
                const isPriceUp = item.delta_percent >= 0;
                const flashClass = priceFlashMap[item.symbol] || "";

                return (
                  <tr
                    key={item.symbol}
                    className="hover:bg-groww-bg/40 transition-colors group cursor-pointer"
                    onClick={() => onOpenDetailModal(item)}
                  >
                    {/* Stock Name & Sector */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-groww-textPrimary group-hover:text-groww-green transition-colors">
                        {item.name}
                      </div>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        <span className="text-xs font-mono text-groww-textMuted">{item.symbol}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-groww-bg border border-groww-cardBorder text-groww-textSecondary">
                          {item.sector}
                        </span>
                      </div>
                    </td>

                    {/* Current Price */}
                    <td className="py-3.5 px-4 text-right">
                      <div className={`font-mono font-bold text-sm text-groww-textPrimary px-1 rounded transition-colors inline-block ${flashClass}`}>
                        ₹{currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[11px] text-groww-textMuted font-mono">
                        Base: ₹{item.last_seen_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </td>

                    {/* Delta Since Away */}
                    <td className="py-3.5 px-4 text-right">
                      <div className={`inline-flex items-center space-x-0.5 font-semibold text-xs font-mono ${
                        isPriceUp ? "text-groww-green" : "text-groww-red"
                      }`}>
                        {isPriceUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        <span>{isPriceUp ? "+" : ""}{item.delta_percent}%</span>
                      </div>
                      <div className="text-[11px] text-groww-textMuted font-mono">
                        {isPriceUp ? "+" : ""}₹{item.delta_price}
                      </div>
                    </td>

                    {/* Volume Ratio */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-groww-bg border border-groww-cardBorder">
                        <span className={item.volume_ratio >= 2.0 ? "text-groww-amber font-bold" : "text-groww-textSecondary"}>
                          {item.volume_ratio}x
                        </span>
                      </div>
                      <div className="text-[10px] text-groww-textMuted mt-0.5">
                        vs 30D avg
                      </div>
                    </td>

                    {/* Attention Rank Badge */}
                    <td className="py-3.5 px-4 text-center">
                      {item.attention_tier === "HIGH_ATTENTION" && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-groww-red/15 text-groww-red border border-groww-red/30">
                          <Zap className="w-3 h-3 fill-current" />
                          <span>High Priority</span>
                        </span>
                      )}
                      {item.attention_tier === "DEVELOPING" && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-groww-amber/15 text-groww-amber border border-groww-amber/30">
                          <TrendingUp className="w-3 h-3" />
                          <span>Developing</span>
                        </span>
                      )}
                      {item.attention_tier === "NOISE" && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-groww-green/10 text-groww-green border border-groww-green/20">
                          <span>Normal Noise</span>
                        </span>
                      )}
                    </td>

                    {/* Key Catalyst Reason */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-xs text-groww-textSecondary line-clamp-2 leading-relaxed">
                        {item.catalysts[0]}
                      </p>
                    </td>

                    {/* Row Action Buttons */}
                    <td className="py-3.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onRemoveStock(item.symbol)}
                        className="p-1.5 rounded-lg text-groww-textMuted hover:text-groww-red hover:bg-groww-red/10 transition-colors"
                        title="Remove from Watchlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
