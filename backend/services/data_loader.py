import pandas as pd
from functools import lru_cache
from config import EPIDEMIOLOGY_FILE, MOBILITY_FILE, COUNTRY_FILE, CACHE_ENABLED

class DataLoader:

    @staticmethod
    @lru_cache(maxsize=None)
    def load_epi():
        return pd.read_csv(EPIDEMIOLOGY_FILE)

    @staticmethod
    @lru_cache(maxsize=None)
    def load_mobility():
        return pd.read_csv(MOBILITY_FILE)

    @staticmethod
    @lru_cache(maxsize=None)
    def load_countries():
        return pd.read_csv(COUNTRY_FILE)


# Reset cache (useful for dev)
def reset_cache():
    DataLoader.load_epi.cache_clear()
    DataLoader.load_mobility.cache_clear()
    DataLoader.load_countries.cache_clear()
