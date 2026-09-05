import React, { useState } from 'react';
import { 
  X, 
  Clock, 
  Zap, 
  AlertTriangle, 
  RotateCcw, 
  Sliders, 
  WifiOff, 
  Activity,
  Check
} from 'lucide-react';

export default function ChaosDrawer({
  isOpen,
  onClose,
  timeTravelMinutes,
  onTimeTravelChange,
  onApplyChaos,
  onResetChaos,
  activeChaos
}) {
  const [selectedStock, setSelectedStock] = useState("RELIANCE.NS");
  const [shockPercent, setShockPercent] = useState(4.5);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-groww-card border-l border-groww-cardBorder shadow-2xl p-5 overflow-y-auto animate-in slide-in-from-right duration-200">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-groww-cardBorder">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-groww-amber/20 text-groww-amber">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-groww-textPrimary">Judge Sandbox & Chaos</h3>
            <p className="text-[11px] text-groww-textMuted">Test resilience & edge cases live</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-groww-textMuted hover:text-groww-textPrimary hover:bg-groww-bg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="py-5 space-y-6">
        
        {/* Tool 1: Time-Travel Scrubber */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-groww-textPrimary flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-groww-green" />
              <span>Time-Travel Scrubber</span>
            </label>
            <span className="text-xs font-mono font-bold text-groww-green">
              {timeTravelMinutes === 0 ? "Live Baseline" : `-${timeTravelMinutes}m`}
            </span>
          </div>

          <p className="text-[11px] text-groww-textSecondary leading-relaxed">
            Drag the slider to rewind when you "last checked" and see the Diff Engine recalculate instantly:
          </p>

          <input
            type="range"
            min="0"
            max="240"
            step="15"
            value={timeTravelMinutes}
            onChange={(e) => onTimeTravelChange(parseInt(e.target.value))}
            className="w-full h-1.5 bg-groww-bg rounded-lg appearance-none cursor-pointer accent-groww-green"
          />

          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {[
              { label: "Live", mins: 0 },
              { label: "30m", mins: 30 },
              { label: "1h", mins: 60 },
              { label: "3h", mins: 180 },
            ].map((preset) => (
              <button
                key={preset.mins}
                onClick={() => onTimeTravelChange(preset.mins)}
                className={`py-1 text-xs rounded-lg font-medium transition-all ${
                  timeTravelMinutes === preset.mins
                    ? "bg-groww-green text-black font-bold"
                    : "bg-groww-bg text-groww-textMuted hover:text-groww-textPrimary border border-groww-cardBorder"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tool 2: Stale Feed / Network Failure Simulator */}
        <div className="pt-4 border-t border-groww-cardBorder space-y-3">
          <label className="text-xs font-semibold text-groww-textPrimary flex items-center space-x-1.5">
            <WifiOff className="w-4 h-4 text-groww-amber" />
            <span>Simulate Feed Stagnation / Latency</span>
          </label>
          <p className="text-[11px] text-groww-textSecondary leading-relaxed">
            Tests how the UI handles upstream broker packet drops by degrading live feed to stale state:
          </p>
          <button
            onClick={() => onApplyChaos({ simulate_stale_feed: !activeChaos?.simulate_stale_feed })}
            className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all border ${
              activeChaos?.simulate_stale_feed
                ? "bg-groww-amber/20 border-groww-amber text-groww-amber"
                : "bg-groww-bg border-groww-cardBorder text-groww-textSecondary hover:text-groww-textPrimary"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>
              {activeChaos?.simulate_stale_feed ? "Disable Stale Simulation (Return to Live)" : "Simulate Stale Feed (>15s Latency)"}
            </span>
          </button>
        </div>

        {/* Tool 3: Flash Volatility Shock */}
        <div className="pt-4 border-t border-groww-cardBorder space-y-3">
          <label className="text-xs font-semibold text-groww-textPrimary flex items-center space-x-1.5">
            <Zap className="w-4 h-4 text-groww-red" />
            <span>Inject Flash Shock Volatility</span>
          </label>
          <p className="text-[11px] text-groww-textSecondary leading-relaxed">
            Injects an artificial sudden surge (+4.5%) with institutional volume to test real-time re-ranking into 🔴 High Attention:
          </p>

          <div className="flex space-x-2">
            <select
              value={selectedStock}
              onChange={(e) => setSelectedStock(e.target.value)}
              className="flex-1 bg-groww-bg text-groww-textPrimary text-xs px-2 py-1.5 rounded-lg border border-groww-cardBorder focus:outline-none focus:border-groww-green"
            >
              <option value="RELIANCE.NS">Reliance (Energy)</option>
              <option value="TCS.NS">TCS (IT)</option>
              <option value="TATAMOTORS.NS">Tata Motors (Auto)</option>
              <option value="HDFCBANK.NS">HDFC Bank (Banking)</option>
            </select>

            <button
              onClick={() => onApplyChaos({ flash_shock_symbol: selectedStock, flash_shock_percent: shockPercent })}
              className="px-3 py-1.5 rounded-lg bg-groww-red/20 border border-groww-red/40 text-groww-red font-semibold text-xs hover:bg-groww-red/30 transition-all"
            >
              Spike +{shockPercent}%
            </button>
          </div>
        </div>

        {/* Reset Button */}
        <div className="pt-6 border-t border-groww-cardBorder">
          <button
            onClick={onResetChaos}
            className="w-full py-2.5 rounded-xl bg-groww-card hover:bg-groww-cardBorder border border-groww-cardBorder text-xs font-semibold text-groww-textPrimary flex items-center justify-center space-x-2 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 text-groww-textMuted" />
            <span>Reset All Chaos Overrides</span>
          </button>
        </div>

      </div>

    </div>
  );
}
