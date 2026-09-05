from fastapi import APIRouter
from app.schemas import ChaosSimulationRequest
from app.market_service import market_service

router = APIRouter(prefix="/api/simulation", tags=["Judge Simulation & Chaos Panel"])

@router.post("/chaos")
def configure_chaos_overrides(payload: ChaosSimulationRequest):
    """
    Enables judge evaluation chaos triggers: Stale feeds, flash shocks, and circuit breaks.
    """
    if payload.simulate_stale_feed is not None:
        market_service.simulate_stale = payload.simulate_stale_feed

    if payload.flash_shock_symbol:
        sym = payload.flash_shock_symbol.strip().upper()
        pct = payload.flash_shock_percent if payload.flash_shock_percent is not None else 4.5
        market_service.flash_shock[sym] = pct

    if payload.circuit_breaker_symbol:
        sym = payload.circuit_breaker_symbol.strip().upper()
        market_service.circuit_breakers[sym] = "HALTED"

    return {
        "status": "applied",
        "simulate_stale_feed": market_service.simulate_stale,
        "flash_shocks": market_service.flash_shock,
        "circuit_breakers": market_service.circuit_breakers
    }

@router.post("/reset")
def reset_simulation():
    """Resets all active chaos overrides back to normal live market conditions."""
    market_service.simulate_stale = False
    market_service.flash_shock.clear()
    market_service.circuit_breakers.clear()
    return {"status": "reset", "message": "All chaos simulation overrides cleared."}

@router.get("/status")
def get_simulation_status():
    return {
        "simulate_stale_feed": market_service.simulate_stale,
        "active_flash_shocks": market_service.flash_shock,
        "active_circuit_breakers": market_service.circuit_breakers
    }
