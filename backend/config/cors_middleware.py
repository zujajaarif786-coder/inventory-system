class StockMasterCORSMiddleware:
    """
    Development CORS middleware for the separate
    StockMaster frontend.

    Frontend:
        http://127.0.0.1:5500
        http://localhost:5500
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):

        allowed_origins = {
            "http://127.0.0.1:5500",
            "http://localhost:5500",
        }

        origin = request.headers.get("Origin")

        # Handle browser CORS preflight requests.
        if request.method == "OPTIONS":

            from django.http import HttpResponse

            response = HttpResponse(status=204)

        else:
            response = self.get_response(request)

        if origin in allowed_origins:

            response["Access-Control-Allow-Origin"] = origin

            response["Access-Control-Allow-Credentials"] = "true"

            response["Access-Control-Allow-Headers"] = (
                "Content-Type, X-CSRFToken"
            )

            response["Access-Control-Allow-Methods"] = (
                "GET, POST, PUT, PATCH, DELETE, OPTIONS"
            )

            response["Vary"] = "Origin"

        return response