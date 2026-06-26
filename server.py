from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse
from urllib.request import Request, urlopen
import json
import os


API_BASE = "https://v3.football.api-sports.io"


class DashboardHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/fixtures":
            self.proxy_fixtures(parsed.query)
            return
        super().do_GET()

    def proxy_fixtures(self, query):
        params = parse_qs(query)
        league = params.get("league", ["1"])[0]
        season = params.get("season", ["2026"])[0]
        api_key = os.environ.get("API_FOOTBALL_KEY") or self.headers.get("x-api-key")

        if not api_key:
            self.send_json({"error": "Missing API_FOOTBALL_KEY"}, 400)
            return

        url = f"{API_BASE}/fixtures?league={league}&season={season}"
        request = Request(url, headers={"x-apisports-key": api_key})

        try:
            with urlopen(request, timeout=20) as response:
                payload = response.read()
                self.send_response(response.status)
                self.send_header("Content-Type", "application/json")
                self.send_header("Cache-Control", "no-store")
                self.end_headers()
                self.wfile.write(payload)
        except Exception as error:
            self.send_json({"error": str(error)}, 502)

    def send_json(self, payload, status):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "4173"))
    server = ThreadingHTTPServer(("127.0.0.1", port), DashboardHandler)
    print(f"World Cup dashboard running at http://127.0.0.1:{port}")
    server.serve_forever()
