# backend/api/routes_epi.py
from flask import Blueprint, request, jsonify
from services.data_service import get_epi_timeseries  # ya lo tenías antes aquí
from services.epi_insights_service import get_epi_summary  # NUEVO import

epi_bp = Blueprint("epi", __name__)


@epi_bp.route("/epi-timeseries", methods=["GET"])
def epi_timeseries():
    country_code = request.args.get("country_code")
    metric = request.args.get("metric")

    if not country_code or not metric:
        return jsonify({"error": "country_code y metric son obligatorios"}), 400

    try:
        data = get_epi_timeseries(
            country_code=country_code,
            metric=metric,
        )
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@epi_bp.route("/epi-summary", methods=["GET"])
def epi_summary():
    """
    Devuelve KPIs de la serie epidemiológica para un país y métrica.
    """
    country_code = request.args.get("country_code")
    metric = request.args.get("metric")

    if not country_code or not metric:
        return jsonify({"error": "country_code y metric son obligatorios"}), 400

    try:
        summary = get_epi_summary(country_code, metric)
        return jsonify(summary)
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
