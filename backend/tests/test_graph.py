from datetime import datetime, timedelta, timezone


def test_graph_data_empty(client, product, test_type):
    resp = client.get(f"/api/products/{product.id}/test-types/{test_type.id}/graph-data")
    assert resp.status_code == 200
    body = resp.json()
    assert body["statusCounts"] == {"Not Run": 0, "In Progress": 0, "Pass": 0, "Fail": 0, "Blocked": 0, "Skipped": 0}
    assert body["trend"] == []
    assert body["coveragePercent"] is None


def test_graph_data_counts_case_status_within_test_type_only(client, session, product, test_type):
    from app.models import CaseStatus, TestCase, TestSuite, TestType

    other_type = TestType(name="API Test")
    session.add(other_type)
    session.commit()
    session.refresh(other_type)

    suite = TestSuite(product_id=product.id, test_type_id=test_type.id, name="S1")
    other_suite = TestSuite(product_id=product.id, test_type_id=other_type.id, name="S2")
    session.add(suite)
    session.add(other_suite)
    session.commit()
    session.refresh(suite)
    session.refresh(other_suite)

    session.add(TestCase(suite_id=suite.id, title="C1", current_status=CaseStatus.PASS))
    session.add(TestCase(suite_id=suite.id, title="C2", current_status=CaseStatus.FAIL))
    session.add(TestCase(suite_id=suite.id, title="C3", current_status=CaseStatus.PASS))
    # Case thuộc TestType khác, không được tính vào
    session.add(TestCase(suite_id=other_suite.id, title="C4", current_status=CaseStatus.FAIL))
    session.commit()

    resp = client.get(f"/api/products/{product.id}/test-types/{test_type.id}/graph-data")
    counts = resp.json()["statusCounts"]
    assert counts["Pass"] == 2
    assert counts["Fail"] == 1
    assert counts["Not Run"] == 0


def test_graph_data_trend_groups_runs_by_day(client, session, product, test_type):
    from app.models import CaseStatus, TestCase, TestRun, TestSuite

    suite = TestSuite(product_id=product.id, test_type_id=test_type.id, name="S1")
    session.add(suite)
    session.commit()
    session.refresh(suite)
    case = TestCase(suite_id=suite.id, title="C1", current_status=CaseStatus.PASS)
    session.add(case)
    session.commit()
    session.refresh(case)

    today = datetime.now(timezone.utc)
    yesterday = today - timedelta(days=1)

    session.add(TestRun(test_case_id=case.id, result="Pass", executed_at=yesterday))
    session.add(TestRun(test_case_id=case.id, result="Fail", executed_at=yesterday))
    session.add(TestRun(test_case_id=case.id, result="Pass", executed_at=today))
    session.commit()

    resp = client.get(f"/api/products/{product.id}/test-types/{test_type.id}/graph-data")
    trend = resp.json()["trend"]
    assert len(trend) == 2

    by_date = {row["date"]: row["passRate"] for row in trend}
    assert by_date[yesterday.strftime("%Y-%m-%d")] == 0.5
    assert by_date[today.strftime("%Y-%m-%d")] == 1.0


def test_graph_data_coverage_percent_from_requirements(client, session, product, test_type, suite):
    from app.models import Requirement, TestCase

    covered_req = Requirement(product_id=product.id, title="R1")
    uncovered_req = Requirement(product_id=product.id, title="R2")
    session.add(covered_req)
    session.add(uncovered_req)
    case = TestCase(suite_id=suite.id, title="C1")
    session.add(case)
    session.commit()
    session.refresh(covered_req)
    session.refresh(case)

    client.post(f"/api/requirements/{covered_req.id}/link-case", json={"test_case_id": case.id})

    resp = client.get(f"/api/products/{product.id}/test-types/{test_type.id}/graph-data")
    assert resp.json()["coveragePercent"] == 50.0


def test_type_timeline_lists_runs_across_all_cases_newest_first(client, session, product, test_type, suite):
    from datetime import datetime, timedelta, timezone

    from app.models import TestCase, TestRun

    case1 = TestCase(suite_id=suite.id, title="Case 1")
    case2 = TestCase(suite_id=suite.id, title="Case 2")
    session.add(case1)
    session.add(case2)
    session.commit()
    session.refresh(case1)
    session.refresh(case2)

    now = datetime.now(timezone.utc)
    session.add(TestRun(test_case_id=case1.id, result="Pass", executed_at=now - timedelta(hours=2), build_version="v1"))
    session.add(TestRun(test_case_id=case2.id, result="Fail", executed_at=now, build_version="v2"))
    session.commit()

    resp = client.get(f"/api/products/{product.id}/test-types/{test_type.id}/timeline")
    assert resp.status_code == 200
    rows = resp.json()
    assert len(rows) == 2
    assert rows[0]["testCaseTitle"] == "Case 2"
    assert rows[0]["result"] == "Fail"
    assert rows[1]["testCaseTitle"] == "Case 1"


def test_type_timeline_scoped_to_test_type(client, session, product, test_type, suite):
    from app.models import TestCase, TestRun, TestSuite, TestType

    other_type = TestType(name="API Test")
    session.add(other_type)
    session.commit()
    session.refresh(other_type)
    other_suite = TestSuite(product_id=product.id, test_type_id=other_type.id, name="S2")
    session.add(other_suite)
    session.commit()
    session.refresh(other_suite)

    case_in = TestCase(suite_id=suite.id, title="Trong TestType")
    case_out = TestCase(suite_id=other_suite.id, title="Ngoai TestType")
    session.add(case_in)
    session.add(case_out)
    session.commit()
    session.refresh(case_in)
    session.refresh(case_out)

    session.add(TestRun(test_case_id=case_in.id, result="Pass"))
    session.add(TestRun(test_case_id=case_out.id, result="Pass"))
    session.commit()

    resp = client.get(f"/api/products/{product.id}/test-types/{test_type.id}/timeline")
    rows = resp.json()
    assert len(rows) == 1
    assert rows[0]["testCaseTitle"] == "Trong TestType"
