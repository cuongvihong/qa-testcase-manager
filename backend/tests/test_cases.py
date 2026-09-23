def test_create_and_list_cases(client, suite):
    resp = client.post("/api/cases", json={"suite_id": suite.id, "title": "Dang nhap hop le"})
    assert resp.status_code == 200
    case = resp.json()
    assert case["title"] == "Dang nhap hop le"
    assert case["is_auto_created"] is False, "case tạo tay qua API không được đánh dấu auto-created"

    resp = client.get(f"/api/suites/{suite.id}/cases")
    assert len(resp.json()) == 1


def test_create_case_inherits_priority_from_suite_when_not_given(client, session, product, test_type):
    from app.models import TestSuite

    high_suite = TestSuite(product_id=product.id, test_type_id=test_type.id, name="Payment", priority="High")
    session.add(high_suite)
    session.commit()
    session.refresh(high_suite)

    resp = client.post("/api/cases", json={"suite_id": high_suite.id, "title": "Thanh toan"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["priority"] == "High"
    assert body["execution_type"] == "Manual"
    assert body["script_path"] is None


def test_create_case_explicit_priority_overrides_suite_priority(client, suite):
    resp = client.post(
        "/api/cases", json={"suite_id": suite.id, "title": "Case uu tien thap", "priority": "Low"}
    )
    assert resp.status_code == 200
    assert resp.json()["priority"] == "Low"


def test_get_case_includes_runs(client, session, suite):
    from app.models import TestCase, TestRun

    case = TestCase(suite_id=suite.id, title="Case co lich su")
    session.add(case)
    session.commit()
    session.refresh(case)

    session.add(TestRun(test_case_id=case.id, result="Pass"))
    session.add(TestRun(test_case_id=case.id, result="Fail"))
    session.commit()

    resp = client.get(f"/api/cases/{case.id}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["case"]["id"] == case.id
    assert len(body["runs"]) == 2


def test_get_case_not_found(client):
    resp = client.get("/api/cases/999")
    assert resp.status_code == 404


def test_update_case(client, session, suite):
    from app.models import TestCase

    case = TestCase(suite_id=suite.id, title="Ten cu")
    session.add(case)
    session.commit()
    session.refresh(case)

    resp = client.put(
        f"/api/cases/{case.id}",
        json={"suite_id": suite.id, "title": "Ten moi", "description": "", "current_status": "Pass"},
    )
    assert resp.status_code == 200
    assert resp.json()["title"] == "Ten moi"
    assert resp.json()["current_status"] == "Pass"


def test_update_case_patches_priority_execution_type_and_script_path(client, session, suite):
    from app.models import TestCase

    case = TestCase(suite_id=suite.id, title="Case automation")
    session.add(case)
    session.commit()
    session.refresh(case)

    resp = client.put(
        f"/api/cases/{case.id}",
        json={
            "suite_id": suite.id,
            "title": "Case automation",
            "description": "",
            "current_status": "Pass",
            "priority": "High",
            "execution_type": "Automated",
            "script_path": "tests/test_login.py::test_valid_email",
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["priority"] == "High"
    assert body["execution_type"] == "Automated"
    assert body["script_path"] == "tests/test_login.py::test_valid_email"


def test_get_case_includes_environment_name_on_runs(client, session, suite):
    from app.models import Environment, TestCase, TestRun

    env = Environment(product_id=suite.product_id, name="Staging")
    session.add(env)
    session.commit()
    session.refresh(env)

    case = TestCase(suite_id=suite.id, title="Case voi environment")
    session.add(case)
    session.commit()
    session.refresh(case)

    session.add(TestRun(test_case_id=case.id, result="Pass", environment_id=env.id))
    session.add(TestRun(test_case_id=case.id, result="Fail"))
    session.commit()

    resp = client.get(f"/api/cases/{case.id}")
    runs = resp.json()["runs"]
    with_env = next(r for r in runs if r["environment_id"] == env.id)
    without_env = next(r for r in runs if r["environment_id"] is None)
    assert with_env["environment_name"] == "Staging"
    assert without_env["environment_name"] is None


def test_update_case_not_found(client, suite):
    resp = client.put("/api/cases/999", json={"suite_id": suite.id, "title": "X"})
    assert resp.status_code == 404


def test_delete_case(client, session, suite):
    from app.models import TestCase

    case = TestCase(suite_id=suite.id, title="Se bi xoa")
    session.add(case)
    session.commit()
    session.refresh(case)

    resp = client.delete(f"/api/cases/{case.id}")
    assert resp.status_code == 200

    resp = client.get(f"/api/suites/{suite.id}/cases")
    assert resp.json() == []


def test_delete_case_not_found(client):
    resp = client.delete("/api/cases/999")
    assert resp.status_code == 404


def test_retry_case_creates_new_run_linked_to_last(client, session, suite):
    from app.models import TestCase, TestRun

    case = TestCase(suite_id=suite.id, title="Case can retry")
    session.add(case)
    session.commit()
    session.refresh(case)

    first_run = TestRun(test_case_id=case.id, result="Fail", build_version="v1")
    session.add(first_run)
    session.commit()
    session.refresh(first_run)

    resp = client.post(f"/api/cases/{case.id}/retry")
    assert resp.status_code == 200
    new_run = resp.json()
    assert new_run["retry_of_run_id"] == first_run.id
    assert new_run["build_version"] == "v1"

    resp = client.get(f"/api/cases/{case.id}")
    assert len(resp.json()["runs"]) == 2


def test_retry_case_without_prior_run_returns_400(client, session, suite):
    from app.models import TestCase

    case = TestCase(suite_id=suite.id, title="Case chua chay lan nao")
    session.add(case)
    session.commit()
    session.refresh(case)

    resp = client.post(f"/api/cases/{case.id}/retry")
    assert resp.status_code == 400


def test_retry_case_not_found(client):
    resp = client.post("/api/cases/999/retry")
    assert resp.status_code == 404
