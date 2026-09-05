from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.models import StockCatalog, User
from app.market_service import NIFTY_CATALOG
from app.routes.watchlist import router as watchlist_router, get_or_create_default_user
from app.routes.market import router as market_router
from app.routes.diff import router as diff_router
from app.routes.simulation import router as simulation_router

# Initialize FastAPI App
app = FastAPI(
    title="Chronos: Smart Market Watchlist API",
    description="Context-Aware Market Watchlist Engine for Groww CODE 2026. Computes temporal deltas, attention scores, and resilient live data feeds.",
    version="1.0.0"
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows local Vite/React and deployed frontend domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(watchlist_router)
app.include_router(market_router)
app.include_router(diff_router)
app.include_router(simulation_router)

@app.on_event("startup")
def on_startup():
    """Create all MySQL tables and seed the initial stock catalog."""
    # 1. Create database schema
    Base.metadata.create_all(bind=engine)

    # 2. Seed stock catalog and default demo user
    db = SessionLocal()
    try:
        catalog_count = db.query(StockCatalog).count()
        if catalog_count == 0:
            for sym, data in NIFTY_CATALOG.items():
                stock = StockCatalog(
                    symbol=sym,
                    name=data["name"],
                    sector=data["sector"],
                    market_cap="Large Cap",
                    is_nifty50=True
                )
                db.add(stock)
            db.commit()

        # Ensure default user and initial watchlist exist
        get_or_create_default_user(db)
    finally:
        db.close()

@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "Chronos Smart Watchlist Backend",
        "engine": "FastAPI + MySQL 8.0",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.API_HOST, port=settings.API_PORT, reload=True)
