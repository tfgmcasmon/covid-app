from flask import Blueprint, jsonify, request
from services.data_service import (
    get_available_countries,
    get_epi_timeseries,
    get_mobility_timeseries,
    get_epi_summary,
)
from services.forecast_service import generate_forecast

covid_bp = Blueprint("covid", __name__)


@covid_bp.get("/countries")
def countries():
    data = get_available_countries()
    return jsonify(data)


@covid_bp.get("/epi-timeseries")
def epi_timeseries():
    country_code = request.args.get("country_code")
    metric = request.args.get("metric", "new_confirmed")

    if not country_code:
        return jsonify({"error": "Falta parámetro country_code"}), 400

    try:
        data = get_epi_timeseries(country_code=country_code, metric=metric)
        return jsonify(data)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@covid_bp.get("/mobility-timeseries")
def mobility_timeseries():
    country_code = request.args.get("country_code")
    metric = request.args.get("metric")

    if not country_code:
        return jsonify({"error": "Falta parámetro country_code"}), 400
    if not metric:
        return jsonify({"error": "Falta parámetro metric"}), 400

    try:
        data = get_mobility_timeseries(country_code=country_code, metric=metric)
        return jsonify(data)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@covid_bp.get("/epi-summary")
def epi_summary():
    country_code = request.args.get("country_code")
    metric = request.args.get("metric", "new_confirmed")

    if not country_code:
        return jsonify({"error": "Falta parámetro country_code"}), 400

    try:
        summary = get_epi_summary(country_code=country_code, metric=metric)
        return jsonify(summary)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@covid_bp.get("/forecast")
def forecast():
    """
    Forecast simple:
    GET /api/forecast?country_code=ES&metric=new_confirmed&horizon=60
    """
    country_code = request.args.get("country_code")
    metric = request.args.get("metric")
    horizon = int(request.args.get("horizon", 30))

    if not country_code or not metric:
        return jsonify({"error": "country_code y metric son obligatorios"}), 400

    try:
        result = generate_forecast(country_code, metric, horizon)
        return jsonify(result)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500
