import React, { useEffect, useMemo, useState } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ClusterPoint {
  year: number;
  country_code: string;
  country_name: string;
  cases_per_100k: number;
  deaths_per_100k: number;
  vacc_coverage: number;
  cfr: number;
  cluster: number;
  cluster_label: string;
}

type ActiveCluster = number | "all";

const palette = ["#3b82f6", "#22c55e", "#f97316", "#ef4444", "#8b5cf6"];

const CountryClusterScatter: React.FC = () => {
  const [points, setPoints] = useState<ClusterPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [activeCluster, setActiveCluster] = useState<ActiveCluster>("all");
  const [selectedCountry, setSelectedCountry] = useState<ClusterPoint | null>(
    null
  );

  // Carga datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/data/country_clusters.json");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as ClusterPoint[];
        setPoints(json);

        const years = Array.from(new Set(json.map((d) => d.year))).sort();
        setAvailableYears(years);
        setSelectedYear(years[0] ?? null);
      } catch (e) {
        console.error(e);
        setError("Error loading ML cluster data");
      }
    };
    fetchData();
  }, []);

  // Filtramos por año
  const yearPoints = useMemo(() => {
    if (selectedYear == null) return [];
    return points.filter((p) => p.year === selectedYear);
  }, [points, selectedYear]);

  // Metadatos de clusters (para el año seleccionado)
  const clustersMeta = useMemo(() => {
    const byCluster: Record<
      number,
      {
        label: string;
        color: string;
        count: number;
        meanDeaths: number;
        meanVacc: number;
      }
    > = {};

    for (const p of yearPoints) {
      if (!byCluster[p.cluster]) {
        const color = palette[p.cluster % palette.length];
        byCluster[p.cluster] = {
          label: p.cluster_label,
          color,
          count: 0,
          meanDeaths: 0,
          meanVacc: 0,
        };
      }
      const c = byCluster[p.cluster];
      c.count += 1;
      c.meanDeaths += p.deaths_per_100k;
      c.meanVacc += p.vacc_coverage;
    }

    return Object.entries(byCluster)
      .map(([clusterStr, meta]) => {
        const cluster = Number(clusterStr);
        return {
          cluster,
          label: meta.label,
          color: meta.color,
          count: meta.count,
          meanDeaths: meta.count ? meta.meanDeaths / meta.count : 0,
          meanVacc: meta.count ? meta.meanVacc / meta.count : 0,
        };
      })
      .sort((a, b) => a.cluster - b.cluster);
  }, [yearPoints]);

  const filteredPoints: ClusterPoint[] = useMemo(() => {
    if (activeCluster === "all") return yearPoints;
    return yearPoints.filter((p) => p.cluster === activeCluster);
  }, [yearPoints, activeCluster]);

  const activeMeta = useMemo(() => {
    if (activeCluster === "all") return null;
    return clustersMeta.find((c) => c.cluster === activeCluster) || null;
  }, [clustersMeta, activeCluster]);

  const maxDeaths = useMemo(() => {
    if (!filteredPoints.length) return 100;
    const m = Math.max(...filteredPoints.map((p) => p.deaths_per_100k));
    return Math.min(m, 800); // recorte para outliers
  }, [filteredPoints]);

  // Reset cluster / país al cambiar de año
  useEffect(() => {
    setActiveCluster("all");
    setSelectedCountry(null);
  }, [selectedYear]);

  return (
    <div style={{ width: "100%", height: "100%", minHeight: 360 }}>
      {/* Cabecera descriptiva con selector de año */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 20,
          alignItems: "flex-start",
          marginBottom: 10,
          flexWrap: "wrap",
        }}
      >
        <div style={{ maxWidth: 420 }}>
          <h3
            style={{
              margin: 0,
              fontSize: "1rem",
              fontWeight: 600,
            }}
          >
            ML clustering of country profiles
          </h3>
          <p
            style={{
              margin: "4px 0 0 0",
              fontSize: "0.85rem",
              color: "#4b5563",
            }}
          >
            K-means on four yearly indicators: cases / 100k, deaths / 100k,
            full vaccination (%) at year end and case fatality rate. Each colour
            corresponds to a different pandemic profile <strong>for the
            selected year</strong>.
          </p>
          <p
            style={{
              margin: "6px 0 0 0",
              fontSize: "0.8rem",
              color: "#6b7280",
            }}
          >
            Horizontal axis: full vaccination coverage. Vertical axis: deaths
            per 100k in that year. Hover a point to inspect the metrics, or
            click to pin a country on the right.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            alignItems: "flex-end",
          }}
        >
          {/* Selector de año */}
          <div
            style={{
              fontSize: "0.8rem",
              color: "#4b5563",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>Year</span>
            <select
              value={selectedYear ?? ""}
              onChange={(e) =>
                setSelectedYear(e.target.value ? Number(e.target.value) : null)
              }
              style={{
                fontSize: "0.8rem",
                padding: "4px 8px",
                borderRadius: 999,
                border: "1px solid #e5e7eb",
                background: "#ffffff",
                cursor: "pointer",
              }}
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Panel resumen cluster activo */}
          <div
            style={{
              minWidth: 220,
              fontSize: "0.8rem",
              color: "#4b5563",
              background: "#fff",
              borderRadius: 12,
              padding: "8px 12px",
              border: "1px solid #e5e7eb",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              {activeCluster === "all"
                ? `All clusters · ${selectedYear ?? ""}`
                : activeMeta?.label ?? "Cluster"}
            </div>
            {activeCluster === "all" ? (
              <div>
                <div>
                  <strong>{yearPoints.length}</strong> countries with data in{" "}
                  {selectedYear}.
                </div>
                <div style={{ marginTop: 4 }}>
                  Use the pills below to focus on one pandemic profile at a
                  time.
                </div>
              </div>
            ) : activeMeta ? (
              <div>
                <div>
                  <strong>{activeMeta.count}</strong> countries in this cluster.
                </div>
                <div style={{ marginTop: 4 }}>
                  Avg deaths / 100k:{" "}
                  <strong>{activeMeta.meanDeaths.toFixed(1)}</strong>
                </div>
                <div>
                  Avg full vaccination:{" "}
                  <strong>{activeMeta.meanVacc.toFixed(1)}%</strong>
                </div>
              </div>
            ) : (
              <div>No cluster data.</div>
            )}
          </div>
        </div>
      </div>

      {/* Selector de cluster tipo pills */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 8,
        }}
      >
        <button
          onClick={() => setActiveCluster("all")}
          style={{
            borderRadius: 999,
            border: "1px solid #e5e7eb",
            padding: "4px 12px",
            fontSize: "0.78rem",
            cursor: "pointer",
            background:
              activeCluster === "all" ? "#111827" : "rgba(255,255,255,0.9)",
            color: activeCluster === "all" ? "#f9fafb" : "#374151",
          }}
        >
          All clusters
        </button>
        {clustersMeta.map((c) => (
          <button
            key={c.cluster}
            onClick={() => setActiveCluster(c.cluster)}
            style={{
              borderRadius: 999,
              border: "1px solid #e5e7eb",
              padding: "4px 12px",
              fontSize: "0.78rem",
              cursor: "pointer",
              background:
                activeCluster === c.cluster
                  ? c.color
                  : "rgba(255,255,255,0.95)",
              color: activeCluster === c.cluster ? "#f9fafb" : "#111827",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: activeCluster === c.cluster ? "#f9fafb" : c.color,
              }}
            />
            <span>{c.label}</span>
            <span style={{ opacity: 0.7 }}>· {c.count}</span>
          </button>
        ))}
      </div>

      {error && (
        <div style={{ color: "#b91c1c", fontSize: "0.85rem" }}>{error}</div>
      )}

      {/* Gráfico + panel país seleccionado */}
      {!error && filteredPoints.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 3fr) minmax(220px, 1fr)",
            gap: 16,
            alignItems: "stretch",
          }}
        >
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 24, left: 0 }}>
                <CartesianGrid stroke="#e5e7eb" />
                <XAxis
                  type="number"
                  dataKey="vacc_coverage"
                  name="Full vaccination (%)"
                  tick={{ fontSize: 11 }}
                  domain={[0, 100]}
                  label={{
                    value: "Full vaccination (%) at year end",
                    position: "bottom",
                    offset: 0,
                    style: { fontSize: 11 },
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="deaths_per_100k"
                  name="Deaths per 100k"
                  tick={{ fontSize: 11 }}
                  domain={[0, maxDeaths]}
                  label={{
                    value: "Deaths per 100k in the year",
                    angle: -90,
                    position: "insideLeft",
                    style: { fontSize: 11 },
                  }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  contentStyle={{
                    fontSize: "0.75rem",
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                  }}
                  formatter={(value: any, name: any) => {
                    if (name === "vacc_coverage")
                      return [`${(value as number).toFixed(1)}%`, "Full vaccinated"];
                    if (name === "deaths_per_100k")
                      return [
                        (value as number).toFixed(1),
                        "Deaths per 100k (year)",
                      ];
                    if (name === "cases_per_100k")
                      return [(value as number).toFixed(0), "Cases per 100k (year)"];
                    if (name === "cfr")
                      return [
                        `${((value as number) * 100).toFixed(2)}%`,
                        "Case fatality rate (year)",
                      ];
                    return [value, name];
                  }}
                  labelFormatter={(payload) =>
                    payload && payload[0]
                      ? (payload[0].payload as ClusterPoint).country_name
                      : ""
                  }
                />
                <Legend
                  wrapperStyle={{
                    fontSize: "0.75rem",
                  }}
                />
                {clustersMeta
                  .filter((c) =>
                    activeCluster === "all"
                      ? true
                      : c.cluster === activeCluster
                  )
                  .map((c) => (
                    <Scatter
                      key={c.cluster}
                      name={c.label}
                      data={filteredPoints.filter(
                        (p) => p.cluster === c.cluster
                      )}
                      fill={c.color}
                      shape="circle"
                      onClick={(data: any) =>
                        setSelectedCountry(data.payload as ClusterPoint)
                      }
                    />
                  ))}
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Panel país seleccionado */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              padding: "10px 12px",
              fontSize: "0.8rem",
              color: "#4b5563",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              {selectedCountry
                ? `${selectedCountry.country_name} · ${selectedYear}`
                : "Click a point"}
            </div>
            {selectedCountry ? (
              <>
                <div>
                  Cluster:{" "}
                  <strong>{selectedCountry.cluster_label}</strong>
                </div>
                <div style={{ marginTop: 4 }}>
                  Cases / 100k (year):{" "}
                  <strong>
                    {selectedCountry.cases_per_100k.toFixed(0)}
                  </strong>
                </div>
                <div>
                  Deaths / 100k (year):{" "}
                  <strong>
                    {selectedCountry.deaths_per_100k.toFixed(1)}
                  </strong>
                </div>
                <div>
                  Full vaccination at year end:{" "}
                  <strong>{selectedCountry.vacc_coverage.toFixed(1)}%</strong>
                </div>
                <div>
                  Case fatality rate (year):{" "}
                  <strong>
                    {(selectedCountry.cfr * 100).toFixed(2)}%
                  </strong>
                </div>
              </>
            ) : (
              <div style={{ color: "#9ca3af" }}>
                Hover to inspect the tooltip, or click on any point to see a
                country summary here.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CountryClusterScatter;
