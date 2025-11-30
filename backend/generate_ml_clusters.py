import pandas as pd
from pathlib import Path

try:
    from sklearn.cluster import KMeans
    from sklearn.preprocessing import StandardScaler
except ImportError as e:
    raise SystemExit(
        "Necesitas instalar scikit-learn para esta parte de ML.\n"
        "Ejecuta:  pip install scikit-learn"
    ) from e

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

demo = demo[["country_code", "country_name", "population"]]

years = [2020, 2021, 2022]
all_records = []

for year in years:
    print(f"\n=== Procesando año {year} ===")

    epi_year = epi[epi["date"].dt.year == year].copy()
    if epi_year.empty:
        print(f"Sin datos EPI para {year}, se omite.")
        continue

    # Casos y muertes del AÑO (no acumulados)
    epi_agg = (
        epi_year.groupby("country_code")
        .agg(
            year_cases=("new_confirmed", "sum"),
            year_deaths=("new_deceased", "sum"),
        )
        .reset_index()
    )

    # Última fecha de vacunación de ese año por país
    vax_year = vax[vax["date"].dt.year == year].copy()
    if not vax_year.empty:
        vax_last = (
            vax_year.sort_values("date")
            .groupby("country_code")
            .tail(1)[
                [
                    "country_code",
                    "cumulative_persons_fully_vaccinated",
                ]
            ]
            .rename(
                columns={
                    "cumulative_persons_fully_vaccinated": "full_vaccinated_year_end"
                }
            )
        )
    else:
        vax_last = pd.DataFrame(
            columns=["country_code", "full_vaccinated_year_end"]
        )

    df_year = (
        epi_agg.merge(vax_last, on="country_code", how="left")
        .merge(demo, on="country_code", how="left")
    )

    # Métricas por 100k (para ese año) y % vacunación a final de año
    df_year["cases_per_100k"] = (
        df_year["year_cases"] / (df_year["population"] / 100_000)
    )
    df_year["deaths_per_100k"] = (
        df_year["year_deaths"] / (df_year["population"] / 100_000)
    )

    df_year["vacc_coverage"] = (
        df_year["full_vaccinated_year_end"] / df_year["population"] * 100
    )
    df_year["vacc_coverage"] = df_year["vacc_coverage"].fillna(0).clip(0, 100)

    df_year["cfr"] = df_year["year_deaths"] / df_year["year_cases"]
    df_year["cfr"] = df_year["cfr"].fillna(0).clip(0, 0.20)

    features = ["cases_per_100k", "deaths_per_100k", "vacc_coverage", "cfr"]

    mask_valid = df_year[features].notna().all(axis=1) & (df_year["year_cases"] > 0)
    df_valid = df_year.loc[mask_valid].copy()

    if df_valid.empty:
        print(f"Sin filas válidas para {year}, se omite.")
        continue

    X = df_valid[features].to_numpy()

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    n_clusters = 4
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    clusters = kmeans.fit_predict(X_scaled)
    df_valid["cluster"] = clusters

    # Etiquetas según severidad (ordenado por muertes / 100k)
    cluster_order = (
        df_valid.groupby("cluster")["deaths_per_100k"]
        .mean()
        .sort_values()
        .index.to_list()
    )

    label_templates = [
        "Low impact / high vaccination",
        "Moderate impact",
        "High deaths / medium vaccination",
        "Very high impact",
    ]

    cluster_labels = {}
    for idx, cl in enumerate(cluster_order):
        label = label_templates[idx] if idx < len(label_templates) else f"Cluster {idx+1}"
        # Incluir el año en la etiqueta para claridad
        cluster_labels[cl] = f"{label} ({year})"

    df_valid["cluster_label"] = df_valid["cluster"].map(cluster_labels)
    df_valid["year"] = year

    all_records.append(
        df_valid[
            [
                "year",
                "country_code",
                "country_name",
                "cases_per_100k",
                "deaths_per_100k",
                "vacc_coverage",
                "cfr",
                "cluster",
                "cluster_label",
            ]
        ]
    )

# ---- Output JSON ----

if not all_records:
    raise SystemExit("No se ha generado ningún año con datos válidos.")

out_df = pd.concat(all_records, ignore_index=True)
out_path = BASE_DIR.parent / "frontend" / "public" / "data" / "country_clusters.json"
out_df.to_json(out_path, orient="records")

print(f"\nGuardado {out_path} con {len(out_df)} filas (años x países).")
print("Años disponibles:", sorted(out_df["year"].unique()))
