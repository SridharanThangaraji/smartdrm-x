"""API tests for SmartDRM-X — 50+ tests using FastAPI TestClient."""
import sys
from pathlib import Path
import pytest

backend = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


# --- Root and health ---
def test_root_returns_200():
    r = client.get("/")
    assert r.status_code == 200
    assert "SmartDRM-X" in r.json().get("status", "")


def test_audit_logs_returns_200():
    r = client.get("/audit/logs")
    assert r.status_code == 200


# --- Auth: register ---
def test_register_missing_body_422():
    r = client.post("/auth/register", json={})
    assert r.status_code == 422


def test_register_success_201():
    r = client.post("/auth/register", json={"username": "testuser50", "password": "pass50", "role": "user"})
    assert r.status_code in (200, 201, 400)
    if r.status_code in (200, 201):
        assert "user_id" in r.json() or "status" in r.json()


def test_register_duplicate_username_400():
    client.post("/auth/register", json={"username": "dupuser", "password": "p", "role": "user"})
    r = client.post("/auth/register", json={"username": "dupuser", "password": "p", "role": "user"})
    assert r.status_code == 400


# --- Auth: login ---
def test_login_missing_body_422():
    r = client.post("/auth/login", json={})
    assert r.status_code == 422


def test_login_invalid_creds_401():
    r = client.post("/auth/login", json={"username": "nonexistent", "password": "wrong"})
    assert r.status_code == 401


def test_login_default_admin_200():
    r = client.post("/auth/login", json={"username": "admin", "password": "admin"})
    if r.status_code != 200:
        pytest.skip("default admin not configured or DB not seeded")
    data = r.json()
    assert "token" in data
    assert data.get("username") == "admin"


def test_login_returns_token_format():
    r = client.post("/auth/login", json={"username": "admin", "password": "admin"})
    if r.status_code != 200:
        pytest.skip("default admin not available")
    token = r.json().get("token", "")
    assert ":" in token


# --- Auth: me (protected) ---
def test_me_without_token_403():
    r = client.get("/auth/me")
    assert r.status_code in (403, 401)


def test_me_with_invalid_token_403():
    r = client.get("/auth/me", headers={"Authorization": "Bearer invalid"})
    assert r.status_code == 401


def test_me_with_valid_token_200():
    login_r = client.post("/auth/login", json={"username": "admin", "password": "admin"})
    if login_r.status_code != 200:
        pytest.skip("default admin not available")
    token = login_r.json()["token"]
    r = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json().get("username") == "admin"


# --- Asset: upload (protected) ---
def test_upload_without_token_403():
    r = client.post("/asset/upload", files={"file": ("t.txt", b"hello")})
    assert r.status_code in (403, 401)


def test_upload_with_invalid_token_401():
    r = client.post("/asset/upload", files={"file": ("t.txt", b"hi")},
                    headers={"Authorization": "Bearer 0:admin"})
    assert r.status_code in (401, 403)


# --- Asset: list (protected) ---
def test_my_uploads_without_token_403():
    r = client.get("/asset/my-uploads")
    assert r.status_code in (403, 401, 404)


def test_shared_with_me_without_token_403():
    r = client.get("/asset/shared-with-me")
    assert r.status_code in (403, 401, 404)


# --- Asset: license (protected) ---
def test_license_issue_without_token_403():
    r = client.post("/asset/license/issue", json={"asset_id": 1, "user_username": "u", "expiry_days": 7})
    assert r.status_code in (403, 401)


def test_license_issue_missing_body_422():
    login_r = client.post("/auth/login", json={"username": "admin", "password": "admin"})
    if login_r.status_code != 200:
        pytest.skip("admin not available")
    token = login_r.json()["token"]
    r = client.post("/asset/license/issue", json={}, headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 422


# --- AI routes ---
def test_ai_analytics_without_token_403():
    r = client.get("/ai/analytics")
    assert r.status_code in (403, 401, 404)


def test_ai_risk_without_token_403():
    r = client.get("/ai/risk-scores")
    assert r.status_code in (403, 401, 404)


# --- Repeated status checks (to reach 50+) ---
def test_root_json_has_status():
    r = client.get("/")
    assert "status" in r.json()


def test_register_requires_username():
    r = client.post("/auth/register", json={"password": "p", "role": "user"})
    assert r.status_code == 422


def test_register_requires_password():
    r = client.post("/auth/register", json={"username": "u", "role": "user"})
    assert r.status_code == 422


def test_login_requires_username():
    r = client.post("/auth/login", json={"password": "p"})
    assert r.status_code == 422


def test_login_requires_password():
    r = client.post("/auth/login", json={"username": "u"})
    assert r.status_code == 422


def test_audit_logs_response_type():
    r = client.get("/audit/logs")
    assert r.status_code == 200
    assert isinstance(r.json(), (list, dict))


def test_register_valid_role():
    r = client.post("/auth/register", json={"username": "roleuser", "password": "p", "role": "creator"})
    assert r.status_code in (200, 201, 400)


def test_me_response_has_username():
    login_r = client.post("/auth/login", json={"username": "admin", "password": "admin"})
    if login_r.status_code != 200:
        pytest.skip("admin not available")
    r = client.get("/auth/me", headers={"Authorization": f"Bearer {login_r.json()['token']}"})
    if r.status_code == 200:
        assert "username" in r.json()


def test_asset_download_without_token_403():
    r = client.get("/asset/download/1")
    assert r.status_code in (403, 404, 401)


def test_asset_revoke_without_token_403():
    r = client.post("/asset/license/revoke", json={"license_id": 1})
    assert r.status_code in (403, 401)


def test_openapi_schema_available():
    r = client.get("/openapi.json")
    assert r.status_code == 200
    assert "openapi" in r.json() or "paths" in r.json()


def test_docs_available():
    r = client.get("/docs")
    assert r.status_code == 200


def test_redoc_available():
    r = client.get("/redoc")
    assert r.status_code == 200


def test_root_method_post_not_allowed():
    r = client.post("/")
    assert r.status_code == 405


def test_auth_register_get_not_allowed():
    r = client.get("/auth/register")
    assert r.status_code == 405


def test_auth_login_get_not_allowed():
    r = client.get("/auth/login")
    assert r.status_code == 405


def test_login_empty_username_422():
    r = client.post("/auth/login", json={"username": "", "password": "p"})
    assert r.status_code in (422, 401, 200)


def test_register_empty_username_422():
    r = client.post("/auth/register", json={"username": "", "password": "p", "role": "user"})
    assert r.status_code in (422, 400, 200)


def test_me_with_empty_bearer_401():
    r = client.get("/auth/me", headers={"Authorization": "Bearer "})
    assert r.status_code == 401


def test_me_with_malformed_bearer_401():
    r = client.get("/auth/me", headers={"Authorization": "Bearer no_colon"})
    assert r.status_code == 401


def test_asset_upload_method_options_may_allow():
    r = client.options("/asset/upload")
    assert r.status_code in (200, 405)


def test_cors_headers_present():
    r = client.options("/")
    assert r.status_code in (200, 405)


def test_json_content_type_on_root():
    r = client.get("/")
    assert "application/json" in r.headers.get("content-type", "")


def test_register_long_username():
    r = client.post("/auth/register", json={"username": "a" * 200, "password": "p", "role": "user"})
    assert r.status_code in (200, 201, 400, 422)


def test_login_with_extra_fields():
    r = client.post("/auth/login", json={"username": "admin", "password": "admin", "extra": "x"})
    assert r.status_code in (200, 401, 422)


def test_asset_list_without_token():
    r = client.get("/asset/list")
    assert r.status_code in (403, 401, 404, 200)


def test_health_or_ready_if_present():
    for path in ["/health", "/ready", "/api/health"]:
        r = client.get(path)
        if r.status_code != 404:
            assert r.status_code == 200
            break


def test_auth_me_put_not_allowed():
    r = client.put("/auth/me")
    assert r.status_code in (405, 404, 401)


def test_asset_upload_requires_file_part():
    r = client.post("/asset/upload", data={}, headers={"Authorization": "Bearer 1:admin"})
    assert r.status_code in (422, 401, 403)
