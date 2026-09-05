import pytest
from datetime import datetime
from app.schemas import MarketQuote
from app.diff_engine import DiffEngine

def test_noise_rejection():
    """A tiny 0.1% fluctuation should be classified as NOISE."""
    now = datetime.utcnow()
    quote = MarketQuote(
        symbol="TCS.NS",
        name="Tata Consultancy Services Ltd.",
        sector="IT",
        price=3853.85,
        previous_close=3850.0,
        change=3.85,
        change_percent=0.10,
        day_high=3860.0,
        day_low=3840.0,
        volume=2200000,
        avg_volume=2200000,
        fifty_two_week_high=4585.0,
        fifty_two_week_low=3720.0,
        timestamp=now
    )

    snapshot = {
        "TCS.NS": {"price": 3850.0, "volume": 2000000, "timestamp": now.isoformat()}
    }

    diff_summary = DiffEngine.compute_diff(
        user_id="test-user",
        current_quotes={"TCS.NS": quote},
        snapshot_data=snapshot,
        last_seen_at=now
    )

    assert len(diff_summary.items) == 1
    item = diff_summary.items[0]
    assert item.attention_tier == "NOISE"
    assert item.attention_score < 0.35

def test_volume_anomaly_detection():
    """A 3.0x volume surge should trigger high attention."""
    now = datetime.utcnow()
    quote = MarketQuote(
        symbol="RELIANCE.NS",
        name="Reliance Industries Ltd.",
        sector="Energy",
        price=1350.0,
        previous_close=1320.0,
        change=30.0,
        change_percent=2.27,
        day_high=1355.0,
        day_low=1318.0,
        volume=19500000,          # 3.0x avg volume
        avg_volume=6500000,
        fifty_two_week_high=1608.0,
        fifty_two_week_low=1150.0,
        timestamp=now
    )

    snapshot = {
        "RELIANCE.NS": {"price": 1320.0, "volume": 6500000, "timestamp": now.isoformat()}
    }

    diff_summary = DiffEngine.compute_diff(
        user_id="test-user",
        current_quotes={"RELIANCE.NS": quote},
        snapshot_data=snapshot,
        last_seen_at=now
    )

    item = diff_summary.items[0]
    assert item.volume_ratio >= 2.5
    assert item.attention_tier == "HIGH_ATTENTION"
    assert any("Volume surged" in c for c in item.catalysts)

def test_near_52_week_high_milestone():
    """Price trading near 52-week High must flag milestone."""
    now = datetime.utcnow()
    quote = MarketQuote(
        symbol="HDFCBANK.NS",
        name="HDFC Bank Ltd.",
        sector="Banking",
        price=1790.0,             # 52w high is 1794.0 (<0.5% away)
        previous_close=1750.0,
        change=40.0,
        change_percent=2.28,
        day_high=1792.0,
        day_low=1745.0,
        volume=14000000,
        avg_volume=14000000,
        fifty_two_week_high=1794.0,
        fifty_two_week_low=1363.0,
        timestamp=now
    )

    snapshot = {
        "HDFCBANK.NS": {"price": 1750.0, "volume": 14000000, "timestamp": now.isoformat()}
    }

    diff_summary = DiffEngine.compute_diff(
        user_id="test-user",
        current_quotes={"HDFCBANK.NS": quote},
        snapshot_data=snapshot,
        last_seen_at=now
    )

    item = diff_summary.items[0]
    assert "NEAR_52W_HIGH" in item.milestone_flags
    assert item.attention_tier == "HIGH_ATTENTION"
