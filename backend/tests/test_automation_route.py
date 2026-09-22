PAYLOAD = {
    "suiteName": "Bo test dang nhap",
    "testTypeName": "UI Test",
    "cases": [{"title": "Dang nhap hop le", "result": "Pass", "durationMs": 100}],
}


def test_missing_authorization_header_returns_401(client):
    resp = client.post("/api/automation/results", json=PAYLOAD)
    assert resp.status_code == 401


def test_malformed_authorization_header_returns_401(client):
    resp = client.post(
        "/api/automation/results", json=PAYLOAD, headers={"Authorization": "NotBearer abc"}
    )
    assert resp.status_code == 401


def test_wrong_api_key_returns_401(client, api_key):
    resp = client.post(
        "/api/automation/results", json=PAYLOAD, headers={"Authorization": "Bearer sai-key"}
    )
    assert resp.status_code == 401


def test_valid_api_key_returns_200_and_summary(client, api_key):
    resp = client.post(
        "/api/automation/results",
        json=PAYLOAD,
        headers={"Authorization": f"Bearer {api_key.key}"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["suiteCreated"] is True
    assert body["casesCreated"] == 1
    assert body["runsCreated"] == 1


def test_valid_api_key_resolves_correct_product(client, session, api_key, product):
    from app.models import TestSuite

    resp = client.post(
        "/api/automation/results",
        json=PAYLOAD,
        headers={"Authorization": f"Bearer {api_key.key}"},
    )
    suite_id = resp.json()["suiteId"]
    suite = session.get(TestSuite, suite_id)
    assert suite.product_id == product.id, "ApiKey phải resolve đúng product_id gắn với nó, không phải product khác"
