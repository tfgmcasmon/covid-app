import React, { useEffect, useState } from "react";
import Plot from "react-plotly.js";

interface EpiPoint {
  date: string;
  country_code: string | null;
  country_name: string | null;
  metric: string;
  value: number | null;
}

interface Props {
  selectedCountry: string;
  selectedMetric: string;
}

const EpiChart: React.FC<Props> = ({ selectedCountry, selectedMetric }) => {
  const [data, setData] = useState<EpiPoint[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedCountry) {
      setData([]);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/epi-timeseries?country_code=${selectedCountry}&metric=${selectedMetric}`
        );
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Error cargando datos epidemiológicos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCountry, selectedMetric]);

  if (!selectedCountry) {
    return <p>Selecciona un país para ver los datos epidemiológicos.</p>;
  }

  if (loading) {
    return <p>Cargando datos epidemiológicos...</p>;
  }

  if (!data.length) {
    return <p>No hay datos epidemiológicos para la selección actual.</p>;
  }

  const dates = data.map((d) => d.date);
  const values = data.map((d) => d.value ?? 0);
  const countryName = data[0]?.country_name ?? "";

  const maxValue = Math.max(...values);
  const maxIndex = values.indexOf(maxValue);
  const maxDate = dates[maxIndex];

  const lastValue = values[values.length - 1] ?? 0;
  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];

  return (
    <div className="chart-wrapper">
      <div className="kpi-row">
        <div className="kpi-card">
          <span className="kpi-label">Máximo diario</span>
          <strong className="kpi-value">
            {maxValue.toLocaleString("es-ES")}
          </strong>
          <span className="kpi-foot">Día pico: {maxDate}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">
            {selectedMetric.startsWith("cumulative")
              ? "Valor acumulado final"
              : "Último dato disponible"}
          </span>
          <strong className="kpi-value">
            {lastValue.toLocaleString("es-ES")}
          </strong>
          <span className="kpi-foot">País: {countryName}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Periodo analizado</span>
          <strong className="kpi-value">
            {firstDate} – {lastDate}
          </strong>
          <span className="kpi-foot">
            {values.filter((v) => v > 0).length.toLocaleString("es-ES")} días con
            datos
          </span>
        </div>
      </div>

      <Plot
        data={[
          {
            x: dates,
            y: values,
            type: "scatter",
            mode: "lines",
          },
        ]}
        layout={{
          title: "",
          xaxis: { title: "Fecha" },
          yaxis: { title: "Casos / fallecidos / tests" },
          margin: { l: 60, r: 20, t: 10, b: 60 },
        }}
        style={{ width: "100%", height: 420 }}
      />
    </div>
  );
};

export default EpiChart;
