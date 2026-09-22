def test_list_test_types_returns_seeded_fixed_list(client, session):
    from app.models import FIXED_TEST_TYPES, TestType

    for name in FIXED_TEST_TYPES:
        session.add(TestType(name=name))
    session.commit()

    resp = client.get("/api/test-types")
    assert resp.status_code == 200
    names = [t["name"] for t in resp.json()]
    assert names == FIXED_TEST_TYPES


def test_list_test_types_empty(client):
    resp = client.get("/api/test-types")
    assert resp.status_code == 200
    assert resp.json() == []
