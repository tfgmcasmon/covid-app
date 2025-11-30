import React from "react";

interface MobilityMetricSelectProps {
  /** Métrica de movilidad seleccionada (ej. 'retail_and_recreation') */
  value: string;
  /** Callback cuando cambia la métrica de movilidad */
  onChange: (value: string) => void;
}

const MOBILITY_METRICS = [
  { value: "retail_and_recreation", label: "Ocio y restauración" },
  { value: "grocery_and_pharmacy", label: "Supermercados y farmacias" },
  { value: "residential", label: "Residencial" },
  { value: "workplace", label: "Trabajo" },
  { value: "transit_stations", label: "Transporte" },
  { value: "parks", label: "Parques" },
];

const MobilityMetricSelect: React.FC<MobilityMetricSelectProps> = ({
  value,
  onChange,
}) => {
  return (
    <select
      className="control select-control"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {MOBILITY_METRICS.map((metric) => (
        <option key={metric.value} value={metric.value}>
          {metric.label}
        </option>
      ))}
    </select>
  );
};

export default MobilityMetricSelect;
