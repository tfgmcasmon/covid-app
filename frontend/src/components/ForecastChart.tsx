import { useEffect, useState } from "react";
import Plot from "react-plotly.js";

type ForecastPoint = {
  date: string;
  value: number;
  day: number;
};

type HistoricalPoint = {
  date: string;
  value: number;
};

interface ForecastChartProps {
  selectedCountry: string;
  selectedMetric: string;
}

const metricLabels: Record<string, string> = {
  new_confirmed: "Nuevos casos",
  new_deceased: "Nuevos fallecidos",
  cumulative_confirmed: "Casos acumulados",
  cumulative_deceased: "Fallecidos acumulados",
  new_tested: "Nuevos tests",
  cumulative_tested: "Tests acumulados",
};

const ForecastChart: React.FC<ForecastChartProps> = ({
  selectedCountry,
  selectedMetric,
}) => {
  const [historical, setHistorical] = useState<HistoricalPoint[]>([]);
  const [forecast, setForecast] = useState<ForecastPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:5000/api";

  useEffect(() => {
    if (!selectedCountry) {
      setHistorical([]);
      setForecast([]);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1) Serie histórica
        const epiRes = await fetch(
          `${apiBaseUrl}/epi-timeseries?country_code=${selectedCountry}&metric=${selectedMetric}`,
        );
        if (!epiRes.ok) {
          throw new Error("Error al cargar la serie histórica");
        }
        const epiJson: HistoricalPoint[] = await epiRes.json();

        // 2) Forecast (por ejemplo, 60 días)
        const horizon = 60;
        const fcRes = await fetch(
          `${apiBaseUrl}/forecast?country_code=${selectedCountry}&metric=${selectedMetric}&horizon=${horizon}`,
        );
        if (!fcRes.ok) {
          throw new Error("Error al cargar la predicción");
        }
        const fcJson = await fcRes.json();

        setHistorical(epiJson);
        setForecast(fcJson.forecast ?? []);
      } catch (err: any) {
        setError(err.message ?? "Error inesperado");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCountry, selectedMetric, apiBaseUrl]);

  if (!selectedCountry) {
    return (
      <div className="card card--empty">
        <h2 className="card-title">Perspectiva y predicción</h2>
        <p className="card-subtitle">
          Selecciona un país para ver la predicción de la métrica elegida.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">Perspectiva y predicción</h2>
          <p className="card-subtitle">
            Serie histórica + proyección futura basada en el comportamiento
            reciente.
          </p>
        </div>
      </div>

      {loading && <p>Cargando datos…</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && historical.length > 0 && (
        <Plot
          data={[
            {
              x: historical.map((p) => p.date),
              y: historical.map((p) => p.value),
              type: "scatter",
              mode: "lines",
              name: "Histórico",
            },
            {
              x: forecast.map((p) => p.date),
              y: forecast.map((p) => p.value),
              type: "scatter",
              mode: "lines",
              name: "Predicción",
              line: { dash: "dash" as const },
            },
          ]}
          layout={{
            autosize: true,
            margin: { l: 60, r: 40, t: 30, b: 40 },
            paper_bgcolor: "rgba(0,0,0,0)",
            plot_bgcolor: "rgba(0,0,0,0)",
            font: { color: "#e5e7eb" },
            xaxis: {
              title: "Fecha",
              showgrid: false,
            },
            yaxis: {
              title: metricLabels[selectedMetric] ?? selectedMetric,
              gridcolor: "rgba(148, 163, 184, 0.3)",
            },
            legend: {
              orientation: "h",
              y: -0.15,
            },
          }}
          style={{ width: "100%", height: 360 }}
          config={{ displayModeBar: false, responsive: true }}
        />
      )}

      {!loading && !error && historical.length === 0 && (
        <p>No hay datos suficientes para generar una predicción.</p>
      )}
    </div>
  );
};

export default ForecastChart;
