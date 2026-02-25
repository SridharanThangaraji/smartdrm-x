#!/usr/bin/env python3
"""
Single entry point to run SmartDRM-X: starts both backend (FastAPI) and frontend (static server).
Usage: python run.py [--backend-only | --frontend-only]
"""
import argparse
import signal
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BACKEND_DIR = ROOT / "backend"
FRONTEND_DIR = ROOT / "frontend"
BACKEND_PORT = 8000
FRONTEND_PORT = 5173

VENV_PYTHON = ROOT / ".venv" / "bin" / "python"
PYTHON = str(VENV_PYTHON) if VENV_PYTHON.exists() else sys.executable

processes = []


def kill_children(*_):
    for p in processes:
        if p.poll() is None:
            p.terminate()
    sys.exit(0)


def main():
    global processes
    parser = argparse.ArgumentParser(description="Run SmartDRM-X backend and/or frontend")
    parser.add_argument("--backend-only", action="store_true", help="Start only the FastAPI backend")
    parser.add_argument("--frontend-only", action="store_true", help="Start only the frontend static server")
    args = parser.parse_args()
    run_backend = not args.frontend_only
    run_frontend = not args.backend_only

    if not run_backend and not run_frontend:
        parser.error("At least one of backend or frontend must be run")
        return

    signal.signal(signal.SIGINT, kill_children)
    signal.signal(signal.SIGTERM, kill_children)

    if run_backend:
        if not (BACKEND_DIR / "app" / "main.py").exists():
            print("Error: Backend not found. Ensure backend/app/main.py exists.", file=sys.stderr)
            sys.exit(1)
        cmd = [PYTHON, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", str(BACKEND_PORT)]
        p = subprocess.Popen(cmd, cwd=str(BACKEND_DIR), stdout=sys.stdout, stderr=sys.stderr)
        processes.append(p)
        print(f"Backend: http://127.0.0.1:{BACKEND_PORT}")

    if run_frontend:
        if not (FRONTEND_DIR / "index.html").exists():
            print("Error: Frontend not found. Ensure frontend/index.html exists.", file=sys.stderr)
            sys.exit(1)
        cmd = [sys.executable, "-m", "http.server", str(FRONTEND_PORT)]
        p = subprocess.Popen(cmd, cwd=str(FRONTEND_DIR), stdout=sys.stdout, stderr=sys.stderr)
        processes.append(p)
        print(f"Frontend: http://127.0.0.1:{FRONTEND_PORT}")

    print("Press Ctrl+C to stop all.")
    for p in processes:
        p.wait()


if __name__ == "__main__":
    main()
