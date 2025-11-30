from flask import Blueprint, request, jsonify
from services.mobility_service import get_mobility_timeseries
from utils.validators import validate_country_code, validate_mobility_metric

mobility_bp = Blueprint("mobility", __name__)

@mobility_bp.route("/mobility-timeseries", methods=["GET"])
def mobility_timeseries():
    country_code = request.args.get("country_code")
    metric = request.args.get("metric")

    # Validaciones
    if not validate_country_code(country_code):
        return jsonify({"error": "Invalid country_code parameter"}), 400

    if not validate_mobility_metric(metric):
        return jsonify({"error": "Invalid metric parameter"}), 400

    try:
        data = get_mobility_timeseries(country_code, metric)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
