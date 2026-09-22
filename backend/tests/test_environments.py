def test_list_environments_empty(client, product):
    resp = client.get(f"/api/products/{product.id}/environments")
    assert resp.status_code == 200
    assert resp.json() == []


def test_create_and_list_environment(client, product):
    resp = client.post(
        "/api/environments",
        json={"product_id": product.id, "name": "Staging", "device_info": None},
    )
    assert resp.status_code == 200
    env = resp.json()
    assert env["name"] == "Staging"
    assert env["device_info"] is None

    resp = client.get(f"/api/products/{product.id}/environments")
    assert len(resp.json()) == 1


def test_list_environments_filters_by_product(client, session, product):
    from app.models import Environment, Product

    other_product = Product(name="San pham khac")
    session.add(other_product)
    session.commit()
    session.refresh(other_product)

    session.add(Environment(product_id=product.id, name="Thuoc product nay"))
    session.add(Environment(product_id=other_product.id, name="Thuoc product khac"))
    session.commit()

    resp = client.get(f"/api/products/{product.id}/environments")
    names = [e["name"] for e in resp.json()]
    assert names == ["Thuoc product nay"]


def test_create_environment_with_device_info_for_ui_test(client, product):
    resp = client.post(
        "/api/environments",
        json={"product_id": product.id, "name": "Production", "device_info": "Chrome 128, Windows 11"},
    )
    assert resp.status_code == 200
    assert resp.json()["device_info"] == "Chrome 128, Windows 11"


def test_update_environment(client, session, product):
    from app.models import Environment

    env = Environment(product_id=product.id, name="Ten cu")
    session.add(env)
    session.commit()
    session.refresh(env)

    resp = client.put(
        f"/api/environments/{env.id}",
        json={"product_id": product.id, "name": "Ten moi", "device_info": "Safari 17, macOS"},
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Ten moi"
    assert resp.json()["device_info"] == "Safari 17, macOS"


def test_update_environment_not_found(client, product):
    resp = client.put("/api/environments/999", json={"product_id": product.id, "name": "X"})
    assert resp.status_code == 404
