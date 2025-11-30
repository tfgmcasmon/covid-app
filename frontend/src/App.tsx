import React from "react";
import Dashboard from "./pages/Dashboard";

const App: React.FC = () => {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f9fafb", // fondo muy claro
        color: "#111827",
      }}
    >
      {/* Cabecera */}
      <header
        style={{
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <div
          style={{
            maxWidth: "1400px", // más ancho, se aprovecha mejor la pantalla
            margin: "0 auto",
            padding: "1rem clamp(1.25rem, 4vw, 2rem)",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "1.75rem",
              fontWeight: 600,
            }}
          >
            COVID-19 Data Visualizer
          </h1>
          <p
            style={{
              margin: "0.2rem 0 0",
              fontSize: "0.95rem",
              color: "#6b7280",
            }}
          >
            Interactive dashboard for exploring epidemiological, government
            response and vaccination data over time.
          </p>
        </div>
      </header>

      {/* Contenido principal */}
      <main>
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "1.25rem clamp(1.25rem, 4vw, 2rem) 2rem",
          }}
        >
          <Dashboard />
        </div>
      </main>
    </div>
  );
};

export default App;
