from flask import Flask
from flask_cors import CORS
from api.covid_routes import covid_bp


def create_app():
    app = Flask(__name__)
    # Permitir llamadas desde el frontend React en desarrollo
    CORS(app)

    # Registrar blueprint de la API
    app.register_blueprint(covid_bp, url_prefix="/api")

    return app


app = create_app()

if __name__ == "__main__":
    # Para desarrollo local
    app.run(host="0.0.0.0", port=5000, debug=True)
