const API_BASE = import.meta.env.VITE_API_URL || "/api";

export async function fetchWatchlists() {
  const res = await fetch(`${API_BASE}/watchlist`);
  if (!res.ok) throw new Error("Failed to fetch watchlists");
  return res.json();
}

export async function createWatchlist(name) {
  const res = await fetch(`${API_BASE}/watchlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, is_default: false })
  });
  if (!res.ok) throw new Error("Failed to create watchlist");
  return res.json();
}

export async function deleteWatchlist(watchlistId) {
  const res = await fetch(`${API_BASE}/watchlist/${watchlistId}`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error("Failed to delete watchlist");
  return true;
}

export async function addStockToWatchlist(watchlistId, stock) {
  const res = await fetch(`${API_BASE}/watchlist/${watchlistId}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      symbol: stock.symbol,
      name: stock.name,
      sector: stock.sector
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to add stock");
  }
  return res.json();
}

export async function removeStockFromWatchlist(watchlistId, itemId) {
  const res = await fetch(`${API_BASE}/watchlist/${watchlistId}/items/${itemId}`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error("Failed to remove stock");
  return true;
}

export async function fetchDiffSummary(watchlistId, timeTravelMinutes = 0) {
  const params = new URLSearchParams();
  if (watchlistId) params.append("watchlist_id", watchlistId);
  if (timeTravelMinutes > 0) params.append("time_travel_minutes", timeTravelMinutes.toString());

  const res = await fetch(`${API_BASE}/diff/since-last-seen?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch diff summary");
  return res.json();
}

export async function saveSessionCheckpoint() {
  const res = await fetch(`${API_BASE}/diff/checkpoint`, {
    method: "POST"
  });
  if (!res.ok) throw new Error("Failed to save session checkpoint");
  return res.json();
}

export async function searchCatalog(query) {
  const params = query ? `?q=${encodeURIComponent(query)}` : "";
  const res = await fetch(`${API_BASE}/market/search${params}`);
  if (!res.ok) throw new Error("Failed to search stocks");
  return res.json();
}

export async function applyChaosSimulation(payload) {
  const res = await fetch(`${API_BASE}/simulation/chaos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Failed to apply chaos override");
  return res.json();
}

export async function resetChaosSimulation() {
  const res = await fetch(`${API_BASE}/simulation/reset`, {
    method: "POST"
  });
  if (!res.ok) throw new Error("Failed to reset chaos");
  return res.json();
}

export async function getSimulationStatus() {
  const res = await fetch(`${API_BASE}/simulation/status`);
  if (!res.ok) throw new Error("Failed to get simulation status");
  return res.json();
}

export function subscribeToMarketStream(symbols, onMessage, onError) {
  const symStr = Array.isArray(symbols) ? symbols.join(",") : symbols;
  const eventSource = new EventSource(`${API_BASE}/market/stream?symbols=${encodeURIComponent(symStr)}`);

  eventSource.addEventListener("tick", (e) => {
    try {
      const data = JSON.parse(e.data);
      onMessage(data);
    } catch (err) {
      console.error("SSE parse error:", err);
    }
  });

  eventSource.onerror = (err) => {
    if (onError) onError(err);
  };

  return eventSource;
}
