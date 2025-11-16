"""Desktopstarter voor Bingo Studio.

Draait een lokale HTTP-server en opent de webapp in de standaardbrowser.
Geschikt om met PyInstaller naar een Windows .exe te bundelen.
"""
from __future__ import annotations

import http.server
import socketserver
import threading
import time
import webbrowser
from pathlib import Path
import sys


def get_asset_root() -> Path:
    """Vind de map waar de statische bestanden staan.

    Bij een PyInstaller-build wijst ``sys._MEIPASS`` naar de tijdelijke
    uitpaklocatie. Lokaal verwijzen we gewoon naar de projectmap.
    """
    base_path = getattr(sys, "_MEIPASS", None)
    if base_path:
        return Path(base_path)
    return Path(__file__).resolve().parent


def make_handler(base_dir: Path) -> type[http.server.SimpleHTTPRequestHandler]:
    """Maak een HTTP-handler die uit ``base_dir`` serveert."""

    class _Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(base_dir), **kwargs)

        def log_message(self, format: str, *args) -> None:  # noqa: A003
            # Houd de console stil tijdens normaal gebruik.
            return

    return _Handler


def run_server() -> None:
    base_dir = get_asset_root()
    handler = make_handler(base_dir)
    socketserver.TCPServer.allow_reuse_address = True

    with socketserver.TCPServer(("127.0.0.1", 0), handler) as httpd:
        port = httpd.server_address[1]
        url = f"http://127.0.0.1:{port}/index.html"
        print(f"Bingo Studio draait op {url}")
        threading.Thread(target=httpd.serve_forever, daemon=True).start()
        webbrowser.open_new(url)

        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\nStoppen...")
        finally:
            httpd.shutdown()
            httpd.server_close()


if __name__ == "__main__":
    run_server()
