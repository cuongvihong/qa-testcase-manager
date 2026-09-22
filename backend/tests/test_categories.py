def test_list_categories_empty(client, product, test_type):
    resp = client.get(f"/api/products/{product.id}/test-types/{test_type.id}/categories")
    assert resp.status_code == 200
    assert resp.json() == []


def test_groups_suites_by_module_with_case_count_and_pass_rate(client, session, product, test_type):
    from app.models import CaseStatus, TestCase, TestSuite

    login_suite = TestSuite(product_id=product.id, test_type_id=test_type.id, name="Bo test dang nhap", module="Login")
    session.add(login_suite)
    session.commit()
    session.refresh(login_suite)

    session.add(TestCase(suite_id=login_suite.id, title="Case 1", current_status=CaseStatus.PASS))
    session.add(TestCase(suite_id=login_suite.id, title="Case 2", current_status=CaseStatus.PASS))
    session.add(TestCase(suite_id=login_suite.id, title="Case 3", current_status=CaseStatus.FAIL))
    session.commit()

    resp = client.get(f"/api/products/{product.id}/test-types/{test_type.id}/categories")
    assert resp.status_code == 200
    categories = resp.json()
    assert len(categories) == 1
    login = categories[0]
    assert login["module"] == "Login"
    assert login["suiteIds"] == [login_suite.id]
    assert login["caseCount"] == 3
    assert login["passRate"] == 2 / 3


def test_suites_without_module_are_grouped_as_unassigned(client, session, product, test_type):
    from app.models import TestSuite

    session.add(TestSuite(product_id=product.id, test_type_id=test_type.id, name="Chua co module", module=""))
    session.commit()

    resp = client.get(f"/api/products/{product.id}/test-types/{test_type.id}/categories")
    categories = resp.json()
    assert len(categories) == 1
    assert categories[0]["module"] == "Chưa phân loại"


def test_categories_scoped_by_test_type_not_just_one_suite(client, session, product, test_type):
    """Category phải quét toàn bộ TestType (giống phạm vi tab Test Suite), không chỉ 1 suite —
    đây chính là deviation đã sửa so với TDD gốc (route theo suiteId)."""
    from app.models import TestSuite

    session.add(TestSuite(product_id=product.id, test_type_id=test_type.id, name="Suite A", module="Payment"))
    session.add(TestSuite(product_id=product.id, test_type_id=test_type.id, name="Suite B", module="Payment"))
    session.commit()

    resp = client.get(f"/api/products/{product.id}/test-types/{test_type.id}/categories")
    categories = resp.json()
    assert len(categories) == 1
    assert len(categories[0]["suiteIds"]) == 2


def test_categories_dont_leak_across_test_types(client, session, product, test_type):
    from app.models import TestSuite, TestType

    other_type = TestType(name="API Test")
    session.add(other_type)
    session.commit()
    session.refresh(other_type)

    session.add(TestSuite(product_id=product.id, test_type_id=test_type.id, name="Thuoc UI Test", module="Cart"))
    session.add(TestSuite(product_id=product.id, test_type_id=other_type.id, name="Thuoc API Test", module="Cart"))
    session.commit()

    resp = client.get(f"/api/products/{product.id}/test-types/{test_type.id}/categories")
    categories = resp.json()
    assert len(categories) == 1
    assert len(categories[0]["suiteIds"]) == 1
