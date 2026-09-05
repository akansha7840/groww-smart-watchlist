import asyncio
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import httpx
from app.schemas import MarketQuote

# Baseline reference catalog for Nifty 50 universe
NIFTY_CATALOG = {
    "RELIANCE.NS": {"name": "Reliance Industries Ltd.", "sector": "Energy", "base_price": 1320.0, "avg_vol": 6500000, "52w_h": 1608.0, "52w_l": 1150.0},
    "TCS.NS": {"name": "Tata Consultancy Services Ltd.", "sector": "IT", "base_price": 3850.0, "avg_vol": 2200000, "52w_h": 4585.0, "52w_l": 3720.0},
    "HDFCBANK.NS": {"name": "HDFC Bank Ltd.", "sector": "Banking", "base_price": 1680.0, "avg_vol": 14000000, "52w_h": 1794.0, "52w_l": 1363.0},
    "INFY.NS": {"name": "Infosys Ltd.", "sector": "IT", "base_price": 1820.0, "avg_vol": 7000000, "52w_h": 2006.0, "52w_l": 1358.0},
    "TATAMOTORS.NS": {"name": "Tata Motors Ltd.", "sector": "Auto", "base_price": 940.0, "avg_vol": 11000000, "52w_h": 1179.0, "52w_l": 860.0},
    "ICICIBANK.NS": {"name": "ICICI Bank Ltd.", "sector": "Banking", "base_price": 1250.0, "avg_vol": 12000000, "52w_h": 1362.0, "52w_l": 980.0},
    "SBIN.NS": {"name": "State Bank of India", "sector": "Banking", "base_price": 810.0, "avg_vol": 15000000, "52w_h": 912.0, "52w_l": 590.0},
    "BHARTIARTL.NS": {"name": "Bharti Airtel Ltd.", "sector": "Telecom", "base_price": 1690.0, "avg_vol": 5000000, "52w_h": 1779.0, "52w_l": 1110.0},
    "ITC.NS": {"name": "ITC Ltd.", "sector": "FMCG", "base_price": 475.0, "avg_vol": 9500000, "52w_h": 528.0, "52w_l": 399.0},
    "LT.NS": {"name": "Larsen & Toubro Ltd.", "sector": "Infrastructure", "base_price": 3520.0, "avg_vol": 2500000, "52w_h": 3948.0, "52w_l": 3200.0},
    "SUNPHARMA.NS": {"name": "Sun Pharmaceutical Industries", "sector": "Pharma", "base_price": 1820.0, "avg_vol": 3100000, "52w_h": 1960.0, "52w_l": 1200.0},
    "BAJFINANCE.NS": {"name": "Bajaj Finance Ltd.", "sector": "Financials", "base_price": 6850.0, "avg_vol": 1100000, "52w_h": 7780.0, "52w_l": 6375.0},
    "MARUTI.NS": {"name": "Maruti Suzuki India Ltd.", "sector": "Auto", "base_price": 11900.0, "avg_vol": 450000, "52w_h": 13680.0, "52w_l": 9735.0},
    "TITAN.NS": {"name": "Titan Company Ltd.", "sector": "Consumer", "base_price": 3480.0, "avg_vol": 1200000, "52w_h": 3886.0, "52w_l": 3055.0},
    "WIPRO.NS": {"name": "Wipro Ltd.", "sector": "IT", "base_price": 540.0, "avg_vol": 5500000, "52w_h": 590.0, "52w_l": 435.0},
}

class MarketService:
    def __init__(self):
        # In-memory TTL cache: symbol -> (MarketQuote, timestamp)
        self._cache: Dict[str, Tuple[MarketQuote, float]] = {}
        self._cache_ttl_seconds = 5.0  # 5s cache window protects Yahoo rate limits
        self._sequence_counter = 1000

        # Chaos Simulation State overrides
        self.simulate_stale = False
        self.flash_shock: Dict[str, float] = {}       # symbol -> percentage spike/dump
        self.circuit_breakers: Dict[str, str] = {}    # symbol -> status ("UPPER_CIRCUIT", "HALTED")

    def _get_next_sequence_id(self) -> int:
        self._sequence_counter += 1
        return self._sequence_counter

    async def get_quote(self, symbol: str) -> MarketQuote:
        """Fetch quote with in-memory TTL caching and Yahoo Finance ingestion."""
        symbol = symbol.strip().upper()
        now = time.time()

        # 1. Check TTL cache
        if symbol in self._cache:
            cached_quote, cached_time = self._cache[symbol]
            if (now - cached_time) < self._cache_ttl_seconds:
                return self._apply_chaos_overrides(cached_quote)

        # 2. Try fetching from Yahoo Finance API
        quote = await self._fetch_yahoo_finance(symbol)
        if not quote:
            # Fallback to catalog or mock if upstream fails
            quote = self._generate_fallback_quote(symbol)

        # Store in cache
        self._cache[symbol] = (quote, now)
        return self._apply_chaos_overrides(quote)

    async def get_quotes_batch(self, symbols: List[str]) -> Dict[str, MarketQuote]:
        """Fetch multiple quotes concurrently with cache deduplication."""
        tasks = [self.get_quote(sym) for sym in symbols]
        results = await asyncio.gather(*tasks, return_exceptions=False)
        return {sym: quote for sym, quote in zip(symbols, results)}

    async def _fetch_yahoo_finance(self, symbol: str) -> Optional[MarketQuote]:
        """Direct query to Yahoo Finance Chart API."""
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?interval=1d&range=5d"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }

        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                resp = await client.get(url, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    res = data.get("chart", {}).get("result", [None])[0]
                    if not res:
                        return None

                    meta = res.get("meta", {})
                    current_price = float(meta.get("regularMarketPrice", 0.0))
                    prev_close = float(meta.get("previousClose", meta.get("chartPreviousClose", current_price)))
                    if current_price == 0.0:
                        return None

                    change = round(current_price - prev_close, 2)
                    change_pct = round((change / prev_close) * 100, 2) if prev_close else 0.0

                    day_high = float(meta.get("regularMarketDayHigh", current_price))
                    day_low = float(meta.get("regularMarketDayLow", current_price))
                    volume = int(meta.get("regularMarketVolume", 1000000))

                    catalog_info = NIFTY_CATALOG.get(symbol, {})
                    name = meta.get("shortName") or catalog_info.get("name", symbol)
                    sector = catalog_info.get("sector", "Diversified")
                    avg_vol = int(catalog_info.get("avg_vol", volume))
                    fifty_two_high = float(meta.get("fiftyTwoWeekHigh", catalog_info.get("52w_h", current_price * 1.2)))
                    fifty_two_low = float(meta.get("fiftyTwoWeekLow", catalog_info.get("52w_l", current_price * 0.8)))

                    return MarketQuote(
                        symbol=symbol,
                        name=name,
                        sector=sector,
                        price=round(current_price, 2),
                        previous_close=round(prev_close, 2),
                        change=change,
                        change_percent=change_pct,
                        day_high=round(day_high, 2),
                        day_low=round(day_low, 2),
                        volume=volume,
                        avg_volume=avg_vol,
                        fifty_two_week_high=round(fifty_two_high, 2),
                        fifty_two_week_low=round(fifty_two_low, 2),
                        timestamp=datetime.utcnow(),
                        is_stale=False,
                        sequence_id=self._get_next_sequence_id()
                    )
        except Exception as e:
            # Silently catch and trigger fallback
            pass

        return None

    def _generate_fallback_quote(self, symbol: str) -> MarketQuote:
        """Fallback generator using catalog metadata."""
        cat = NIFTY_CATALOG.get(symbol, {
            "name": symbol.replace(".NS", ""),
            "sector": "Diversified",
            "base_price": 1000.0,
            "avg_vol": 2000000,
            "52w_h": 1250.0,
            "52w_l": 850.0
        })

        base_price = cat["base_price"]
        prev_close = base_price
        price = round(base_price * (1 + 0.005), 2)
        change = round(price - prev_close, 2)
        change_pct = round((change / prev_close) * 100, 2)

        return MarketQuote(
            symbol=symbol,
            name=cat["name"],
            sector=cat["sector"],
            price=price,
            previous_close=prev_close,
            change=change,
            change_percent=change_pct,
            day_high=round(price * 1.01, 2),
            day_low=round(price * 0.99, 2),
            volume=int(cat["avg_vol"] * 1.1),
            avg_volume=cat["avg_vol"],
            fifty_two_week_high=cat["52w_h"],
            fifty_two_week_low=cat["52w_l"],
            timestamp=datetime.utcnow(),
            is_stale=False,
            sequence_id=self._get_next_sequence_id()
        )

    def _apply_chaos_overrides(self, quote: MarketQuote) -> MarketQuote:
        """Applies judge chaos simulation states (flash shock, circuit halts, stale feed)."""
        modified = quote.model_copy()

        # 1. Flash Shock Injection
        if quote.symbol in self.flash_shock:
            shock_pct = self.flash_shock[quote.symbol]
            new_price = round(modified.price * (1 + shock_pct / 100), 2)
            modified.price = new_price
            modified.change = round(new_price - modified.previous_close, 2)
            modified.change_percent = round((modified.change / modified.previous_close) * 100, 2)
            modified.volume = int(modified.volume * 3.5) # Shock volume burst
            if new_price > modified.day_high:
                modified.day_high = new_price
            if new_price < modified.day_low:
                modified.day_low = new_price

        # 2. Circuit Breaker Simulation
        if quote.symbol in self.circuit_breakers:
            modified.circuit_status = self.circuit_breakers[quote.symbol]

        # 3. Stale Feed Degradation
        if self.simulate_stale:
            modified.is_stale = True
            modified.timestamp = datetime.utcnow() - timedelta(seconds=25)

        return modified

# Global singleton market service instance
market_service = MarketService()
