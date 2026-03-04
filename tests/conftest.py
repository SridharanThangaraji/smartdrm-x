"""Pytest fixtures for SmartDRM-X: run from project root with PYTHONPATH=backend."""
import sys
from pathlib import Path

backend = Path(__file__).resolve().parent.parent / "backend"
if str(backend) not in sys.path:
    sys.path.insert(0, str(backend))
