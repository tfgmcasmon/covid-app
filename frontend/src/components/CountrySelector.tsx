import { useEffect, useState } from "react";
import { Country, fetchCountries } from "../api/covidApi";

interface Props {
  value: string;
  onChange: (code: string) => void;
}

export default function CountrySelector({ value, onChange }: Props) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCountries()
      .then(setCountries)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p>Cargando países...</p>;
  }

  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Selecciona un país...</option>
      {countries.map((c) => (
        <option key={c.country_code} value={c.country_code}>
          {c.country_name}
        </option>
      ))}
    </select>
  );
}
