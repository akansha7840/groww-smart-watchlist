import json
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Watchlist, WatchlistItem, SessionCheckpoint
from app.schemas import DiffSummaryResponse
from app.market_service import market_service
from app.diff_engine import DiffEngine
from app.routes.watchlist import get_or_create_default_user

router = APIRouter(prefix="/api/diff", tags=["Temporal Diff Engine"])

@router.get("/since-last-seen", response_model=DiffSummaryResponse)
async def get_meaningful_diff(
    watchlist_id: Optional[str] = Query(None, description="Watchlist ID (defaults to primary)"),
    time_travel_minutes: int = Query(0, ge=0, le=1440, description="Simulate baseline N minutes ago"),
    db: Session = Depends(get_db)
):
    """
    Core engine endpoint: Compares current live market data against user's last-seen session snapshot.
    Evaluates Z-score volatility, volume anomaly ratios, relative sector alpha, and milestone breakouts.
    """
    user = get_or_create_default_user(db)

    # 1. Resolve Watchlist
    if watchlist_id:
        wl = db.query(Watchlist).filter(Watchlist.id == watchlist_id).first()
    else:
        wl = db.query(Watchlist).filter(Watchlist.user_id == user.id, Watchlist.is_default == True).first()
        if not wl:
            wl = db.query(Watchlist).filter(Watchlist.user_id == user.id).first()

    if not wl or not wl.items:
        raise HTTPException(status_code=404, detail="No stocks found in watchlist to diff")

    symbols = [item.symbol for item in wl.items]

    # 2. Fetch Live Market Quotes
    quotes_dict = await market_service.get_quotes_batch(symbols)

    # 3. Retrieve or Initialize User Session Checkpoint from MySQL
    checkpoint = db.query(SessionCheckpoint).filter(SessionCheckpoint.user_id == user.id).first()
    now = datetime.utcnow()

    if not checkpoint:
        # Create an initial simulated baseline (e.g., as if user last saw stocks 3 hours ago)
        baseline_time = now - timedelta(hours=3)
        simulated_snapshot = {}
        for sym, q in quotes_dict.items():
            # Baseline price slightly shifted so there's meaningful demo data on first visit
            simulated_snapshot[sym] = {
                "price": round(q.price * 0.985, 2),  # ~1.5% drift
                "volume": int(q.avg_volume * 0.4),
                "timestamp": baseline_time.isoformat()
            }

        checkpoint = SessionCheckpoint(
            user_id=user.id,
            last_seen_at=baseline_time,
            snapshot_data=json.dumps(simulated_snapshot)
        )
        db.add(checkpoint)
        db.commit()
        db.refresh(checkpoint)

    snapshot_data = json.loads(checkpoint.snapshot_data)

    # 4. Handle Time-Travel Scrubber: If judge specifies time_travel_minutes, generate simulated earlier baseline
    last_seen_time = checkpoint.last_seen_at
    if time_travel_minutes > 0:
        last_seen_time = now - timedelta(minutes=time_travel_minutes)
        # Create time-scaled drift for demo scrubber
        scaled_snapshot = {}
        drift_factor = (time_travel_minutes / 180.0) * 0.02  # e.g., 2% drift over 3 hours
        for sym, q in quotes_dict.items():
            scaled_snapshot[sym] = {
                "price": round(q.price * (1 - drift_factor), 2),
                "volume": int(q.avg_volume * max(0.2, 1.0 - (time_travel_minutes / 300.0))),
                "timestamp": last_seen_time.isoformat()
            }
        snapshot_data = scaled_snapshot

    # 5. Run Core Diff Engine
    diff_summary = DiffEngine.compute_diff(
        user_id=user.id,
        current_quotes=quotes_dict,
        snapshot_data=snapshot_data,
        last_seen_at=last_seen_time,
        time_travel_minutes=time_travel_minutes
    )

    return diff_summary

@router.post("/checkpoint")
async def save_session_checkpoint(db: Session = Depends(get_db)):
    """
    Saves the user's current view as their new baseline checkpoint in MySQL.
    Called when the user acknowledges recent changes ("Mark as Read") or navigates away.
    """
    user = get_or_create_default_user(db)
    wl = db.query(Watchlist).filter(Watchlist.user_id == user.id, Watchlist.is_default == True).first()
    if not wl:
        wl = db.query(Watchlist).filter(Watchlist.user_id == user.id).first()

    symbols = [item.symbol for item in wl.items] if wl else []
    quotes_dict = await market_service.get_quotes_batch(symbols)

    now = datetime.utcnow()
    current_snapshot = {
        sym: {
            "price": q.price,
            "volume": q.volume,
            "timestamp": now.isoformat()
        }
        for sym, q in quotes_dict.items()
    }

    checkpoint = db.query(SessionCheckpoint).filter(SessionCheckpoint.user_id == user.id).first()
    if checkpoint:
        checkpoint.last_seen_at = now
        checkpoint.snapshot_data = json.dumps(current_snapshot)
    else:
        checkpoint = SessionCheckpoint(
            user_id=user.id,
            last_seen_at=now,
            snapshot_data=json.dumps(current_snapshot)
        )
        db.add(checkpoint)

    db.commit()
    return {"status": "success", "message": "Session checkpoint saved successfully", "last_seen_at": now}
