import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(watchlist_router)
app.include_router(market_router)
app.include_router(diff_router)
app.include_router(simulation_router)

@app.on_event("startup")
def on_startup():
    """Create all MySQL tables and seed the initial stock catalog."""
    try:
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
    except Exception as e:
        print("Startup database initialization note:", e)

@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "Chronos Smart Watchlist Backend",
        "engine": "FastAPI + MySQL",
        "version": "1.0.0"
    }

# Mount Frontend Static Assets for Single-URL Deployed Production
base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
frontend_dist = os.path.join(base_dir, "frontend", "dist")

if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Don't hijack API routes or docs
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            raise HTTPException(status_code=404, detail="Not Found")
        
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        
        # Fallback to SPA index.html
        return FileResponse(os.path.join(frontend_dist, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.API_HOST, port=settings.API_PORT, reload=True)
