import asyncio
import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Query, Request
from sse_starlette.sse import EventSourceResponse
from app.market_service import market_service, NIFTY_CATALOG
from app.schemas import MarketQuote, StockCatalogItem

router = APIRouter(prefix="/api/market", tags=["Market"])

@router.get("/quotes", response_model=List[MarketQuote])
async def get_quotes(symbols: str = Query(..., description="Comma separated symbols, e.g. RELIANCE.NS,TCS.NS")):
    symbol_list = [s.strip().upper() for s in symbols.split(",") if s.strip()]
    if not symbol_list:
        return []
    quotes_dict = await market_service.get_quotes_batch(symbol_list)
    return list(quotes_dict.values())

@router.get("/search", response_model=List[StockCatalogItem])
def search_catalog(q: Optional[str] = Query(None, description="Search term")):
    if not q:
        # Return top 10 Nifty stocks by default
        top_keys = list(NIFTY_CATALOG.keys())[:10]
        return [
            StockCatalogItem(
                symbol=k,
                name=NIFTY_CATALOG[k]["name"],
                sector=NIFTY_CATALOG[k]["sector"],
                market_cap="Large Cap",
                is_nifty50=True
            )
            for k in top_keys
        ]

    q_lower = q.strip().lower()
    matches = []
    for sym, meta in NIFTY_CATALOG.items():
        if q_lower in sym.lower() or q_lower in meta["name"].lower() or q_lower in meta["sector"].lower():
            matches.append(StockCatalogItem(
                symbol=sym,
                name=meta["name"],
                sector=meta["sector"],
                market_cap="Large Cap",
                is_nifty50=True
            ))

    return matches

@router.get("/stream")
async def market_sse_stream(request: Request, symbols: str = Query("RELIANCE.NS,TCS.NS,HDFCBANK.NS,INFY.NS,TATAMOTORS.NS,ITC.NS")):
    """
    Server-Sent Events (SSE) stream pushing live quotes and feed status to browser clients.
    Automatically handles reconnections, client disconnects, and stale feed indicators.
    """
    symbol_list = [s.strip().upper() for s in symbols.split(",") if s.strip()]

    async def event_generator():
        while True:
            # If client disconnected, exit cleanly
            if await request.is_disconnected():
                break

            quotes_dict = await market_service.get_quotes_batch(symbol_list)
            quotes_list = [q.model_dump(mode="json") for q in quotes_dict.values()]

            payload = {
                "timestamp": datetime.utcnow().isoformat(),
                "feed_status": "DELAYED" if market_service.simulate_stale else "LIVE",
                "quotes": quotes_list
            }

            yield {
                "event": "tick",
                "data": json.dumps(payload)
            }

            await asyncio.sleep(2.5)  # 2.5 second polling interval

    return EventSourceResponse(event_generator())
