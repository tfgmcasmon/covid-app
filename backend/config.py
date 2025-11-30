# backend/config.py
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

DATA_DIR = BASE_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
PROCESSED_DIR = DATA_DIR / "processed"

EPIDEMIOLOGY_FILE = PROCESSED_DIR / "covid_epi_country.csv"
MOBILITY_FILE = PROCESSED_DIR / "covid_mobility_country.csv"
DEMOGRAPHICS_FILE = PROCESSED_DIR / "covid_demographics_country.csv"
