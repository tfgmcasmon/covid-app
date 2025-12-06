import React, { useEffect, useMemo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
} from "react-simple-maps";
import { scaleSequential } from "d3-scale";
import { interpolateYlOrRd } from "d3-scale-chromatic";
import { MapDataPoint } from "../types/covid";

const geoUrl =
  "/data/world-110m.json"; // TopoJSON del mundo

// ⬇️ IMPORTANTE: sin height fija aquí
const containerStyle: React.CSSProperties = {
  borderRadius: "0.9rem",
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  boxShadow: "0 8px 20px rgba(15, 23, 42, 0.06)",
  padding: "0.9rem 1.25rem 1rem",
  display: "flex",
  flexDirection: "column",
  gap: "0.75rem",
};

const MapCasesPerCapita: React.FC = () => {
  const [data, setData] = useState<MapDataPoint[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(500); // ms por frame

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/data/map_data.json");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json: MapDataPoint[] = await res.json();

        const cleaned = json
          .filter(
            (d) =>
              d.country_code !== null &&
              d.country_code !== undefined &&
              d.country_code !== ""
          )
          .map((d) => ({
            ...d,
            date: (d.date ?? "").slice(0, 10),
            country_code: (d.country_code ?? "").toUpperCase(),
            country_name: (d.country_name ?? "").trim(),
          }))
          .sort((a, b) => a.date.localeCompare(b.date));

        const uniqueDates = Array.from(new Set(cleaned.map((d) => d.date)));

        setData(cleaned);
        setDates(uniqueDates);
        setCurrentIndex(uniqueDates.length - 1);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Error loading map data");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const currentDate = dates[currentIndex] || dates[0];

  const dataForDate = useMemo(
    () => data.filter((d) => d.date === currentDate),
    [data, currentDate]
  );

  const valueByKey = useMemo(() => {
    const m = new Map<string, number>();
    dataForDate.forEach((d) => {
      const v = d.new_confirmed_per_100k_ma7 ?? 0;
      m.set(d.country_code.toUpperCase(), v);
      m.set(d.country_name.toLowerCase(), v);
    });
    return m;
  }, [dataForDate]);

  const maxValue = useMemo(() => {
    if (dataForDate.length === 0) return 1;
    return Math.max(
      ...dataForDate.map((d) => d.new_confirmed_per_100k_ma7 || 0)
    );
  }, [dataForDate]);

  const colorScale = useMemo(
    () => scaleSequential(interpolateYlOrRd).domain([0, maxValue || 1]),
    [maxValue]
  );

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentIndex(Number(event.target.value));
    setIsPlaying(false);
  };

  useEffect(() => {
    if (!isPlaying || dates.length === 0) return;

    const id = window.setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        return next >= dates.length ? 0 : next;
      });
    }, speed);

    return () => window.clearInterval(id);
  }, [isPlaying, dates.length, speed]);

  if (loading)
    return (
      <div style={containerStyle}>
        <span style={{ opacity: 0.7, fontSize: "0.9rem" }}>
          Loading map data...
        </span>
      </div>
    );

  if (error)
    return (
      <div style={containerStyle}>
        <span style={{ color: "#b91c1c", fontSize: "0.9rem" }}>{error}</span>
      </div>
    );

  return (
    <div style={containerStyle}>
      {/* Header: fecha + controles */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.9rem",
        }}
      >
        <div>
          <span style={{ color: "#4b5563" }}>
            New confirmed cases per 100k (7-day moving average)
          </span>
          <div
            style={{
              fontWeight: 600,
              marginTop: "0.1rem",
              fontSize: "0.95rem",
            }}
          >
            {currentDate}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "0.75rem",
            minWidth: "340px",
          }}
        >
          <button
            onClick={() => setIsPlaying((p) => !p)}
            style={{
              padding: "0.25rem 0.75rem",
              borderRadius: "999px",
              border: "1px solid #3b82f6",
              backgroundColor: isPlaying ? "#ffffff" : "#3b82f6",
              color: isPlaying ? "#1f2937" : "#ffffff",
              fontSize: "0.8rem",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {isPlaying ? "Pause" : "Play"}
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
            }}
          >
            <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>Speed</span>
            <select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #d1d5db",
                color: "#111827",
                borderRadius: "8px",
                padding: "0.2rem 0.4rem",
                cursor: "pointer",
                fontSize: "0.75rem",
              }}
            >
              <option value={1200}>0.2x</option>
              <option value={600}>0.5x</option>
              <option value={500}>1x</option>
              <option value={250}>2x</option>
              <option value={100}>5x</option>
            </select>
          </div>

          <div style={{ flex: 1 }}>
            <input
              type="range"
              min={0}
              max={Math.max(dates.length - 1, 0)}
              value={currentIndex}
              onChange={handleSliderChange}
              style={{ width: "100%" }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.75rem",
                color: "#9ca3af",
              }}
            >
              <span>{dates[0]}</span>
              <span>{dates[dates.length - 1]}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mapa */}
      <div
        style={{
          marginTop: "0.5rem",
          // ⬇️ altura fija del mapa, sin flex:1
          height: "380px",
        }}
      >
        <ComposableMap
          projectionConfig={{ scale: 145 }}
          width={800}
          height={380}
          style={{ width: "100%", height: "100%" }}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const props: any = geo.properties;

                const iso2 = (
                  props.ISO_A2 ||
                  props.iso_a2 ||
                  props.ISO2 ||
                  ""
                ).toUpperCase();

                const name = (
                  props.name ||
                  props.NAME ||
                  props.ADMIN ||
                  ""
                ).toLowerCase();

                const rawVal =
                  (iso2 && valueByKey.get(iso2)) ||
                  (name && valueByKey.get(name));

                const hasData = rawVal !== undefined && rawVal > 0;

                const fill = hasData
                  ? colorScale(rawVal as number)
                  : "#e5e7eb";

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    style={{
                      default: {
                        fill,
                        stroke: "#9ca3af",
                        strokeWidth: 0.4,
                        outline: "none",
                      },
                      hover: {
                        fill: hasData ? "#facc15" : "#d1d5db",
                        stroke: "#374151",
                        strokeWidth: 0.7,
                        outline: "none",
                      },
                      pressed: {
                        fill,
                        stroke: "#111827",
                        strokeWidth: 0.7,
                        outline: "none",
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>
      </div>

      {/* Leyenda */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.25rem",
          marginTop: "0.5rem",
        }}
      >
        <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
          Cases per 100k (7-day moving average)
        </span>

        <div
          style={{
            height: "10px",
            width: "100%",
            background: `linear-gradient(to right, 
              ${interpolateYlOrRd(0)},
              ${interpolateYlOrRd(0.25)},
              ${interpolateYlOrRd(0.5)},
              ${interpolateYlOrRd(0.75)},
              ${interpolateYlOrRd(1)}
            )`,
            borderRadius: "4px",
          }}
        ></div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.75rem",
            color: "#9ca3af",
          }}
        >
          <span>0</span>
          <span>{maxValue.toFixed(0)}</span>
        </div>
      </div>
    </div>
  );
};

export default MapCasesPerCapita;
