import pytest
from app.models import TestCase, TestSuite


@pytest.fixture
def two_suites_with_cases(session, product, test_type):
    auth = TestSuite(product_id=product.id, test_type_id=test_type.id, name="Auth suite", module="Auth", priority="High")
    payment = TestSuite(
        product_id=product.id, test_type_id=test_type.id, name="Payment suite", module="Payment", priority="Medium"
    )
    session.add(auth)
    session.add(payment)
    session.commit()
    session.refresh(auth)
    session.refresh(payment)

    c1 = TestCase(suite_id=auth.id, title="Login voi email hop le", priority="High")
    c2 = TestCase(suite_id=auth.id, title="Login voi password sai", priority="Low")
    c3 = TestCase(suite_id=payment.id, title="Thanh toan the het han", priority="Medium")
    session.add(c1)
    session.add(c2)
    session.add(c3)
    session.commit()

    return auth, payment


def test_search_by_keyword_matches_title_case_insensitive(client, product, test_type, two_suites_with_cases):
    resp = client.get(
        f"/api/products/{product.id}/test-types/{test_type.id}/cases/search", params={"q": "LOGIN"}
    )
    assert resp.status_code == 200
    titles = {row["title"] for row in resp.json()}
    assert titles == {"Login voi email hop le", "Login voi password sai"}


def test_search_by_priority_filters_across_suites(client, product, test_type, two_suites_with_cases):
    resp = client.get(
        f"/api/products/{product.id}/test-types/{test_type.id}/cases/search", params={"priority": "Medium"}
    )
    assert resp.status_code == 200
    titles = {row["title"] for row in resp.json()}
    assert titles == {"Thanh toan the het han"}


def test_search_by_module_filters_to_one_suite(client, product, test_type, two_suites_with_cases):
    resp = client.get(
        f"/api/products/{product.id}/test-types/{test_type.id}/cases/search", params={"module": "Auth"}
    )
    assert resp.status_code == 200
    titles = {row["title"] for row in resp.json()}
    assert titles == {"Login voi email hop le", "Login voi password sai"}


def test_search_combines_query_and_priority(client, product, test_type, two_suites_with_cases):
    resp = client.get(
        f"/api/products/{product.id}/test-types/{test_type.id}/cases/search",
        params={"q": "login", "priority": "Low"},
    )
    assert resp.status_code == 200
    titles = {row["title"] for row in resp.json()}
    assert titles == {"Login voi password sai"}


def test_search_with_no_filters_returns_all_cases_in_test_type(client, product, test_type, two_suites_with_cases):
    resp = client.get(f"/api/products/{product.id}/test-types/{test_type.id}/cases/search")
    assert resp.status_code == 200
    assert len(resp.json()) == 3


def test_search_returns_empty_list_when_nothing_matches(client, product, test_type, two_suites_with_cases):
    resp = client.get(
        f"/api/products/{product.id}/test-types/{test_type.id}/cases/search", params={"q": "khong ton tai"}
    )
    assert resp.status_code == 200
    assert resp.json() == []


def test_search_row_shape_includes_suite_and_module_info(client, product, test_type, two_suites_with_cases):
    auth, _ = two_suites_with_cases
    resp = client.get(
        f"/api/products/{product.id}/test-types/{test_type.id}/cases/search", params={"q": "email"}
    )
    row = resp.json()[0]
    assert row["suite_id"] == auth.id
    assert row["suite_name"] == "Auth suite"
    assert row["module"] == "Auth"
    assert row["priority"] == "High"
    assert row["current_status"] == "Not Run"
