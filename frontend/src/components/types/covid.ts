export interface MapDataPoint {
  date: string;          // "YYYY-MM-DD"
  country_code: string;  // ISO2
  country_name: string;
  new_confirmed_per_100k: number;
  new_confirmed_per_100k_ma7: number;
  cumulative_confirmed_per_100k: number;
}

export interface VaccImpactPoint {
  date: string;          // "YYYY-MM-DD"
  country_code: string;  // ISO2
  country_name: string;
  people_fully_vaccinated_per_hundred: number;
  new_confirmed_per_100k_ma7: number;
}
