import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
data_dir = BASE_DIR / "data" / "processed"

epi_path = data_dir / "covid_epi_country.csv"
vacc_path = data_dir / "covid_vaccinations_country.csv"
demo_path = data_dir / "covid_demographics_country.csv"

print("EPI :", epi_path.exists(), epi_path)
print("VACC:", vacc_path.exists(), vacc_path)
print("DEMO:", demo_path.exists(), demo_path)

epi = pd.read_csv(epi_path, parse_dates=["date"])
vacc = pd.read_csv(vacc_path, parse_dates=["date"])
demo = pd.read_csv(demo_path)

print("\nColumnas EPI:", list(epi.columns))
print("Columnas vacunación:", list(vacc.columns))
print("Columnas demográficas:", list(demo.columns))

# 1) CASOS: partimos de 'new_confirmed' y calculamos per 100k + media móvil 7 días

if "new_confirmed" not in epi.columns:
    raise SystemExit("[ERROR] 'new_confirmed' no está en covid_epi_country.csv")

# elegimos columna de población
pop_col = "population"
if pop_col not in demo.columns:
    # fallback: cualquier columna que contenga 'popul'
    for c in demo.columns:
        if "popul" in c.lower():
            pop_col = c
            break

if pop_col not in demo.columns:
    raise SystemExit("[ERROR] No he encontrado columna de población en demographics")

print("Usando columna de población:", pop_col)

demo_small = demo[["country_code", "country_name", pop_col]].copy()

# unimos epi + demo para tener población
epi_merged = pd.merge(
    epi,
    demo_small,
    on=["country_code", "country_name"],
    how="left",
)

# calculamos casos por 100k
epi_merged["new_confirmed_per_100k"] = (
    epi_merged["new_confirmed"] / epi_merged[pop_col] * 100000.0
)

# media móvil de 7 días por país
epi_merged = epi_merged.sort_values(["country_code", "date"])
epi_merged["new_confirmed_per_100k_ma7"] = (
    epi_merged
    .groupby("country_code")["new_confirmed_per_100k"]
    .transform(lambda s: s.rolling(7, min_periods=1).mean())
)

epi_small = epi_merged[
    ["date", "country_code", "country_name", "new_confirmed_per_100k_ma7"]
].copy()

# 2) VACUNACIÓN: usamos 'cumulative_persons_fully_vaccinated' si existe, si no otra acumulada

vacc_candidates = [
    "cumulative_persons_fully_vaccinated",
    "cumulative_persons_vaccinated",
    "total_persons_fully_vaccinated_sinovac",
]

vacc_col = None
for c in vacc_candidates:
    if c in vacc.columns:
        vacc_col = c
        break

if vacc_col is None:
    raise SystemExit("[ERROR] No he encontrado columna acumulada de vacunación")

print("Usando columna de vacunación:", vacc_col)

vacc_small = vacc[["date", "country_code", "country_name", vacc_col]].copy()

# unimos vacunación con población para poder hacer porcentaje
vacc_demo = pd.merge(
    vacc_small,
    demo_small,
    on=["country_code", "country_name"],
    how="left",
)

vacc_demo["people_fully_vaccinated_per_hundred"] = (
    vacc_demo[vacc_col] / vacc_demo[pop_col] * 100.0
)

# 3) Unimos epi (casos per 100k MA7) con vacunación (%)
merged = pd.merge(
    vacc_demo,
    epi_small,
    on=["date", "country_code", "country_name"],
    how="inner",
)

# limpiamos NAs
merged = merged.dropna(
    subset=["people_fully_vaccinated_per_hundred", "new_confirmed_per_100k_ma7"]
).copy()

merged = merged.sort_values("date")

# tipos numéricos limpios
merged["people_fully_vaccinated_per_hundred"] = \
    merged["people_fully_vaccinated_per_hundred"].astype(float)
merged["new_confirmed_per_100k_ma7"] = \
    merged["new_confirmed_per_100k_ma7"].astype(float)

# 4) Guardar JSON en frontend/public/data
out_dir = BASE_DIR.parent / "frontend" / "public" / "data"
out_dir.mkdir(parents=True, exist_ok=True)
out_path = out_dir / "vacc_impact_data.json"

merged.to_json(out_path, orient="records", date_format="iso")

print(f"\n[OK] Guardado JSON para vacunación vs impacto en: {out_path}")
print("Total filas:", len(merged))
