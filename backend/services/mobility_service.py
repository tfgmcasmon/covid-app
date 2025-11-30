import pandas as pd
from config import MOBILITY_FILE


def get_mobility_timeseries(country_code: str, metric: str):
    """
    Devuelve la serie temporal de movilidad para un país y métrica concreta.

    :param country_code: Código ISO del país (p.ej. 'ES', 'IT', 'AR').
    :param metric: Nombre de la columna de movilidad (retail_and_recreation, residential, etc.).
    :return: Lista de dicts [{date, country_code, country_name, metric, value}, ...]
    """
    df = pd.read_csv(MOBILITY_FILE)

    # Filtramos por país (ya está a nivel país en el CSV procesado)
    subset = df[df["country_code"] == country_code].copy()

    if metric not in subset.columns:
        raise ValueError(f"Métrica de movilidad no válida: {metric}")

    # Nos quedamos con las columnas relevantes y renombramos a 'value'
    subset = subset[["date", "country_code", "country_name", metric]]
    subset = subset.sort_values("date")
    subset = subset.rename(columns={metric: "value"})

    return subset.to_dict(orient="records")
