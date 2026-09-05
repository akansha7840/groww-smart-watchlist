import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import BriefingCard from './components/BriefingCard';
import WatchlistTable from './components/WatchlistTable';
import AddStockModal from './components/AddStockModal';
import StockDetailModal from './components/StockDetailModal';
import ChaosDrawer from './components/ChaosDrawer';
import {
  fetchWatchlists,
  createWatchlist,
  deleteWatchlist,
  addStockToWatchlist,
  removeStockFromWatchlist,
  fetchDiffSummary,
  saveSessionCheckpoint,
  applyChaosSimulation,
  resetChaosSimulation,
  getSimulationStatus,
  subscribeToMarketStream
} from './api';

export default function App() {
  const [watchlists, setWatchlists] = useState([]);
  const [activeWatchlist, setActiveWatchlist] = useState(null);
  const [diffSummary, setDiffSummary] = useState(null);
  const [liveQuotes, setLiveQuotes] = useState({});
  const [feedStatus, setFeedStatus] = useState("LIVE");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [timeTravelMinutes, setTimeTravelMinutes] = useState(0);
  const [isChaosOpen, setIsChaosOpen] = useState(false);
  const [activeChaos, setActiveChaos] = useState({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedStockDetail, setSelectedStockDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingSeen, setIsMarkingSeen] = useState(false);
  const [priceFlashMap, setPriceFlashMap] = useState({});

  const prevQuotesRef = useRef({});

  // 1. Initial Load of Watchlists
  useEffect(() => {
    loadWatchlists();
    refreshChaosStatus();
  }, []);

  const loadWatchlists = async () => {
    try {
      const data = await fetchWatchlists();
      setWatchlists(data);
      if (data.length > 0 && !activeWatchlist) {
        setActiveWatchlist(data[0]);
      }
    } catch (err) {
      console.error("Failed to load watchlists:", err);
    }
  };

  // 2. Load Diff Summary whenever activeWatchlist or timeTravelMinutes changes
  useEffect(() => {
    if (!activeWatchlist) return;
    loadDiff();
  }, [activeWatchlist, timeTravelMinutes]);

  const loadDiff = async () => {
    setIsLoading(true);
    try {
      const summary = await fetchDiffSummary(activeWatchlist?.id, timeTravelMinutes);
      setDiffSummary(summary);
    } catch (err) {
      console.error("Failed to load diff summary:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Real-Time SSE Stream Subscription for Live Market Ticks
  useEffect(() => {
    if (!diffSummary?.items || diffSummary.items.length === 0) return;

    const symbols = diffSummary.items.map((i) => i.symbol);
    const eventSource = subscribeToMarketStream(
      symbols,
      (data) => {
        setFeedStatus(data.feed_status || "LIVE");
        if (data.quotes) {
          const newQuoteMap = {};
          const flashes = {};

          data.quotes.forEach((q) => {
            newQuoteMap[q.symbol] = q;
            const prev = prevQuotesRef.current[q.symbol];
            if (prev && prev.price !== q.price) {
              flashes[q.symbol] = q.price > prev.price ? "flash-up" : "flash-down";
            }
          });

          prevQuotesRef.current = newQuoteMap;
          setLiveQuotes(newQuoteMap);

          if (Object.keys(flashes).length > 0) {
            setPriceFlashMap((prev) => ({ ...prev, ...flashes }));
            setTimeout(() => {
              setPriceFlashMap({});
            }, 1200);
          }
        }
      },
      (err) => {
        setFeedStatus("DELAYED");
      }
    );

    return () => {
      eventSource.close();
    };
  }, [diffSummary?.items?.map((i) => i.symbol).join(",")]);

  const refreshChaosStatus = async () => {
    try {
      const status = await getSimulationStatus();
      setActiveChaos(status);
    } catch (err) {
      console.error(err);
    }
  };

  // Handlers
  const handleCreateWatchlist = async (name) => {
    try {
      const created = await createWatchlist(name);
      setWatchlists([...watchlists, created]);
      setActiveWatchlist(created);
    } catch (err) {
      alert("Failed to create watchlist: " + err.message);
    }
  };

  const handleAddStock = async (stock) => {
    if (!activeWatchlist) return;
    try {
      await addStockToWatchlist(activeWatchlist.id, stock);
      await loadWatchlists();
      await loadDiff();
    } catch (err) {
      alert("Failed to add stock: " + err.message);
    }
  };

  const handleRemoveStock = async (symbol) => {
    if (!activeWatchlist) return;
    const item = activeWatchlist.items.find((i) => i.symbol === symbol);
    if (!item) return;

    try {
      await removeStockFromWatchlist(activeWatchlist.id, item.id);
      await loadWatchlists();
      await loadDiff();
    } catch (err) {
      alert("Failed to remove stock: " + err.message);
    }
  };

  const handleMarkAsSeen = async () => {
    setIsMarkingSeen(true);
    try {
      await saveSessionCheckpoint();
      setTimeTravelMinutes(0);
      await loadDiff();
    } catch (err) {
      console.error(err);
    } finally {
      setIsMarkingSeen(false);
    }
  };

  const handleApplyChaos = async (payload) => {
    try {
      await applyChaosSimulation(payload);
      await refreshChaosStatus();
      await loadDiff();
    } catch (err) {
      alert("Failed to apply chaos: " + err.message);
    }
  };

  const handleResetChaos = async () => {
    try {
      await resetChaosSimulation();
      setTimeTravelMinutes(0);
      await refreshChaosStatus();
      await loadDiff();
    } catch (err) {
      alert("Failed to reset chaos: " + err.message);
    }
  };

  const activeChaosCount = 
    (activeChaos?.simulate_stale_feed ? 1 : 0) +
    (Object.keys(activeChaos?.active_flash_shocks || {}).length) +
    (Object.keys(activeChaos?.active_circuit_breakers || {}).length) +
    (timeTravelMinutes > 0 ? 1 : 0);

  return (
    <div className="min-h-screen bg-groww-bg text-groww-textPrimary font-sans">
      
      {/* Navigation Bar */}
      <Navbar
        watchlists={watchlists}
        activeWatchlist={activeWatchlist}
        onSelectWatchlist={(wl) => setActiveWatchlist(wl)}
        onCreateWatchlist={handleCreateWatchlist}
        onMarkAsSeen={handleMarkAsSeen}
        feedStatus={feedStatus}
        onToggleChaos={() => setIsChaosOpen(!isChaosOpen)}
        isChaosOpen={isChaosOpen}
        isMarkingSeen={isMarkingSeen}
        activeChaosCount={activeChaosCount}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* 'While You Were Away' Intelligence Briefing Card */}
        <BriefingCard
          diffSummary={diffSummary}
          activeFilter={activeFilter}
          onFilterChange={(f) => setActiveFilter(f)}
          isLoading={isLoading}
        />

        {/* Watchlist Table */}
        <WatchlistTable
          items={diffSummary?.items || []}
          liveQuotes={liveQuotes}
          activeFilter={activeFilter}
          onFilterChange={(f) => setActiveFilter(f)}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onOpenDetailModal={(stock) => setSelectedStockDetail(stock)}
          onRemoveStock={handleRemoveStock}
          priceFlashMap={priceFlashMap}
        />

      </main>

      {/* Add Stock Modal */}
      <AddStockModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddStock={handleAddStock}
        existingSymbols={activeWatchlist?.items?.map((i) => i.symbol) || []}
      />

      {/* Stock Detail Modal */}
      <StockDetailModal
        stock={selectedStockDetail}
        isOpen={!!selectedStockDetail}
        onClose={() => setSelectedStockDetail(null)}
      />

      {/* Judge Chaos & Simulation Drawer */}
      <ChaosDrawer
        isOpen={isChaosOpen}
        onClose={() => setIsChaosOpen(false)}
        timeTravelMinutes={timeTravelMinutes}
        onTimeTravelChange={(mins) => setTimeTravelMinutes(mins)}
        onApplyChaos={handleApplyChaos}
        onResetChaos={handleResetChaos}
        activeChaos={activeChaos}
      />

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 py-8 text-center text-xs text-groww-textMuted border-t border-groww-cardBorder/40 mt-12">
        <p>
          Chronos • Context-Aware Market Watchlist Engine • Built for Groww CODE 2026
        </p>
        <p className="mt-1 text-[11px] text-groww-textMuted/70">
          FastAPI • MySQL 8.0 • React • Tailwind CSS • Real-time Server-Sent Events
        </p>
      </footer>

    </div>
  );
}
