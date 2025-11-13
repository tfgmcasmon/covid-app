from pathlib import Path
import pandas as pd

# ========================
# 0. Rutas base
# ========================

# Carpeta donde está este script (backend/)
BASE_DIR = Path(__file__).resolve().parent

# Directorios de datos relativos a backend/
RAW_DIR = BASE_DIR / "data" / "raw"
PROC_DIR = BASE_DIR / "data" / "processed"
PROC_DIR.mkdir(parents=True, exist_ok=True)

print(f"RAW_DIR: {RAW_DIR}")
print(f"PROC_DIR: {PROC_DIR}")

# ========================
# 1. Cargar ficheros base
# ========================

epi = pd.read_csv(RAW_DIR / "epidemiology.csv", parse_dates=["date"])
mob = pd.read_csv(RAW_DIR / "mobility.csv", parse_dates=["date"])
gov = pd.read_csv(RAW_DIR / "oxford-government-response.csv", parse_dates=["date"])
vac = pd.read_csv(RAW_DIR / "vaccinations.csv", parse_dates=["date"])
dem = pd.read_csv(RAW_DIR / "demographics.csv")
idx = pd.read_csv(RAW_DIR / "index.csv")

print("Datos crudos cargados correctamente.")

# ========================
# 2. Quedarnos solo nivel país
# ========================

# En index las filas de país son aquellas donde subregion1_code es NaN
idx_countries = idx[idx["subregion1_code"].isna()].copy()

country_cols = ["location_key", "country_code", "country_name"]
idx_countries = idx_countries[country_cols]

def filter_to_countries(df: pd.DataFrame, has_date: bool = True) -> pd.DataFrame:
    """
    Filtra un DataFrame a filas de país (usando idx_countries)
    y añade country_code y country_name.
    """
    df = df.merge(idx_countries, on="location_key", how="inner")
    if has_date and "date" in df.columns:
        df = df.sort_values(["country_code", "date"])
    else:
        df = df.sort_values(["country_code"])
    return df

epi_c = filter_to_countries(epi, has_date=True)
mob_c = filter_to_countries(mob, has_date=True)
gov_c = filter_to_countries(gov, has_date=True)
vac_c = filter_to_countries(vac, has_date=True)
dem_c = filter_to_countries(dem, has_date=False)

print("Filtrado a nivel país completado.")

# ========================
# 3. Seleccionar columnas
# ========================

# Epidemiología: seleccionamos columnas principales
epi_cols = [
    "date", "country_code", "country_name",
    "new_confirmed", "new_deceased", "new_recovered", "new_tested",
    "cumulative_confirmed", "cumulative_deceased",
    "cumulative_recovered", "cumulative_tested",
]

# Nos quedamos solo con columnas que existan de verdad (por si faltan algunas)
epi_cols_existing = [c for c in epi_cols if c in epi_c.columns]
epi_c = epi_c[epi_cols_existing]

# Movilidad: dejamos fecha/país + todo lo demás salvo location_key
mobility_cols = ["date", "country_code", "country_name"] + [
    c for c in mob_c.columns
    if c not in ["location_key", "date", "country_code", "country_name"]
]
mob_c = mob_c[mobility_cols]

# Respuesta de gobierno (Oxford)
gov_cols = ["date", "country_code", "country_name"] + [
    c for c in gov_c.columns
    if c not in ["location_key", "date", "country_code", "country_name"]
]
gov_c = gov_c[gov_cols]

# Vacunas
vac_cols = ["date", "country_code", "country_name"] + [
    c for c in vac_c.columns
    if c not in ["location_key", "date", "country_code", "country_name"]
]
vac_c = vac_c[vac_cols]

# Demografía (sin fecha)
dem_cols = ["country_code", "country_name"] + [
    c for c in dem_c.columns
    if c not in ["location_key", "country_code", "country_name"]
]
dem_c = dem_c[dem_cols]

# ========================
# 4. Guardar tablas procesadas
# ========================

epi_path = PROC_DIR / "covid_epi_country.csv"
mob_path = PROC_DIR / "covid_mobility_country.csv"
gov_path = PROC_DIR / "covid_govresponse_country.csv"
vac_path = PROC_DIR / "covid_vaccinations_country.csv"
dem_path = PROC_DIR / "covid_demographics_country.csv"

epi_c.to_csv(epi_path, index=False)
mob_c.to_csv(mob_path, index=False)
gov_c.to_csv(gov_path, index=False)
vac_c.to_csv(vac_path, index=False)
dem_c.to_csv(dem_path, index=False)

print(f"Guardado {epi_path}  -> {len(epi_c)} filas, {len(epi_c.columns)} columnas.")
print(f"Guardado {mob_path}  -> {len(mob_c)} filas, {len(mob_c.columns)} columnas.")
print(f"Guardado {gov_path}  -> {len(gov_c)} filas, {len(gov_c.columns)} columnas.")
print(f"Guardado {vac_path}  -> {len(vac_c)} filas, {len(vac_c.columns)} columnas.")
print(f"Guardado {dem_path}  -> {len(dem_c)} filas, {len(dem_c.columns)} columnas.")

# ========================
# 5. Tabla "ancha" país-fecha con todo
# ========================

# Base: fechas + país únicas a partir de epidemiología
base = epi_c[["date", "country_code", "country_name"]].drop_duplicates()

# Merge sucesivos
all_df = base.merge(
    mob_c, on=["date", "country_code", "country_name"], how="left", suffixes=("", "_mob")
).merge(
    gov_c, on=["date", "country_code", "country_name"], how="left", suffixes=("", "_gov")
).merge(
    vac_c, on=["date", "country_code", "country_name"], how="left", suffixes=("", "_vac")
)

# Añadimos epidemiología (por si hemos perdido columnas)
all_df = all_df.merge(
    epi_c, on=["date", "country_code", "country_name"], how="left", suffixes=("", "_epi")
)

# Demografía: se añade por país y se repetirá en todas las fechas (está bien)
all_df = all_df.merge(
    dem_c, on=["country_code", "country_name"], how="left"
)

all_path = PROC_DIR / "covid_country_all.csv"
all_df.to_csv(all_path, index=False)

print(f"Guardado {all_path} -> {len(all_df)} filas, {len(all_df.columns)} columnas.")
print("✅ Preparación de datos completada.")
