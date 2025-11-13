from pathlib import Path
import requests

# Carpeta donde se guardarán los datos brutos
RAW_DIR = Path(__file__).resolve().parent / "data" / "raw"
RAW_DIR.mkdir(parents=True, exist_ok=True)

# URLs oficiales del dataset "COVID-19 Open Data" de Google
BASE_URL = "https://storage.googleapis.com/covid19-open-data/v3"

FILES = {
    "epidemiology.csv": f"{BASE_URL}/epidemiology.csv",
    "mobility.csv": f"{BASE_URL}/mobility.csv",
    "vaccinations.csv": f"{BASE_URL}/vaccinations.csv",
    "Global_vaccination_search_insights.csv": f"{BASE_URL}/Global-vaccination-search-insights.csv",
    "by-sex.csv": f"{BASE_URL}/by-sex.csv",
    "demographics.csv": f"{BASE_URL}/demographics.csv",
    "economy.csv": f"{BASE_URL}/economy.csv",
    "geography.csv": f"{BASE_URL}/geography.csv",
    "health.csv": f"{BASE_URL}/health.csv",
    "hospitalizations.csv": f"{BASE_URL}/hospitalizations.csv",
    "index.csv": f"{BASE_URL}/index.csv",
    "lawatlas-emergency-declarations.csv": f"{BASE_URL}/lawatlas-emergency-declarations.csv",
    "oxford-government-response.csv": f"{BASE_URL}/oxford-government-response.csv",
}

def download_file(name: str, url: str):
    dest = RAW_DIR / name
    print(f"\n📥 Descargando {name}")
    print(f"   URL: {url}")
    resp = requests.get(url, stream=True)
    resp.raise_for_status()

    total = int(resp.headers.get("Content-Length", 0))
    chunk_size = 1024 * 1024  # 1 MB
    downloaded = 0

    with open(dest, "wb") as f:
        for chunk in resp.iter_content(chunk_size=chunk_size):
            if not chunk:
                continue
            f.write(chunk)
            downloaded += len(chunk)
            if total:
                pct = downloaded / total * 100
                print(f"\r   Progreso: {pct:5.1f}% ({downloaded/1e6:6.1f} MB)", end="")
    print(f"\n✅ Guardado en: {dest}")

def main():
    print(f"Guardando datos en: {RAW_DIR}")
    for name, url in FILES.items():
        try:
            download_file(name, url)
        except Exception as e:
            print(f"❌ Error descargando {name}: {e}")

    print("\n🎉 Descarga completada. Ahora puedes ejecutar:")
    print("   python prepare_data_all.py")

if __name__ == "__main__":
    main()
