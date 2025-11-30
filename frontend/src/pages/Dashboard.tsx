import React, { useEffect, useState } from "react";
import MapCasesPerCapita from "../components/charts/MapCasesPerCapita";
import CountryTimeSeries from "../components/charts/CountryTimeSeries";
import VaccinationImpactScatter from "../components/charts/VaccinationImpactScatter";
import CountryProfileRadar from "../components/charts/CountryProfileRadar";
import CountryClusterScatter from "../components/charts/CountryClusterScatter";
import "../styles/landing.css";

type TabId = "map" | "country" | "ml" | "profile" | "ml_clusters";

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>("map");
  const [showSplash, setShowSplash] = useState(true);

  // Splash animation
  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 1100);
    return () => clearTimeout(t);
  }, []);

  const scrollToCarousel = () => {
    const el = document.getElementById("explore-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const tabLabel = {
    map: "Global map",
    country: "Country insights",
    ml: "Time series ML forecast",
    profile: "Country profile radar",
    ml_clusters: "ML clusters of countries",
  }[activeTab];

  const tabSubtitle =
    activeTab === "map"
      ? "Animate the spread of COVID-19 worldwide using cases per 100k and a time slider."
      : activeTab === "country"
      ? "Explore time series data for any country: waves, trends and patterns."
      : activeTab === "ml"
      ? "Short-term ML-based forecast of new cases for selected countries."
      : activeTab === "profile"
      ? "Compare incidence, mortality, vaccination and fatality in a single country profile over time."
      : "K-means clustering of all countries based on incidence, mortality, vaccination and fatality.";

  return (
    <div className="site-root">
      {/* ------------ SPLASH SCREEN ------------ */}
      {showSplash && (
        <div className="splash">
          <div className="splash-logo">COVID • REWIND</div>
        </div>
      )}

      {/* ------------ NAVBAR ------------ */}
      <nav className="site-nav">
        <div className="site-nav-inner">
          <div className="brand-mark">
            <span className="brand-mark-pill" />
            COVID · REWIND
          </div>

          <div className="nav-links">
            <span className="nav-link" onClick={scrollToCarousel}>
              Explore
            </span>
            <span className="nav-link" onClick={scrollToCarousel}>
              Visualisations
            </span>
            <span className="nav-link nav-cta" onClick={scrollToCarousel}>
              Start the tour
            </span>
          </div>
        </div>
      </nav>

      {/* ------------ HERO SECTION ------------ */}
      <section className="hero">
        <div className="hero-copy">
          <div className="hero-eyebrow">
            Interactive pandemic storytelling
          </div>

          <h1 className="hero-title">
            Understand how <span>COVID-19</span> unfolded globally.
          </h1>

          <p className="hero-subtitle">
            A clean, interactive and carefully designed visual narrative.
            Explore incidence, vaccination and machine learning insights across
            countries and time.
          </p>

          <div className="hero-actions">
            <button className="hero-btn-primary" onClick={scrollToCarousel}>
              Explore visualisations
            </button>
            <button
              className="hero-btn-ghost"
              onClick={() => {
                setActiveTab("map");
                scrollToCarousel();
              }}
            >
              Start with the global map
            </button>
          </div>
        </div>

        <div className="hero-visual">
          <div>
            <div className="hero-preview-label">Current view</div>
            <div className="hero-preview-title">{tabLabel}</div>
            <div className="hero-preview-strip" />
          </div>
          <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: 8 }}>
            React · Recharts · Python · Pandas · K-means clustering
          </div>
        </div>
      </section>

      {/* ------------ CAROUSEL SECTION ------------ */}
      <section id="explore-section" className="carousel-section">
        <div className="carousel-header">
          <div className="carousel-tabs">
            <button
              className={`carousel-tab ${
                activeTab === "map" ? "active" : ""
              }`}
              onClick={() => setActiveTab("map")}
            >
              Global map
            </button>

            <button
              className={`carousel-tab ${
                activeTab === "country" ? "active" : ""
              }`}
              onClick={() => setActiveTab("country")}
            >
              Country insights
            </button>

            <button
              className={`carousel-tab ${
                activeTab === "ml" ? "active" : ""
              }`}
              onClick={() => setActiveTab("ml")}
            >
              ML forecast
            </button>

            <button
              className={`carousel-tab ${
                activeTab === "profile" ? "active" : ""
              }`}
              onClick={() => setActiveTab("profile")}
            >
              Country profile
            </button>

            <button
              className={`carousel-tab ${
                activeTab === "ml_clusters" ? "active" : ""
              }`}
              onClick={() => setActiveTab("ml_clusters")}
            >
              ML clusters
            </button>
          </div>

          <div className="carousel-subtitle">{tabSubtitle}</div>
        </div>

        <div className="chart-card">
          <div className="chart-wrapper" key={activeTab}>
            {activeTab === "map" && <MapCasesPerCapita />}
            {activeTab === "country" && <CountryTimeSeries />}
            {activeTab === "ml" && <VaccinationImpactScatter />}
            {activeTab === "profile" && <CountryProfileRadar />}
            {activeTab === "ml_clusters" && <CountryClusterScatter />}
          </div>
        </div>
      </section>

      {/* ------------ FOOTER ------------ */}
      <footer className="site-footer">
        COVID-19 Data Visualiser · Academic project in data visualization ·
        Epidemiological, demographic, vaccination and ML-based analyses.
      </footer>
    </div>
  );
};

export default Dashboard;
