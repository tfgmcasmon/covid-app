# backend/services/epi_insights_service.py
from typing import Dict, Any
import pandas as pd

from config import EPIDEMIOLOGY_FILE


def get_epi_summary(country_code: str, metric: str) -> Dict[str, Any]:
    """
    Calcula KPIs básicos para una serie epidemiológica (país + métrica).

    Devuelve:
      - peak_value, peak_date
      - last_value
      - period_start, period_end
      - non_zero_days, n_points
    """
    df = pd.read_csv(EPIDEMIOLOGY_FILE)

    subset = df[(df["country_code"] == country_code) & (df["metric"] == metric)].copy()
    if subset.empty:
        raise ValueError(f"No hay datos para {country_code} / {metric}")

    subset = subset.sort_values("date")
    subset["value"] = subset["value"].fillna(0)

    # Pico máximo
    peak_idx = subset["value"].idxmax()
    peak_row = subset.loc[peak_idx]

    summary = {
        "country_code": country_code,
        "country_name": subset["country_name"].iloc[0],
        "metric": metric,
        "peak_value": float(peak_row["value"] or 0),
        "peak_date": str(peak_row["date"]),
        "last_value": float(subset["value"].iloc[-1] or 0),
        "period_start": str(subset["date"].iloc[0]),
        "period_end": str(subset["date"].iloc[-1]),
        "non_zero_days": int((subset["value"] > 0).sum()),
        "n_points": int(len(subset)),
    }

    return summary
