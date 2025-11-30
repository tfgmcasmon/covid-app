import pandas as pd
from pathlib import Path

# BASE_DIR apunta a la carpeta backend/
BASE_DIR = Path(__file__).resolve().parent

# Carpeta donde están los CSV
DATA_DIR = BASE_DIR / "data" / "processed"

# Rutas a tus CSV reales
epi_path = DATA_DIR / "covid_epi_country.csv"
demo_path = DATA_DIR / "covid_demographics_country.csv"

print("Buscando archivos en:", DATA_DIR)
print("EPI:", epi_path.exists(), epi_path)
print("DEMO:", demo_path.exists(), demo_path)

# Leer CSV
epi = pd.read_csv(epi_path, parse_dates=["date"])
demo = pd.read_csv(demo_path)

# Población por país
demo_small = demo[["country_code", "country_name", "population"]].drop_duplicates("country_code")

# Join epi + demo
df = epi.merge(demo_small, on=["country_code", "country_name"], how="left")

# Evitar divisiones por cero
df = df[df["population"].notna() & (df["population"] > 0)]

# Casos por 100k
df["new_confirmed_per_100k"] = df["new_confirmed"] / df["population"] * 1e5
df["cumulative_confirmed_per_100k"] = df["cumulative_confirmed"] / df["population"] * 1e5

# Media móvil 7 días
df = df.sort_values(["country_code", "date"])
df["new_confirmed_per_100k_ma7"] = (
    df.groupby("country_code")["new_confirmed_per_100k"]
      .transform(lambda s: s.rolling(window=7, min_periods=1).mean())
)

# Columnas finales
map_df = df[[
    "date",
    "country_code",
    "country_name",
    "new_confirmed_per_100k",
    "new_confirmed_per_100k_ma7",
    "cumulative_confirmed_per_100k"
]].copy()

# Convertir fecha a string
map_df["date"] = pd.to_datetime(map_df["date"]).dt.strftime("%Y-%m-%d")

# Exportar a frontend/public/data
frontend_data_dir = BASE_DIR.parent / "frontend" / "public" / "data"
frontend_data_dir.mkdir(parents=True, exist_ok=True)

output_path = frontend_data_dir / "map_data.json"
map_df.to_json(output_path, orient="records")

print("Guardado JSON para el mapa en:", output_path)
print("Total filas:", len(map_df))
