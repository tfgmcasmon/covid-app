import { useEffect, useState } from "react";
import "./App.css";
import EpiChart from "./components/EpiChart";
import MobilityChart from "./components/MobilityChart";

interface Country {
  country_code: string | null;
  country_name: string | null;
}

function App() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("");

  // Epidemiología
  const [selectedEpiMetric, setSelectedEpiMetric] = useState("new_confirmed");
  const epiMetrics = [
    { value: "new_confirmed", label: "Nuevos casos" },
    { value: "new_deceased", label: "Nuevos fallecidos" },
    { value: "cumulative_confirmed", label: "Casos acumulados" },
    { value: "cumulative_deceased", label: "Fallecidos acumulados" },
    { value: "new_tested", label: "Nuevos tests" },
    { value: "cumulative_tested", label: "Tests acumulados" },
  ];

  // Movilidad
  const [selectedMobilityMetric, setSelectedMobilityMetric] = useState(
    "retail_and_recreation"
  );
  const mobilityMetrics = [
    { value: "retail_and_recreation", label: "Ocio y restauración" },
    { value: "grocery_and_pharmacy", label: "Supermercados y farmacias" },
    { value: "residential", label: "Residencial" },
    { value: "workplace", label: "Trabajo" },
    { value: "transit_stations", label: "Transporte" },
    { value: "parks", label: "Parques" },
  ];

  // Cargar lista de países al inicio
  useEffect(() => {
    async function fetchCountries() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/countries`);
        const json = await res.json();
        setCountries(json);
      } catch (err) {
        console.error("Error cargando países:", err);
      }
    }
    fetchCountries();
  }, []);

  return (
    <div className="app">
      {/* HERO */}
      <header className="hero">
        <div className="hero-inner">
          <h1 className="hero-title">COVID Rewind</h1>
          <p className="hero-subtitle">
            Explorador interactivo de la pandemia de COVID-19 construido con{" "}
            <span>Flask</span> y <span>React</span>. Analiza la evolución de
            los casos, la movilidad y las decisiones de los países a lo largo
            del tiempo.
          </p>
        </div>
      </header>

      <main className="layout">
        {/* PANEL DE CONTROLES */}
        <section className="panel panel-filters">
          <h2 className="panel-title">Panel de exploración</h2>
          <p className="panel-description">
            Selecciona un país y las métricas que quieras comparar. Los gráficos
            se actualizan automáticamente.
          </p>

          <div className="filters-grid">
            <div className="field">
              <label className="field-label">País</label>
              <select
                className="field-select"
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
              >
                <option value="">Selecciona un país…</option>
                {countries.map((c) => (
                  <option key={c.country_code!} value={c.country_code!}>
                    {c.country_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="field-label">Métrica epidemiológica</label>
              <select
                className="field-select"
                value={selectedEpiMetric}
                onChange={(e) => setSelectedEpiMetric(e.target.value)}
              >
                {epiMetrics.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="field-label">Métrica de movilidad</label>
              <select
                className="field-select"
                value={selectedMobilityMetric}
                onChange={(e) => setSelectedMobilityMetric(e.target.value)}
              >
                {mobilityMetrics.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* GRID DE GRÁFICOS */}
        <section className="charts-grid">
          <article className="panel panel-chart">
            <div className="panel-header">
              <h2 className="panel-title">Epidemiología</h2>
              <p className="panel-caption">
                Evolución temporal de la métrica seleccionada para el país
                escogido.
              </p>
            </div>
            <div className="panel-body">
              <EpiChart
                selectedCountry={selectedCountry}
                selectedMetric={selectedEpiMetric}
              />
            </div>
          </article>

          <article className="panel panel-chart">
            <div className="panel-header">
              <h2 className="panel-title">Movilidad</h2>
              <p className="panel-caption">
                Cambios en los patrones de movilidad durante la pandemia.
              </p>
            </div>
            <div className="panel-body">
              <MobilityChart
                selectedCountry={selectedCountry}
                selectedMetric={selectedMobilityMetric}
              />
            </div>
          </article>
        </section>
      </main>

      <footer className="app-footer">
        <p>
          Proyecto académico — Desarrollo de Aplicaciones para Visualización de
          Datos. Datos agregados por país a partir de fuentes globales de
          COVID-19.
        </p>
      </footer>
    </div>
  );
}

export default App;
