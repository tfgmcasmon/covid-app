import React, { useEffect, useMemo, useState } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface CountryProfile {
  country_code: string;
  country_name: string;
  date: string; // ISO string
  cases_per_100k: number;
  deaths_per_100k: number;
  vacc_coverage: number;
  cfr: number;
  cases_per_100k_norm: number;
  deaths_per_100k_norm: number;
  vacc_coverage_norm: number;
  cfr_norm: number;
}

const METRICS = [
  { key: "cases_per_100k_norm", label: "Cases per 100k" },
  { key: "deaths_per_100k_norm", label: "Deaths per 100k" },
  { key: "vacc_coverage_norm", label: "Full vaccination (%)" },
  { key: "cfr_norm", label: "Case fatality rate" },
] as const;

type MetricKey = (typeof METRICS)[number]["key"];

const formatNumber = (value: number | undefined, decimals = 1) => {
  if (value == null || Number.isNaN(value)) return "–";
  return value.toLocaleString(undefined, {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  });
};

const formatDateLabel = (iso: string) => {
  // "2021-06-30T00:00:00.000Z" -> "Jun 2021"
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short" });
};

const CountryProfileRadar: React.FC = () => {
  const [profiles, setProfiles] = useState<CountryProfile[]>([]);
  const [selectedCode, setSelectedCode] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // ---- FETCH DATA ----
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/data/country_profile.json");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as CountryProfile[];
        setProfiles(json);

        // fechas únicas ordenadas
        const uniqueDates = Array.from(new Set(json.map((p) => p.date))).sort();
        if (uniqueDates.length > 0) {
          setSelectedDate(uniqueDates[uniqueDates.length - 1]); // última fecha por defecto
        }

        // país por defecto: ES si existe, si no el primero
        const allCodes = Array.from(new Set(json.map((p) => p.country_code)));
        const hasES = allCodes.includes("ES");
        setSelectedCode(hasES ? "ES" : allCodes[0] ?? "");
      } catch (e) {
        console.error(e);
        setError("Error loading country profile data");
      }
    };
    fetchData();
  }, []);

  // ---- LISTAS DEDUPLICADAS ----
  const countryOptions = useMemo(
    () =>
      Array.from(
        new Map(
          profiles.map((p) => [p.country_code, p.country_name])
        ).entries()
      ).map(([code, name]) => ({ code, name })),
    [profiles]
  );

  const dateOptions = useMemo(
    () => Array.from(new Set(profiles.map((p) => p.date))).sort(),
    [profiles]
  );

  const selectedProfile = useMemo(
    () =>
      profiles.find(
        (p) => p.country_code === selectedCode && p.date === selectedDate
      ),
    [profiles, selectedCode, selectedDate]
  );

  const radarData =
    selectedProfile &&
    METRICS.map((m) => ({
      metric: m.label,
      value: (selectedProfile[m.key as MetricKey] as number | undefined) ?? 0,
    }));

  const currentDateIndex = dateOptions.indexOf(selectedDate);

  return (
    <div
      style={{
        width: "100%",
        minHeight: 360,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* Controles: país + fecha */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          alignItems: "flex-end",
          flexWrap: "wrap",
        }}
      >
        {/* Selector de país */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
            Select country
          </span>
          <select
            value={selectedCode}
            onChange={(e) => setSelectedCode(e.target.value)}
            style={{
              minWidth: 180,
              padding: "6px 10px",
              borderRadius: 999,
              border: "1px solid #d1d5db",
              fontSize: "0.85rem",
              background: "#fff",
            }}
          >
            {countryOptions.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Selector de fecha (slider) */}
        {dateOptions.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              minWidth: 230,
            }}
          >
            <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
              Snapshot date
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <input
                type="range"
                min={0}
                max={dateOptions.length - 1}
                value={currentDateIndex >= 0 ? currentDateIndex : 0}
                onChange={(e) => {
                  const idx = Number(e.target.value);
                  const d = dateOptions[idx];
                  if (d) setSelectedDate(d);
                }}
                style={{ flex: 1 }}
              />
              <span
                style={{
                  fontSize: "0.8rem",
                  color: "#4b5563",
                  minWidth: 74,
                  textAlign: "right",
                }}
              >
                {selectedDate ? formatDateLabel(selectedDate) : "—"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* KPIs */}
      {selectedProfile && (
        <div
          style={{
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            fontSize: "0.78rem",
            color: "#4b5563",
          }}
        >
          <div>
            <strong>{formatNumber(selectedProfile.cases_per_100k, 0)}</strong>{" "}
            cases / 100k
          </div>
          <div>
            <strong>{formatNumber(selectedProfile.deaths_per_100k, 1)}</strong>{" "}
            deaths / 100k
          </div>
          <div>
            <strong>{formatNumber(selectedProfile.vacc_coverage, 1)}%</strong>{" "}
            fully vaccinated
          </div>
          <div>
            <strong>{formatNumber(selectedProfile.cfr * 100, 2)}%</strong> case
            fatality rate
          </div>
        </div>
      )}

      {/* Radar */}
      <div style={{ width: "100%", height: 260, marginTop: 4 }}>
        {error && (
          <div style={{ color: "#b91c1c", fontSize: "0.85rem" }}>{error}</div>
        )}

        {!error && radarData && (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} outerRadius="70%">
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fontSize: 11, fill: "#4b5563" }}
              />
              <PolarRadiusAxis angle={45} domain={[0, 100]} tick={false} />
              <Radar
                name="Profile"
                dataKey="value"
                stroke="#111827"
                fill="#111827"
                fillOpacity={0.35}
              />
              <Tooltip
                contentStyle={{
                  fontSize: "0.75rem",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Leyenda con animación suave */}
      {selectedProfile && (
        <div
          key={`${selectedCode}-${selectedDate}`}
          className="profile-legend profile-legend-animated"
        >
          <h4>Profile legend</h4>
          <ul>
            <li>
              <span className="legend-dot cases" />
              <strong>Cases per 100k:</strong> cumulative confirmed cases
              relative to the population at the selected date.
            </li>
            <li>
              <span className="legend-dot deaths" />
              <strong>Deaths per 100k:</strong> reported deaths relative to the
              population at the selected date.
            </li>
            <li>
              <span className="legend-dot vacc" />
              <strong>Full vaccination (%):</strong> share of the population
              that is fully vaccinated.
            </li>
            <li>
              <span className="legend-dot cfr" />
              <strong>Case fatality rate:</strong> ratio between deaths and
              confirmed cases (capped at 20% to avoid extreme outliers).
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default CountryProfileRadar;
