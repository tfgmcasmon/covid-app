from utils.errors import APIError

def require_param(value, name):
    if value is None or value == "":
        raise APIError(f"Falta el parámetro obligatorio: {name}")
