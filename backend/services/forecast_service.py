from typing import Dict, List
import pandas as pd
from .data_service import get_epi_timeseries


def generate_forecast(country_code: str, metric: str, horizon: int) -> Dict:
    """
    Forecast MUY simple para que la API funcione sin Prophet.
    - Coge la serie histórica.
    - Calcula media de los últimos 14 días.
    - Proyecta esa media hacia delante horizon días.
    """
    history = get_epi_timeseries(country_code=country_code, metric=metric)
    if not history:
        raise ValueError("No hay datos históricos para ese país/métrica")

    df = pd.DataFrame(history)
    df["value"] = df["value"].fillna(0)

    # Media móvil simple de los últimos 14 días
    window = min(14, len(df))
    last_mean = float(df["value"].tail(window).mean())

    # Fecha final de histórico
    last_date = pd.to_datetime(df["date"].iloc[-1])

    future: List[Dict] = []
    for i in range(1, horizon + 1):
        future_date = (last_date + pd.Timedelta(days=i)).date().isoformat()
        future.append(
            {
                "date": future_date,
                "value": last_mean,
                "day": i,
            }
        )

    return {
        "country_code": country_code,
        "metric": metric,
        "horizon": horizon,
        "last_history_date": last_date.date().isoformat(),
        "method": "simple_mean_forecast",
        "forecast": future,
    }
