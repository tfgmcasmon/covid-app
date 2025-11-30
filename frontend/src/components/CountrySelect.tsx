import React from "react";

type Country = {
  country_code: string;
  country_name: string;
};

interface CountrySelectProps {
  /** Lista de países devueltos por la API */
  countries: Country[];
  /** Código del país seleccionado (ISO-2) */
  value: string;
  /** Callback cuando cambia el país */
  onChange: (value: string) => void;
}

const CountrySelect: React.FC<CountrySelectProps> = ({
  countries,
  value,
  onChange,
}) => {
  return (
    <select
      className="control select-control"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Selecciona un país…</option>
      {countries.map((c) => (
        <option key={c.country_code} value={c.country_code}>
          {c.country_name}
        </option>
      ))}
    </select>
  );
};

export default CountrySelect;
