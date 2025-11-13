from flask import Blueprint, jsonify, request
from services.data_service import (
    get_available_countries,
    get_epi_timeseries,
    get_mobility_timeseries,
    EPI_METRICS,
    MOBILITY_METRICS,
)

covid_bp = Blueprint("covid", __name__)


@covid_bp.get("/countries")
def countries():
    data = get_available_countries()
    return jsonify(data)


@covid_bp.get("/epi-timeseries")
def epi_timeseries():
    country_code = request.args.get("country_code")
    metric = request.args.get("metric", "new_confirmed")
    start = request.args.get("start")
    end = request.args.get("end")

    if not country_code:
        return jsonify({"error": "Falta parámetro country_code"}), 400

    if metric not in EPI_METRICS:
        return jsonify(
            {"error": f"Métrica no soportada: {metric}", "valid_metrics": EPI_METRICS}
        ), 400

    try:
        data = get_epi_timeseries(
            country_code=country_code, metric=metric, start=start, end=end
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify(data)


@covid_bp.get("/mobility-timeseries")
def mobility_timeseries():
    """
    GET /api/mobility-timeseries?country_code=ES&metric=<nombre_columna>
    Si la métrica no es válida, se usa la primera disponible en MOBILITY_METRICS.
    """
    country_code = request.args.get("country_code")
    metric = request.args.get("metric")
    start = request.args.get("start")
    end = request.args.get("end")

    if not country_code:
        return jsonify({"error": "Falta parámetro country_code"}), 400

    # Si no pasan métrica o es inválida → cogemos la primera
    if not metric or metric not in MOBILITY_METRICS:
        original_metric = metric
        metric = MOBILITY_METRICS[0]
        # opcional: informar en la respuesta
        info = {
            "warning": "Métrica de movilidad no válida o no especificada, usando métrica por defecto.",
            "requested_metric": original_metric,
            "used_metric": metric,
        }
    else:
        info = {}

    try:
        data = get_mobility_timeseries(
            country_code=country_code, metric=metric, start=start, end=end
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    # si añadimos info, la devolvemos envuelta
    if info:
        return jsonify({"meta": info, "data": data})

    return jsonify(data)
