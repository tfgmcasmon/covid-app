import React, { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { MapDataPoint } from "../types/covid";

const cardStyle: React.CSSProperties = {
  height: "320px",
  borderRadius: "0.9rem",
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  boxShadow: "0 8px 20px rgba(15, 23, 42, 0.06)",
  padding: "1rem 1.25rem",
  display: "flex",
  flexDirection: "column",
  gap: "0.75rem",
};

type MetricKey = "new_confirmed_per_100k_ma7" | "cumulative_confirmed_per_100k";

const metricLabels: Record<MetricKey, string> = {
  new_confirmed_per_100k_ma7: "New cases per 100k (7-day MA)",
  cumulative_confirmed_per_100k: "Cumulative cases per 100k",
};

const CountryTimeSeries: React.FC = () => {
  const [data, setData] = useState<MapDataPoint[]>([]);
  const [countries, setCountries] = useState<
    { code: string; name: string }[]
  >([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [metric, setMetric] = useState<MetricKey>("new_confirmed_per_100k_ma7");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar map_data.json y normalizar
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/data/map_data.json");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: any[] = await res.json();

        const cleaned: MapDataPoint[] = json
          .filter(
            (d) =>
              d.country_code !== null &&
              d.country_code !== undefined &&
              d.country_code !== ""
          )
          .map((d) => ({
            date: (d.date ?? "").slice(0, 10),
            country_code: (d.country_code ?? "").toUpperCase(),
            country_name: (d.country_name ?? "").trim(),
            new_confirmed_per_100k: d.new_confirmed_per_100k ?? 0,
            new_confirmed_per_100k_ma7: d.new_confirmed_per_100k_ma7 ?? 0,
            cumulative_confirmed_per_100k: d.cumulative_confirmed_per_100k ?? 0,
          }))
          .sort((a, b) => a.date.localeCompare(b.date));

        const uniqueCountries = Array.from(
          new Map(
            cleaned.map((d) => [d.country_code, d.country_name])
          ).entries()
        )
          .map(([code, name]) => ({ code, name }))
          .sort((a, b) => a.name.localeCompare(b.name));

        setData(cleaned);
        setCountries(uniqueCountries);

        // País por defecto: España si existe; si no, el primero
        const defaultCode =
          uniqueCountries.find((c) => c.code === "ES")?.code ||
          uniqueCountries[0]?.code ||
          "";
        setSelectedCountry(defaultCode);

        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Error loading time series data");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const chartData = useMemo(() => {
    if (!selectedCountry) return [];
    return data
      .filter((d) => d.country_code === selectedCountry)
      .map((d) => ({
        date: d.date,
        value: d[metric],
      }));
  }, [data, selectedCountry, metric]);

  const currentCountryName =
    countries.find((c) => c.code === selectedCountry)?.name || selectedCountry;

  if (loading)
    return (
      <div style={cardStyle}>
        <span style={{ fontSize: "0.9rem", color: "#6b7280" }}>
          Loading country time series...
        </span>
      </div>
    );

  if (error)
    return (
      <div style={cardStyle}>
        <span style={{ fontSize: "0.9rem", color: "#b91c1c" }}>{error}</span>
      </div>
    );

  return (
    <div style={cardStyle}>
      {/* Controles */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "0.75rem",
          alignItems: "center",
          marginBottom: "0.25rem",
        }}
      >
        <div>
          <div
            style={{
              fontWeight: 600,
              fontSize: "0.95rem",
              marginBottom: "0.1rem",
            }}
          >
            {currentCountryName}
          </div>
          <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
            {metricLabels[metric]}
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {/* Selector país */}
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #d1d5db",
              borderRadius: "0.5rem",
              padding: "0.25rem 0.5rem",
              fontSize: "0.8rem",
              color: "#111827",
              maxWidth: "180px",
            }}
          >
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Selector métrica */}
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as MetricKey)}
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #d1d5db",
              borderRadius: "0.5rem",
              padding: "0.25rem 0.5rem",
              fontSize: "0.8rem",
              color: "#111827",
            }}
          >
            <option value="new_confirmed_per_100k_ma7">
              New cases (7-day MA)
            </option>
            <option value="cumulative_confirmed_per_100k">
              Cumulative cases
            </option>
          </select>
        </div>
      </div>

      {/* Gráfica */}
      <div style={{ flex: 1 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, left: 0, right: 0 }}>
            <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              tickMargin={6}
              minTickGap={20}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              tickMargin={4}
              width={55}
              allowDecimals={false}
            />
            <Tooltip
              formatter={(value: any) =>
                [value.toFixed ? value.toFixed(1) : value, metricLabels[metric]]
              }
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
            <Line
              type="monotone"
              dataKey="value"
              name={metricLabels[metric]}
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CountryTimeSeries;
