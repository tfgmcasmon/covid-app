import React, { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { MapDataPoint } from "../types/covid";

const containerStyle: React.CSSProperties = {
  height: "340px",
  borderRadius: "0.9rem",
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  boxShadow: "0 8px 20px rgba(15, 23, 42, 0.06)",
  padding: "0.9rem 1.25rem 1rem",
  display: "flex",
  flexDirection: "column",
  gap: "0.75rem",
  minWidth: 0, // importante para Recharts
};

interface CountryOption {
  code: string;
  name: string;
}

interface ChartPoint {
  date: string;
  actual?: number;
  predicted: number;
  isForecast: boolean;
}

const MIN_POINTS = 40; // mínimo de días con datos para entrenar
const TRAIN_DAYS = 90; // últimos N días para entrenar el modelo
const FORECAST_DAYS = 14; // horizonte de predicción

const VaccinationImpactScatter: React.FC = () => {
  const [data, setData] = useState<MapDataPoint[]>([]);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("ES");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Cargar map_data.json (el mismo del mapa)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/data/map_data.json");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: MapDataPoint[] = await res.json();

        const normalized: MapDataPoint[] = json
          .map((d) => {
            const rawCode = (d as any).country_code ?? "";
            const rawName = (d as any).country_name ?? "";
            const code = rawCode.toString().trim();
            const name = rawName.toString().trim();
            if (!code || !name) {
              // descartamos filas sin país
              return null;
            }

            return {
              ...d,
              date: (d as any).date?.toString().slice(0, 10) ?? "",
              country_code: code.toUpperCase(),
              country_name: name,
            } as MapDataPoint;
          })
          .filter((d): d is MapDataPoint => d !== null)
          .sort((a, b) => a.date.localeCompare(b.date));

        const countryMap = new Map<string, string>();
        normalized.forEach((d) => {
          if (!countryMap.has(d.country_code)) {
            countryMap.set(d.country_code, d.country_name);
          }
        });

        const countryOptions: CountryOption[] = Array.from(
          countryMap.entries()
        )
          .map(([code, name]) => ({ code, name }))
          .sort((a, b) => a.name.localeCompare(b.name));

        setData(normalized);
        setCountries(countryOptions);

        if (!countryMap.has("ES") && countryOptions.length > 0) {
          setSelectedCountry(countryOptions[0].code);
        }

        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Error loading data for ML forecast");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 2. Serie temporal de ese país (casos per 100k MA7)
  const series = useMemo(() => {
    const filtered = data
      .filter(
        (d) =>
          d.country_code === selectedCountry &&
          d.new_confirmed_per_100k_ma7 !== null &&
          d.new_confirmed_per_100k_ma7 !== undefined
      )
      .map((d) => ({
        date: d.date,
        value: Number(d.new_confirmed_per_100k_ma7),
      }))
      .filter((d) => Number.isFinite(d.value));

    return filtered.sort((a, b) => a.date.localeCompare(b.date));
  }, [data, selectedCountry]);

  // 3. Construir datos para el gráfico + modelo de regresión
  const { chartData, slope, intercept } = useMemo(() => {
    if (series.length < MIN_POINTS) {
      return { chartData: [] as ChartPoint[], slope: 0, intercept: 0 };
    }

    const trainLen = Math.min(TRAIN_DAYS, series.length);
    const trainSeries = series.slice(series.length - trainLen);

    const xs = trainSeries.map((_, i) => i);
    const ys = trainSeries.map((p) => p.value);

    const n = ys.length;
    if (n < 2) {
      return { chartData: [] as ChartPoint[], slope: 0, intercept: 0 };
    }

    const meanX = xs.reduce((a, b) => a + b, 0) / n;
    const meanY = ys.reduce((a, b) => a + b, 0) / n;

    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
      const dx = xs[i] - meanX;
      const dy = ys[i] - meanY;
      num += dx * dy;
      den += dx * dx;
    }
    const m = den === 0 ? 0 : num / den;
    const b = meanY - m * meanX;

    const chartPoints: ChartPoint[] = [];

    // histórico con real + pred
    for (let i = 0; i < trainLen; i++) {
      const p = trainSeries[i];
      const pred = Math.max(0, m * i + b);
      chartPoints.push({
        date: p.date,
        actual: p.value,
        predicted: pred,
        isForecast: false,
      });
    }

    // forecast futuro
    const lastDate = new Date(trainSeries[trainLen - 1].date);
    for (let j = 1; j <= FORECAST_DAYS; j++) {
      const d = new Date(lastDate);
      d.setDate(d.getDate() + j);
      const t = trainLen - 1 + j;
      const pred = Math.max(0, m * t + b);

      chartPoints.push({
        date: d.toISOString().slice(0, 10),
        predicted: pred,
        isForecast: true,
      });
    }

    return { chartData: chartPoints, slope: m, intercept: b };
  }, [series]);

  if (loading) {
    return (
      <div style={containerStyle}>
        <span style={{ opacity: 0.7, fontSize: "0.9rem" }}>
          Loading ML forecast data...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <span style={{ color: "#b91c1c", fontSize: "0.9rem" }}>{error}</span>
      </div>
    );
  }

  const hasModel = chartData.length > 0;

  return (
    <div style={containerStyle}>
      {/* Cabecera */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "0.75rem",
        }}
      >
        <div>
          <span style={{ color: "#4b5563", fontSize: "0.9rem" }}>
            Short-term forecast of new cases per 100k
          </span>
          <div
            style={{
              fontSize: "0.8rem",
              color: "#9ca3af",
              marginTop: "0.15rem",
              maxWidth: "320px",
            }}
          >
            We fit a simple linear regression model on the last{" "}
            {Math.min(TRAIN_DAYS, series.length)} days of data for the
            selected country and forecast the next {FORECAST_DAYS} days.
          </div>
          {hasModel && (
            <div
              style={{
                fontSize: "0.75rem",
                color: "#6b7280",
                marginTop: "0.15rem",
              }}
            >
              Model (ML): y = {slope.toFixed(2)} · t{" "}
              {intercept >= 0 ? "+" : ""}
              {intercept.toFixed(2)} &nbsp; (t = time index)
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
            Country
          </span>
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            style={{
              minWidth: "160px",
              backgroundColor: "#ffffff",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              padding: "0.3rem 0.5rem",
              fontSize: "0.85rem",
              color: "#111827",
              cursor: "pointer",
            }}
          >
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Gráfico */}
      <div style={{ flex: 1, marginTop: "0.5rem", minWidth: 0 }}>
        {!hasModel ? (
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.9rem",
              color: "#9ca3af",
              textAlign: "center",
            }}
          >
            Not enough data to fit an ML model for this country.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#6b7280" }}
                tickLine={false}
                minTickGap={25}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#6b7280" }}
                tickLine={false}
                width={55}
                label={{
                  value: "New cases per 100k (7-day MA)",
                  angle: -90,
                  position: "insideLeft",
                  style: { fill: "#6b7280", fontSize: 10 },
                }}
              />
              <Tooltip
                contentStyle={{
                  fontSize: "0.8rem",
                  borderRadius: "0.5rem",
                }}
                formatter={(value: any, name: string) => {
                  if (name === "actual")
                    return [value, "Observed (7-day MA)"];
                  return [value, "ML prediction"];
                }}
              />
              <Legend wrapperStyle={{ fontSize: "0.8rem" }} />
              <Line
                type="monotone"
                dataKey="actual"
                name="Observed cases"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="predicted"
                name={`ML forecast (+${FORECAST_DAYS} days)`}
                stroke="#f97316"
                strokeWidth={2}
                dot={false}
                strokeDasharray="4 4"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default VaccinationImpactScatter;
