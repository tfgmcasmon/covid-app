from flask import Blueprint, jsonify
from services.data_loader import DataLoader

countries_bp = Blueprint("countries", __name__)

@countries_bp.route("/countries")
def list_countries():
    df = DataLoader.load_countries()
    return jsonify(df[["country_code", "country_name"]].to_dict(orient="records"))
