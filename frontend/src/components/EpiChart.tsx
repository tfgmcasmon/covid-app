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
  const values = data.map((d) => d.value);
  const countryName = data[0]?.country_name ?? "";

  return (
    <div style={{ marginTop: "20px" }}>
      <h2>Epidemiología</h2>
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
          title: `${selectedMetric} — ${countryName}`,
          xaxis: { title: "Fecha" },
          yaxis: { title: "Casos / fallecidos / tests" },
          margin: { l: 60, r: 20, t: 60, b: 60 },
        }}
        style={{ width: "100%", height: "450px" }}
      />
    </div>
  );
};

export default EpiChart;
