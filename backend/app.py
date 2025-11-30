from flask import Flask
from flask_cors import CORS

from api.covid_routes import covid_bp  # único blueprint


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app)

    # Todas las rutas viven en covid_bp
    app.register_blueprint(covid_bp, url_prefix="/api")
    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
