"""
local_mock_server.py

WHAT THIS IS FOR:
A stand-in for backend's real server, running entirely on YOUR machine.
It serves the same realistic data shape (wrapped, paginated) that we
confirmed the real API uses -- so you can develop and test anytime,
without needing backend's tunnel link to be up.

This is for YOUR testing only -- it's not part of the real project
deliverable, just a development tool.

HOW TO RUN IT:
    uvicorn local_mock_server:app --port 5000

Then in priority_score_from_api.py, temporarily set:
    BACKEND_BASE_URL = "http://localhost:5000"
"""

from fastapi import FastAPI
import json

app = FastAPI()

ROUTES = {
    "/api/maintenance": "test_fixtures/real_maintenance_response.json",
    "/api/assets": "test_fixtures/real_assets_response.json",
    "/api/failure-risk": "test_fixtures/real_failure_risk_response.json",
    "/api/spares": "test_fixtures/real_spares_response.json",
    "/api/technicians/availability": "test_fixtures/real_technician_response.json",
}


def load(path):
    with open(path) as f:
        return json.load(f)


@app.get("/api/maintenance")
def get_maintenance():
    return load(ROUTES["/api/maintenance"])


@app.get("/api/assets")
def get_assets():
    return load(ROUTES["/api/assets"])


@app.get("/api/failure-risk")
def get_failure_risk():
    return load(ROUTES["/api/failure-risk"])


@app.get("/api/spares")
def get_spares():
    return load(ROUTES["/api/spares"])


@app.get("/api/technicians/availability")
def get_technicians():
    return load(ROUTES["/api/technicians/availability"])


@app.get("/api/trains")
def get_trains():
    # No real trains data confirmed yet -- empty list is fine, traffic
    # impact will just be 0 for everything in this local test.
    return {"success": True, "data": {"items": [], "pagination": {"page": 1, "totalPages": 1}}}
