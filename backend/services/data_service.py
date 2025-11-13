from pathlib import Path
from typing import List, Dict, Optional
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

    # Strings tipo 'NaN', 'nan', '', 'None'
    if isinstance(val, str):
        if val.strip().lower() in ["nan", "none", ""]:
            return None
        try:
            return float(val)
        except Exception:
            return None

    # Floats tipo np.nan
    try:
        import math
        if isinstance(val, float) and math.isnan(val):
            return None
    except Exception:
        pass

    # Intentar cast genérico
    try:
        return float(val)
    except Exception:
        return None


def clean_str(val):
    """
    Limpia strings para JSON: si es NaN/None/'' devuelve None, si no lo convierte a str.
    """
    if val is None:
        return None

    if isinstance(val, str):
        if val.strip().lower() in ["nan", "none", ""]:
            return None
        return val

    # Para valores tipo NaN de pandas
    if pd.isna(val):
        return None

    return str(val)


# ======================================
# Rutas base
# ======================================

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data" / "processed"

# ======================================
# Carga de datasets
# ======================================

EPI_PATH = DATA_DIR / "covid_epi_country.csv"
epi_df = pd.read_csv(EPI_PATH, parse_dates=["date"])

MOB_PATH = DATA_DIR / "covid_mobility_country.csv"
mob_df = pd.read_csv(MOB_PATH, parse_dates=["date"])

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
# Servicios
# ======================================

def get_available_countries() -> List[Dict]:
    countries = (
        epi_df[["country_code", "country_name"]]
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
        raise ValueError(f"Métrica no soportada: {metric}")

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
            f"Métrica de movilidad no soportada: {metric}. Métricas válidas: {MOBILITY_METRICS}"
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
