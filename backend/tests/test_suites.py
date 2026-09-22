def test_create_and_list_suites(client, product, test_type):
    resp = client.post(
        "/api/suites",
        json={"product_id": product.id, "test_type_id": test_type.id, "name": "Bo test dang nhap"},
    )
    assert resp.status_code == 200
    suite = resp.json()
    assert suite["name"] == "Bo test dang nhap"

    resp = client.get(f"/api/products/{product.id}/test-types/{test_type.id}/suites")
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_list_suites_filters_by_product_and_type(client, session, product, test_type):
    from app.models import Product, TestSuite

    other_product = Product(name="San pham khac")
    session.add(other_product)
    session.commit()
    session.refresh(other_product)

    session.add(TestSuite(product_id=product.id, test_type_id=test_type.id, name="Thuoc product nay"))
    session.add(TestSuite(product_id=other_product.id, test_type_id=test_type.id, name="Thuoc product khac"))
    session.commit()

    resp = client.get(f"/api/products/{product.id}/test-types/{test_type.id}/suites")
    names = [s["name"] for s in resp.json()]
    assert names == ["Thuoc product nay"]


def test_update_suite(client, session, product, test_type):
    from app.models import TestSuite

    suite = TestSuite(product_id=product.id, test_type_id=test_type.id, name="Ten cu")
    session.add(suite)
    session.commit()
    session.refresh(suite)

    resp = client.put(
        f"/api/suites/{suite.id}",
        json={
            "product_id": product.id,
            "test_type_id": test_type.id,
            "name": "Ten moi",
            "description": "mo ta moi",
            "priority": "High",
            "status": "Active",
        },
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Ten moi"
    assert resp.json()["priority"] == "High"


def test_update_suite_not_found(client, product, test_type):
    resp = client.put(
        "/api/suites/999",
        json={"product_id": product.id, "test_type_id": test_type.id, "name": "X"},
    )
    assert resp.status_code == 404


def test_delete_suite(client, session, product, test_type):
    from app.models import TestSuite

    suite = TestSuite(product_id=product.id, test_type_id=test_type.id, name="Se bi xoa")
    session.add(suite)
    session.commit()
    session.refresh(suite)

    resp = client.delete(f"/api/suites/{suite.id}")
    assert resp.status_code == 200

    resp = client.get(f"/api/products/{product.id}/test-types/{test_type.id}/suites")
    assert resp.json() == []


def test_delete_suite_not_found(client):
    resp = client.delete("/api/suites/999")
    assert resp.status_code == 404
