import React from "react";

interface EpiMetricSelectProps {
  /** Métrica epidemiológica seleccionada (ej. 'new_confirmed') */
  value: string;
  /** Callback cuando cambia la métrica */
  onChange: (value: string) => void;
}

const EPI_METRICS = [
  { value: "new_confirmed", label: "Nuevos casos" },
  { value: "new_deceased", label: "Nuevos fallecidos" },
  { value: "cumulative_confirmed", label: "Casos acumulados" },
  { value: "cumulative_deceased", label: "Fallecidos acumulados" },
  { value: "new_tested", label: "Nuevos tests" },
  { value: "cumulative_tested", label: "Tests acumulados" },
];

const EpiMetricSelect: React.FC<EpiMetricSelectProps> = ({
  value,
  onChange,
}) => {
  return (
    <select
      className="control select-control"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {EPI_METRICS.map((metric) => (
        <option key={metric.value} value={metric.value}>
          {metric.label}
        </option>
      ))}
    </select>
  );
};

export default EpiMetricSelect;
