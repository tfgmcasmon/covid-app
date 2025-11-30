from flask import Blueprint, request, jsonify
from services.forecast_service import generate_forecast

forecast_bp = Blueprint("forecast", __name__)

@forecast_bp.route("/forecast", methods=["GET"])
def forecast():
    country_code = request.args.get("country_code")
    metric = request.args.get("metric")
    horizon = int(request.args.get("horizon", 30))

    if not country_code or not metric:
        return jsonify({"error": "Missing parameters"}), 400

    result = generate_forecast(country_code, metric, horizon)
    return jsonify(result)
