from flask import jsonify

class APIError(Exception):
    status_code = 400

    def __init__(self, message, status=None):
        super().__init__(message)
        if status:
            self.status_code = status

def register_error_handlers(app):
    @app.errorhandler(APIError)
    def handle_api_error(e):
        return jsonify({"error": str(e)}), e.status_code

    @app.errorhandler(404)
    def handle_404(e):
        return jsonify({"error": "Endpoint no encontrado"}), 404

    @app.errorhandler(500)
    def handle_500(e):
        return jsonify({"error": "Error interno en el servidor"}), 500
