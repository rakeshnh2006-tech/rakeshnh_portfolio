import http.server
import socketserver
import os
import sys
import urllib.parse

PORT = 8000
DIRECTORY = os.path.abspath(os.path.dirname(__file__))

class LocalhostHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Enable CORS and disable aggressive caching for local development
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()

    def do_GET(self):
        # Parse path
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        
        # If requesting root, serve index.html
        if path == "/":
            self.path = "/index.html"
            return super().do_GET()

        # Check if requested file exists locally
        local_rel = path.lstrip("/")
        local_path = os.path.join(DIRECTORY, local_rel)

        # Handle URL encoded spaces or special characters
        decoded_rel = urllib.parse.unquote(local_rel)
        decoded_path = os.path.join(DIRECTORY, decoded_rel)

        if not os.path.exists(local_path) and os.path.exists(decoded_path):
            self.path = "/" + decoded_rel
            return super().do_GET()

        # If subpage not found (e.g., /residency), fallback gracefully to index.html
        if not os.path.exists(local_path) and not os.path.exists(decoded_path):
            if not any(path.endswith(ext) for ext in [".css", ".js", ".png", ".jpg", ".jpeg", ".svg", ".webp", ".woff", ".woff2", ".ttf", ".ico", ".json", ".xml", ".mp4"]):
                self.path = "/index.html"
                return super().do_GET()

        return super().do_GET()

    def log_message(self, format, *args):
        # Clean logging
        sys.stderr.write(f"[{self.log_date_time_string()}] {args[0]} {args[1]} -> {args[2]}\n")

class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else PORT
    with ReusableTCPServer(("", port), LocalhostHandler) as httpd:
        print(f"\n=======================================================")
        print(f" ChainGPT Labs local server is running!")
        print(f" URL: http://localhost:{port}")
        print(f" Serving directory: {DIRECTORY}")
        print(f" Press Ctrl+C to stop the server.")
        print(f"=======================================================\n")
        sys.stdout.flush()
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server...")
            httpd.server_close()
