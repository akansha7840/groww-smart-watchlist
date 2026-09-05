from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import User, Watchlist, WatchlistItem, StockCatalog
from app.schemas import (
    WatchlistCreate, WatchlistUpdate, WatchlistResponse,
    WatchlistItemAdd, WatchlistItemResponse
)
from app.market_service import NIFTY_CATALOG

router = APIRouter(prefix="/api/watchlist", tags=["Watchlist"])

def get_or_create_default_user(db: Session) -> User:
    """Ensures a default demo user exists for seamless local/evaluation testing."""
    user = db.query(User).filter(User.email == "demo@groww.in").first()
    if not user:
        user = User(email="demo@groww.in", name="Demo Investor")
        db.add(user)
        db.commit()
        db.refresh(user)

        # Create default initial watchlist
        default_wl = Watchlist(name="Nifty Core Portfolio", user_id=user.id, is_default=True)
        db.add(default_wl)
        db.commit()
        db.refresh(default_wl)

        # Seed with 6 diverse stocks
        initial_stocks = [
            ("RELIANCE.NS", "Reliance Industries Ltd.", "Energy"),
            ("TCS.NS", "Tata Consultancy Services Ltd.", "IT"),
            ("HDFCBANK.NS", "HDFC Bank Ltd.", "Banking"),
            ("INFY.NS", "Infosys Ltd.", "IT"),
            ("TATAMOTORS.NS", "Tata Motors Ltd.", "Auto"),
            ("ITC.NS", "ITC Ltd.", "FMCG")
        ]
        for idx, (sym, name, sector) in enumerate(initial_stocks):
            item = WatchlistItem(
                watchlist_id=default_wl.id,
                symbol=sym,
                name=name,
                sector=sector,
                display_order=idx
            )
            db.add(item)
        db.commit()

    return user

@router.get("", response_model=List[WatchlistResponse])
def list_watchlists(db: Session = Depends(get_db)):
    user = get_or_create_default_user(db)
    watchlists = db.query(Watchlist).filter(Watchlist.user_id == user.id).all()
    return watchlists

@router.post("", response_model=WatchlistResponse, status_code=status.HTTP_201_CREATED)
def create_watchlist(payload: WatchlistCreate, db: Session = Depends(get_db)):
    user = get_or_create_default_user(db)
    wl = Watchlist(name=payload.name, user_id=user.id, is_default=payload.is_default)
    db.add(wl)
    db.commit()
    db.refresh(wl)
    return wl

@router.get("/{watchlist_id}", response_model=WatchlistResponse)
def get_watchlist(watchlist_id: str, db: Session = Depends(get_db)):
    wl = db.query(Watchlist).filter(Watchlist.id == watchlist_id).first()
    if not wl:
        raise HTTPException(status_code=404, detail="Watchlist not found")
    return wl

@router.post("/{watchlist_id}/items", response_model=WatchlistItemResponse, status_code=status.HTTP_201_CREATED)
def add_item_to_watchlist(watchlist_id: str, payload: WatchlistItemAdd, db: Session = Depends(get_db)):
    wl = db.query(Watchlist).filter(Watchlist.id == watchlist_id).first()
    if not wl:
        raise HTTPException(status_code=404, detail="Watchlist not found")

    symbol = payload.symbol.strip().upper()
    existing = db.query(WatchlistItem).filter(
        WatchlistItem.watchlist_id == watchlist_id,
        WatchlistItem.symbol == symbol
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Stock already exists in this watchlist")

    # Lookup catalog for name/sector if omitted
    name = payload.name
    sector = payload.sector or "Diversified"
    if not name or sector == "Diversified":
        cat = NIFTY_CATALOG.get(symbol)
        if cat:
            name = name or cat["name"]
            sector = cat["sector"]
        else:
            name = name or symbol.replace(".NS", "")

    count = db.query(WatchlistItem).filter(WatchlistItem.watchlist_id == watchlist_id).count()
    item = WatchlistItem(
        watchlist_id=watchlist_id,
        symbol=symbol,
        name=name,
        sector=sector,
        display_order=count,
        target_high=payload.target_high,
        target_low=payload.target_low,
        notes=payload.notes
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{watchlist_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_item(watchlist_id: str, item_id: str, db: Session = Depends(get_db)):
    item = db.query(WatchlistItem).filter(
        WatchlistItem.id == item_id,
        WatchlistItem.watchlist_id == watchlist_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
    return None

@router.delete("/{watchlist_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_watchlist(watchlist_id: str, db: Session = Depends(get_db)):
    wl = db.query(Watchlist).filter(Watchlist.id == watchlist_id).first()
    if not wl:
        raise HTTPException(status_code=404, detail="Watchlist not found")
    db.delete(wl)
    db.commit()
    return None
