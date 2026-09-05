from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- Watchlist Schemas ---
class WatchlistItemBase(BaseModel):
    symbol: str
    name: str
    sector: str = "Diversified"
    display_order: int = 0
    target_high: Optional[float] = None
    target_low: Optional[float] = None
    notes: Optional[str] = None

class WatchlistItemAdd(BaseModel):
    symbol: str
    name: Optional[str] = None
    sector: Optional[str] = None
    target_high: Optional[float] = None
    target_low: Optional[float] = None
    notes: Optional[str] = None

class WatchlistItemResponse(WatchlistItemBase):
    id: str
    watchlist_id: str
    added_at: datetime
    model_config = ConfigDict(from_attributes=True)

class WatchlistCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    is_default: bool = False

class WatchlistUpdate(BaseModel):
    name: Optional[str] = None
    is_default: Optional[bool] = None

class WatchlistResponse(BaseModel):
    id: str
    user_id: str
    name: str
    is_default: bool
    created_at: datetime
    updated_at: datetime
    items: List[WatchlistItemResponse] = []
    model_config = ConfigDict(from_attributes=True)

# --- Market Quote Schemas ---
class MarketQuote(BaseModel):
    symbol: str
    name: str
    sector: str
    price: float
    previous_close: float
    change: float
    change_percent: float
    day_high: float
    day_low: float
    volume: int
    avg_volume: int
    fifty_two_week_high: float
    fifty_two_week_low: float
    timestamp: datetime
    is_stale: bool = False
    sequence_id: int = 0
    circuit_status: Optional[str] = None

# --- Diff Engine & Attention Schemas ---
class DiffItem(BaseModel):
    symbol: str
    name: str
    sector: str
    current_price: float
    last_seen_price: float
    delta_price: float
    delta_percent: float
    current_volume: int
    avg_volume: int
    volume_ratio: float
    sector_delta_percent: float
    relative_alpha: float
    attention_score: float
    attention_tier: str  # "HIGH_ATTENTION", "DEVELOPING", "NOISE"
    catalysts: List[str] = []
    milestone_flags: List[str] = []
    is_stale: bool = False

class DiffSummaryResponse(BaseModel):
    user_id: str
    last_seen_at: datetime
    current_time: datetime
    elapsed_minutes: int
    total_stocks: int
    high_attention_count: int
    developing_count: int
    noise_count: int
    headline_summary: str
    sector_summary: Dict[str, float]
    items: List[DiffItem]

# --- Stock Catalog Search ---
class StockCatalogItem(BaseModel):
    symbol: str
    name: str
    sector: str
    market_cap: str = "Large Cap"
    is_nifty50: bool = True
    model_config = ConfigDict(from_attributes=True)

# --- Simulation / Chaos Schemas ---
class ChaosSimulationRequest(BaseModel):
    time_travel_minutes: Optional[int] = 0
    simulate_stale_feed: Optional[bool] = False
    flash_shock_symbol: Optional[str] = None
    flash_shock_percent: Optional[float] = None
    circuit_breaker_symbol: Optional[str] = None
