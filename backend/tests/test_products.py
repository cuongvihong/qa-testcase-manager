def test_list_products_empty(client):
    resp = client.get("/api/products")
    assert resp.status_code == 200
    assert resp.json() == []


def test_create_and_list_product(client):
    resp = client.post("/api/products", json={"name": "Website Ban Hang", "description": "demo"})
    assert resp.status_code == 200
    created = resp.json()
    assert created["name"] == "Website Ban Hang"
    assert created["id"] is not None

    resp = client.get("/api/products")
    assert len(resp.json()) == 1


def test_update_product(client, product):
    resp = client.put(f"/api/products/{product.id}", json={"name": "Doi ten", "description": "moi"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "Doi ten"


def test_update_product_not_found(client):
    resp = client.put("/api/products/999", json={"name": "X", "description": ""})
    assert resp.status_code == 404


def test_delete_product(client, product):
    resp = client.delete(f"/api/products/{product.id}")
    assert resp.status_code == 200
    assert resp.json() == {"ok": True}

    resp = client.get("/api/products")
    assert resp.json() == []


def test_delete_product_not_found(client):
    resp = client.delete("/api/products/999")
    assert resp.status_code == 404
