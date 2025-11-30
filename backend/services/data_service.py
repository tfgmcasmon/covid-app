from pathlib import Path
from typing import List, Dict, Optional
import math

import pandas as pd


# ======================================
# Helpers de limpieza
# ======================================

def clean_value(val):
    """
    Convierte cualquier valor raro (NaN, None, 'NaN', '', etc.) en None.
    Si es convertible a float, devuelve float.
    """
    if val is None:
        return None

    if isinstance(val, str):
        if val.strip().lower() in ["nan", "none", ""]:
            return None
        try:
            return float(val)
        except Exception:
            return None

    try:
        if isinstance(val, float) and math.isnan(val):
            return None
    except Exception:
        pass

    try:
        return float(val)
    except Exception:
        return None


def clean_str(val):
    """
    Limpia strings para JSON: si es NaN/None/'' devuelve None.
    """
    if val is None:
        return None

    if isinstance(val, str):
        if val.strip().lower() in ["nan", "none", ""]:
            return None
        return val

    if pd.isna(val):
        return None

    return str(val)


# ======================================
# Rutas base y carga de datos
# ======================================

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data" / "processed"

EPI_PATH = DATA_DIR / "covid_epi_country.csv"
MOB_PATH = DATA_DIR / "covid_mobility_country.csv"
DEM_PATH = DATA_DIR / "covid_demographics_country.csv"

epi_df = pd.read_csv(EPI_PATH, parse_dates=["date"])
mob_df = pd.read_csv(MOB_PATH, parse_dates=["date"])
dem_df = pd.read_csv(DEM_PATH)

# ======================================
# Métricas
# ======================================

EPI_METRICS = [
    "new_confirmed",
    "new_deceased",
    "new_recovered",
    "new_tested",
    "cumulative_confirmed",
    "cumulative_deceased",
    "cumulative_recovered",
    "cumulative_tested",
]

MOBILITY_METRICS = [
    c for c in mob_df.columns
    if c not in ["date", "country_code", "country_name"]
]


# ======================================
# Servicios de datos
# ======================================

def get_available_countries() -> List[Dict]:
    countries_epi = epi_df[["country_code", "country_name"]].drop_duplicates()
    countries_dem = dem_df[["country_code", "country_name"]].drop_duplicates()
    countries = (
        pd.concat([countries_epi, countries_dem], ignore_index=True)
        .drop_duplicates()
        .sort_values("country_name")
    )

    result: List[Dict] = []
    for _, row in countries.iterrows():
        result.append(
            {
                "country_code": clean_str(row["country_code"]),
                "country_name": clean_str(row["country_name"]),
            }
        )
    return result


def get_epi_timeseries(
    country_code: str,
    metric: str = "new_confirmed",
    start: Optional[str] = None,
    end: Optional[str] = None,
) -> List[Dict]:

    if metric not in EPI_METRICS:
        raise ValueError(f"Métrica epidemiológica no soportada: {metric}")

    df = epi_df[epi_df["country_code"] == country_code].copy()

    if start:
        df = df[df["date"] >= pd.to_datetime(start)]
    if end:
        df = df[df["date"] <= pd.to_datetime(end)]

    if df.empty:
        return []

    df = df[["date", "country_code", "country_name", metric]].sort_values("date")

    result: List[Dict] = []
    for _, row in df.iterrows():
        result.append(
            {
                "date": row["date"].date().isoformat(),
                "country_code": clean_str(row["country_code"]),
                "country_name": clean_str(row["country_name"]),
                "metric": metric,
                "value": clean_value(row[metric]),
            }
        )

    return result


def get_mobility_timeseries(
    country_code: str,
    metric: str,
    start: Optional[str] = None,
    end: Optional[str] = None,
) -> List[Dict]:

    if metric not in MOBILITY_METRICS:
        raise ValueError(
            f"Métrica de movilidad no soportada: {metric}. "
            f"Métricas válidas incluyen, por ejemplo: {MOBILITY_METRICS[:5]}..."
        )

    df = mob_df[mob_df["country_code"] == country_code].copy()

    if start:
        df = df[df["date"] >= pd.to_datetime(start)]
    if end:
        df = df[df["date"] <= pd.to_datetime(end)]

    if df.empty:
        return []

    df = df[["date", "country_code", "country_name", metric]].sort_values("date")

    result: List[Dict] = []
    for _, row in df.iterrows():
        result.append(
            {
                "date": row["date"].date().isoformat(),
                "country_code": clean_str(row["country_code"]),
                "country_name": clean_str(row["country_name"]),
                "metric": metric,
                "value": clean_value(row[metric]),
            }
        )

    return result


def get_epi_summary(
    country_code: str,
    metric: str = "new_confirmed",
) -> Dict:
    """Calcula KPIs simples para una serie epidemiológica país + métrica."""
    series = get_epi_timeseries(country_code=country_code, metric=metric)
    if not series:
        raise ValueError(f"No hay datos para {country_code} / {metric}")

    # Convertimos a DataFrame para cálculo más cómodo
    df = pd.DataFrame(series)
    df["value"] = df["value"].fillna(0)

    peak_idx = df["value"].idxmax()
    peak_row = df.loc[peak_idx]

    summary = {
        "country_code": country_code,
        "country_name": peak_row.get("country_name"),
        "metric": metric,
        "peak_value": float(peak_row["value"] or 0),
        "peak_date": peak_row["date"],
        "last_value": float(df["value"].iloc[-1] or 0),
        "period_start": df["date"].iloc[0],
        "period_end": df["date"].iloc[-1],
        "non_zero_days": int((df["value"] > 0).sum()),
        "n_points": int(len(df)),
    }

    return summary
