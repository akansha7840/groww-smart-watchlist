import React, { useState } from 'react';
import { 
  TrendingUp, 
  Activity, 
  CheckCheck, 
  Sliders, 
  Plus, 
  ChevronDown, 
  AlertTriangle, 
  CheckCircle2,
  Layers
} from 'lucide-react';

export default function Navbar({
  watchlists,
  activeWatchlist,
  onSelectWatchlist,
  onCreateWatchlist,
  onMarkAsSeen,
  feedStatus,
  onToggleChaos,
  isChaosOpen,
  isMarkingSeen,
  activeChaosCount
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [newWlName, setNewWlName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newWlName.trim()) return;
    onCreateWatchlist(newWlName.trim());
    setNewWlName("");
    setIsCreating(false);
    setShowDropdown(false);
  };

  return (
    <header className="border-b border-groww-cardBorder bg-groww-card/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-groww-green to-emerald-400 flex items-center justify-center shadow-lg shadow-groww-green/20">
            <TrendingUp className="w-6 h-6 text-black" strokeWidth={2.5} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-groww-textPrimary">Chronos</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-groww-accent/20 text-indigo-400 border border-groww-accent/30">
                Groww CODE '26
              </span>
            </div>
            <p className="text-xs text-groww-textMuted hidden sm:block">Context-Aware Market Watchlist Engine</p>
          </div>
        </div>

        {/* Center: Watchlist Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-groww-bg hover:bg-groww-cardBorder/50 border border-groww-cardBorder transition-colors text-sm font-medium text-groww-textPrimary"
          >
            <Layers className="w-4 h-4 text-groww-green" />
            <span>{activeWatchlist?.name || "Select Watchlist"}</span>
            <ChevronDown className="w-4 h-4 text-groww-textMuted" />
          </button>

          {showDropdown && (
            <div className="absolute left-0 mt-2 w-64 rounded-xl bg-groww-card border border-groww-cardBorder shadow-2xl p-2 z-50">
              <div className="text-[11px] font-semibold text-groww-textMuted uppercase tracking-wider px-2 py-1">
                Your Watchlists
              </div>
              <div className="space-y-1 my-1">
                {watchlists.map((wl) => (
                  <button
                    key={wl.id}
                    onClick={() => {
                      onSelectWatchlist(wl);
                      setShowDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${
                      activeWatchlist?.id === wl.id
                        ? "bg-groww-green/10 text-groww-green font-medium"
                        : "text-groww-textSecondary hover:bg-groww-bg hover:text-groww-textPrimary"
                    }`}
                  >
                    <span>{wl.name}</span>
                    {activeWatchlist?.id === wl.id && <CheckCircle2 className="w-4 h-4" />}
                  </button>
                ))}
              </div>

              {isCreating ? (
                <form onSubmit={handleCreate} className="pt-2 border-t border-groww-cardBorder">
                  <input
                    type="text"
                    placeholder="Watchlist name..."
                    value={newWlName}
                    onChange={(e) => setNewWlName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-groww-bg rounded-lg border border-groww-cardBorder text-groww-textPrimary focus:outline-none focus:border-groww-green"
                    autoFocus
                  />
                  <div className="flex justify-end space-x-1.5 mt-2">
                    <button
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="px-2 py-1 text-xs text-groww-textMuted hover:text-groww-textPrimary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-2.5 py-1 text-xs rounded bg-groww-green text-black font-semibold hover:bg-emerald-400"
                    >
                      Save
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setIsCreating(true)}
                  className="w-full mt-1 pt-2 border-t border-groww-cardBorder text-xs text-groww-green flex items-center justify-center space-x-1 py-1.5 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Watchlist</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right: Feed Status, Mark Seen & Judge Chaos */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* Feed Health Indicator */}
          <div className="hidden md:flex items-center space-x-2 px-2.5 py-1 rounded-full bg-groww-bg border border-groww-cardBorder text-xs">
            {feedStatus === "LIVE" ? (
              <>
                <span className="w-2 h-2 rounded-full bg-groww-green animate-ping" />
                <span className="text-groww-green font-medium">Live Feed (SSE)</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-groww-amber" />
                <span className="text-groww-amber font-medium">Stale Feed (Fallback)</span>
              </>
            )}
          </div>

          {/* Mark as Seen Button */}
          <button
            onClick={onMarkAsSeen}
            disabled={isMarkingSeen}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-groww-card hover:bg-groww-cardBorder text-xs font-medium text-groww-textSecondary hover:text-groww-textPrimary border border-groww-cardBorder transition-all"
            title="Save current market state as your new baseline checkpoint"
          >
            <CheckCheck className="w-3.5 h-3.5 text-groww-green" />
            <span className="hidden sm:inline">Mark as Seen</span>
          </button>

          {/* Judge Chaos & Simulation Button */}
          <button
            onClick={onToggleChaos}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isChaosOpen || activeChaosCount > 0
                ? "bg-groww-amber/20 border-groww-amber text-groww-amber shadow-lg shadow-groww-amber/10"
                : "bg-groww-bg hover:bg-groww-cardBorder/50 border-groww-cardBorder text-groww-textPrimary"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Judge Sandbox</span>
            {activeChaosCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-groww-amber text-black text-[10px] font-bold flex items-center justify-center">
                {activeChaosCount}
              </span>
            )}
          </button>

        </div>

      </div>
    </header>
  );
}
