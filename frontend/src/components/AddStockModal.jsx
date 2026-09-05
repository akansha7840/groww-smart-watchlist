import React, { useState, useEffect } from 'react';
import { Search, Plus, X, Check, Building2 } from 'lucide-react';
import { searchCatalog } from '../api';

export default function AddStockModal({ isOpen, onClose, onAddStock, existingSymbols }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await searchCatalog(query);
        setResults(data);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [query, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-groww-card border border-groww-cardBorder shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-groww-cardBorder flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-groww-green" />
            <h3 className="text-base font-bold text-groww-textPrimary">Add Stock to Watchlist</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-groww-textMuted hover:text-groww-textPrimary hover:bg-groww-bg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-groww-cardBorder bg-groww-bg/50">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-groww-textMuted" />
            <input
              type="text"
              placeholder="Search by company name, symbol, or sector (e.g., Tata, Reliance, IT)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-groww-card rounded-xl border border-groww-cardBorder text-groww-textPrimary focus:outline-none focus:border-groww-green focus:ring-1 focus:ring-groww-green"
              autoFocus
            />
          </div>
        </div>

        {/* Search Results List */}
        <div className="max-h-80 overflow-y-auto divide-y divide-groww-cardBorder/50 p-2">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-groww-textMuted animate-pulse">
              Searching Nifty stock catalog...
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-xs text-groww-textMuted">
              No matching stocks found. Try searching "Reliance", "Tata", or "Bank".
            </div>
          ) : (
            results.map((stock) => {
              const isAlreadyAdded = existingSymbols.includes(stock.symbol);
              return (
                <div
                  key={stock.symbol}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-groww-bg/50 transition-colors"
                >
                  <div>
                    <div className="text-sm font-semibold text-groww-textPrimary">{stock.name}</div>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="text-xs font-mono text-groww-textMuted">{stock.symbol}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-groww-bg border border-groww-cardBorder text-groww-textSecondary">
                        {stock.sector}
                      </span>
                    </div>
                  </div>

                  <button
                    disabled={isAlreadyAdded}
                    onClick={() => {
                      onAddStock(stock);
                      onClose();
                    }}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isAlreadyAdded
                        ? "bg-groww-bg text-groww-textMuted cursor-not-allowed border border-groww-cardBorder"
                        : "bg-groww-green text-black hover:bg-emerald-400 shadow-sm"
                    }`}
                  >
                    {isAlreadyAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Added</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-groww-bg/80 border-t border-groww-cardBorder text-[11px] text-groww-textMuted text-center">
          Real-time quotes powered by Yahoo Finance Indian Stock Exchange Feed.
        </div>

      </div>
    </div>
  );
}
