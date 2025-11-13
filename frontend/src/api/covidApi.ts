const API_URL = import.meta.env.VITE_API_URL as string;

export interface EpiPoint {
  date: string;
  country_code: string;
  country_name: string;
  metric: string;
  value: number | null;
}

export interface Country {
  country_code: string;
  country_name: string;
}

export async function fetchCountries(): Promise<Country[]> {
  const res = await fetch(`${API_URL}/countries`);
  if (!res.ok) {
    throw new Error("Error fetching countries");
  }
  return res.json();
}

export async function fetchEpiTimeseries(
  countryCode: string,
  metric: string
): Promise<EpiPoint[]> {
  const res = await fetch(
    `${API_URL}/epi-timeseries?country_code=${countryCode}&metric=${metric}`
  );
  if (!res.ok) {
    throw new Error("Error fetching epi timeseries");
  }
  return res.json();
}

/**
 * Movilidad: usamos la API /mobility-timeseries.
 * NO pasamos metric → el backend usa la primera métrica disponible por defecto.
 */
export async function fetchMobilityTimeseries(
  countryCode: string
): Promise<EpiPoint[]> {
  const res = await fetch(
    `${API_URL}/mobility-timeseries?country_code=${countryCode}`
  );
  if (!res.ok) {
    throw new Error("Error fetching mobility timeseries");
  }
  return res.json();
}
