import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data" / "processed"

epi_path = DATA_DIR / "covid_epi_country.csv"
vax_path = DATA_DIR / "covid_vaccinations_country.csv"
demo_path = DATA_DIR / "covid_demographics_country.csv"

print("EPI:", epi_path.exists(), epi_path)
print("VACC:", vax_path.exists(), vax_path)
print("DEMO:", demo_path.exists(), demo_path)

epi = pd.read_csv(epi_path, parse_dates=["date"])
vax = pd.read_csv(vax_path, parse_dates=["date"])
demo = pd.read_csv(demo_path)

# -------- 1. SNAPSHOTS MENSUALES (último dato del mes por país) -------- #

epi["month"] = epi["date"].dt.to_period("M").dt.to_timestamp("M")
vax["month"] = vax["date"].dt.to_period("M").dt.to_timestamp("M")

epi_last = (
    epi.sort_values("date")
    .groupby(["country_code", "month"])
    .tail(1)
    .copy()
)
vax_last = (
    vax.sort_values("date")
    .groupby(["country_code", "month"])
    .tail(1)
    .copy()
)

# quitamos la fecha diaria y usamos el fin de mes como 'date'
epi_last = epi_last.drop(columns=["date"], errors="ignore")
vax_last = vax_last.drop(columns=["date"], errors="ignore")

epi_last = epi_last.rename(columns={"month": "date"})
vax_last = vax_last.rename(columns={"month": "date"})

# evitar duplicar country_name: lo tomamos solo de demografía
epi_last = epi_last.drop(columns=["country_name"], errors="ignore")
vax_last = vax_last.drop(columns=["country_name"], errors="ignore")

# demografía: nos quedamos con nombre y población
demo = demo[["country_code", "country_name", "population"]]

# -------- 2. MERGE PRINCIPAL -------- #

df = (
    epi_last.merge(vax_last, on=["country_code", "date"], how="left")
    .merge(demo, on="country_code", how="left")
)

if "country_name" not in df.columns:
    raise ValueError("country_name missing after merge")

# -------- 3. MÉTRICAS CRUDAS -------- #

df["cases_per_100k"] = df["cumulative_confirmed"] / (df["population"] / 100_000)
df["deaths_per_100k"] = df["cumulative_deceased"] / (df["population"] / 100_000)

df["vacc_coverage"] = (
    df["cumulative_persons_fully_vaccinated"] / df["population"] * 100
)
df["vacc_coverage"] = df["vacc_coverage"].clip(lower=0, upper=100)

df["cfr"] = df["cumulative_deceased"] / df["cumulative_confirmed"]
df["cfr"] = df["cfr"].clip(lower=0, upper=0.20)

metrics = ["cases_per_100k", "deaths_per_100k", "vacc_coverage", "cfr"]

# -------- 4. NORMALIZACIÓN 0–100 POR FECHA -------- #

def normalize_series(s: pd.Series) -> pd.Series:
  s = s.replace([float("inf")], pd.NA)
  min_v, max_v = s.min(), s.max()
  if pd.isna(min_v) or pd.isna(max_v) or min_v == max_v:
      return pd.Series(0.0, index=s.index)
  return ((s - min_v) / (max_v - min_v) * 100).fillna(0.0)

for m in metrics:
    df[m + "_norm"] = df.groupby("date")[m].transform(normalize_series)

# -------- 5. SALIDA JSON -------- #

out_cols = (
    ["country_code", "country_name", "date"]
    + metrics
    + [m + "_norm" for m in metrics]
)

out = df[out_cols].sort_values(["date", "country_name"])

out_path = BASE_DIR.parent / "frontend" / "public" / "data" / "country_profile.json"
out.to_json(out_path, orient="records", date_format="iso")

print(f"\nGuardado {out_path} con {len(out)} filas (país x mes)")
print("Primeras fechas únicas:", out["date"].drop_duplicates().head())
