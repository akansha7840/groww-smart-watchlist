import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from app.schemas import MarketQuote, DiffItem, DiffSummaryResponse

# Sector rolling standard deviation estimates for Indian market (used for Z-score normalization)
SECTOR_VOLATILITY = {
    "Energy": 1.2,
    "IT": 1.4,
    "Banking": 1.5,
    "Auto": 1.3,
    "Telecom": 1.6,
    "FMCG": 0.8,
    "Infrastructure": 1.2,
    "Pharma": 1.0,
    "Financials": 1.7,
    "Consumer": 1.1,
    "Diversified": 1.2
}

class DiffEngine:
    @staticmethod
    def compute_diff(
        user_id: str,
        current_quotes: Dict[str, MarketQuote],
        snapshot_data: Dict[str, dict],
        last_seen_at: datetime,
        time_travel_minutes: int = 0
    ) -> DiffSummaryResponse:
        """
        Computes temporal deltas between current market quotes and the user's last_seen snapshot.
        Applies multi-factor Attention Scoring: Z-score, Volume Anomaly, Sector Alpha, and Milestones.
        """
        now = datetime.utcnow()
        effective_last_seen = last_seen_at
        if time_travel_minutes > 0:
            effective_last_seen = now - timedelta(minutes=time_travel_minutes)

        elapsed_minutes = max(1, int((now - effective_last_seen).total_seconds() / 60))

        # 1. Compute Sector average percentage moves to establish relative baselines
        sector_deltas: Dict[str, List[float]] = {}
        for symbol, quote in current_quotes.items():
            baseline = snapshot_data.get(symbol, {})
            last_price = float(baseline.get("price", quote.previous_close))
            if last_price > 0:
                delta_pct = ((quote.price - last_price) / last_price) * 100
                sector_deltas.setdefault(quote.sector, []).append(delta_pct)

        sector_summary = {
            sec: round(sum(deltas) / len(deltas), 2)
            for sec, deltas in sector_deltas.items()
        }

        # 2. Evaluate each watchlist item
        diff_items: List[DiffItem] = []
        high_count = 0
        developing_count = 0
        noise_count = 0

        for symbol, quote in current_quotes.items():
            baseline = snapshot_data.get(symbol, {})
            last_price = float(baseline.get("price", quote.previous_close))
            last_volume = int(baseline.get("volume", quote.avg_volume // 2))

            delta_price = round(quote.price - last_price, 2)
            delta_percent = round(((quote.price - last_price) / last_price) * 100, 2) if last_price > 0 else 0.0

            # Factor A: Normalized Volatility (Z-Score)
            sigma = SECTOR_VOLATILITY.get(quote.sector, 1.2)
            z_score = abs(delta_percent) / sigma
            z_norm = min(z_score / 3.0, 1.0)  # 3-sigma move maps to 1.0

            # Factor B: Volume Anomaly Ratio
            expected_vol = max(quote.avg_volume, 1000)
            vol_ratio = round(quote.volume / expected_vol, 2)
            vol_norm = 0.0
            if vol_ratio > 1.0:
                vol_norm = min((vol_ratio - 1.0) / 2.0, 1.0)  # 3.0x volume maps to 1.0

            # Factor C: Idiosyncratic Alpha vs Sector Beta
            sector_avg = sector_summary.get(quote.sector, 0.0)
            relative_alpha = round(delta_percent - sector_avg, 2)
            alpha_norm = min(abs(relative_alpha) / 2.5, 1.0)

            # Factor D: Milestones & Boundaries
            milestones: List[str] = []
            milestone_weight = 0.0

            # Check 52-week High/Low proximity (<0.75%)
            if quote.fifty_two_week_high > 0 and (quote.price >= quote.fifty_two_week_high * 0.9925):
                milestones.append("NEAR_52W_HIGH")
                milestone_weight = max(milestone_weight, 0.8)

            if quote.fifty_two_week_low > 0 and (quote.price <= quote.fifty_two_week_low * 1.0075):
                milestones.append("NEAR_52W_LOW")
                milestone_weight = max(milestone_weight, 0.8)

            if quote.circuit_status:
                milestones.append(quote.circuit_status)
                milestone_weight = 1.0

            # Composite Attention Score (0.0 to 1.0)
            attention_score = round(
                (0.35 * z_norm) +
                (0.30 * vol_norm) +
                (0.20 * alpha_norm) +
                (0.15 * milestone_weight),
                2
            )

            # Generate Explainable Catalysts
            catalysts: List[str] = []
            if vol_ratio >= 2.0:
                catalysts.append(f"Volume surged {vol_ratio}x rolling average (heavy institutional activity)")
            elif vol_ratio >= 1.4:
                catalysts.append(f"Above-average volume ({vol_ratio}x)")

            if abs(relative_alpha) >= 1.5:
                direction = "outperforming" if relative_alpha > 0 else "underperforming"
                catalysts.append(f"{direction.capitalize()} {quote.sector} sector by {abs(relative_alpha):+0.1f}% alpha")

            if "NEAR_52W_HIGH" in milestones:
                catalysts.append(f"Trading within 1% of 52-Week High (₹{quote.fifty_two_week_high})")
            if "NEAR_52W_LOW" in milestones:
                catalysts.append(f"Testing 52-Week Low support (₹{quote.fifty_two_week_low})")
            if quote.circuit_status:
                catalysts.append(f"Trading halted: {quote.circuit_status.replace('_', ' ')}")

            if abs(delta_percent) >= 2.0:
                catalysts.append(f"Moved {delta_percent:+0.1f}% since your last check")

            if not catalysts:
                catalysts.append("Normal intraday fluctuation within regular volatility bands")

            # Attention Tier Categorization
            if attention_score >= 0.60 or milestone_weight >= 0.8 or vol_ratio >= 2.2:
                tier = "HIGH_ATTENTION"
                high_count += 1
            elif attention_score >= 0.35:
                tier = "DEVELOPING"
                developing_count += 1
            else:
                tier = "NOISE"
                noise_count += 1

            diff_items.append(DiffItem(
                symbol=quote.symbol,
                name=quote.name,
                sector=quote.sector,
                current_price=quote.price,
                last_seen_price=last_price,
                delta_price=delta_price,
                delta_percent=delta_percent,
                current_volume=quote.volume,
                avg_volume=quote.avg_volume,
                volume_ratio=vol_ratio,
                sector_delta_percent=sector_avg,
                relative_alpha=relative_alpha,
                attention_score=attention_score,
                attention_tier=tier,
                catalysts=catalysts,
                milestone_flags=milestones,
                is_stale=quote.is_stale
            ))

        # Sort items: High Attention first, then by attention score descending
        tier_order = {"HIGH_ATTENTION": 0, "DEVELOPING": 1, "NOISE": 2}
        diff_items.sort(key=lambda x: (tier_order.get(x.attention_tier, 3), -x.attention_score))

        # Headline Summary
        if high_count > 0:
            headline = f"{high_count} stock{'s' if high_count > 1 else ''} broke key levels or volume bands since you last checked."
        elif developing_count > 0:
            headline = f"Market is trending steadily. {developing_count} stock{'s are' if developing_count > 1 else ' is'} showing sector momentum."
        else:
            headline = "Quiet market session. All stocks in your watchlist are trading within normal baseline bands."

        return DiffSummaryResponse(
            user_id=user_id,
            last_seen_at=effective_last_seen,
            current_time=now,
            elapsed_minutes=elapsed_minutes,
            total_stocks=len(diff_items),
            high_attention_count=high_count,
            developing_count=developing_count,
            noise_count=noise_count,
            headline_summary=headline,
            sector_summary=sector_summary,
            items=diff_items
        )
