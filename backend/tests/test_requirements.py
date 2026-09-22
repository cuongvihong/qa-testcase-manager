def test_list_requirements_empty(client, product):
    resp = client.get(f"/api/products/{product.id}/requirements")
    assert resp.status_code == 200
    assert resp.json() == []


def test_create_and_list_requirement(client, product):
    resp = client.post(
        "/api/requirements",
        json={"product_id": product.id, "title": "Nguoi dung dang nhap duoc", "description": "User story goc"},
    )
    assert resp.status_code == 200
    req = resp.json()
    assert req["title"] == "Nguoi dung dang nhap duoc"

    resp = client.get(f"/api/products/{product.id}/requirements")
    assert len(resp.json()) == 1


def test_requirements_filtered_by_product(client, session, product):
    from app.models import Product, Requirement

    other_product = Product(name="San pham khac")
    session.add(other_product)
    session.commit()
    session.refresh(other_product)

    session.add(Requirement(product_id=product.id, title="Thuoc product nay"))
    session.add(Requirement(product_id=other_product.id, title="Thuoc product khac"))
    session.commit()

    resp = client.get(f"/api/products/{product.id}/requirements")
    titles = [r["title"] for r in resp.json()]
    assert titles == ["Thuoc product nay"]


def test_link_case_to_requirement(client, session, product, suite):
    from app.models import Requirement, RequirementCoverage, TestCase

    req = Requirement(product_id=product.id, title="Yeu cau A")
    session.add(req)
    case = TestCase(suite_id=suite.id, title="Case A")
    session.add(case)
    session.commit()
    session.refresh(req)
    session.refresh(case)

    resp = client.post(f"/api/requirements/{req.id}/link-case", json={"test_case_id": case.id})
    assert resp.status_code == 200

    coverages = session.exec(
        __import__("sqlmodel").select(RequirementCoverage).where(RequirementCoverage.requirement_id == req.id)
    ).all()
    assert len(coverages) == 1
    assert coverages[0].test_case_id == case.id


def test_link_case_to_nonexistent_requirement_returns_404(client, session, suite):
    from app.models import TestCase

    case = TestCase(suite_id=suite.id, title="Case A")
    session.add(case)
    session.commit()
    session.refresh(case)

    resp = client.post("/api/requirements/999/link-case", json={"test_case_id": case.id})
    assert resp.status_code == 404


def test_traceability_matrix_flags_uncovered_requirements(client, session, product, suite):
    from app.models import Requirement, TestCase

    covered = Requirement(product_id=product.id, title="Da co test cover")
    uncovered = Requirement(product_id=product.id, title="Chua co test nao cover")
    session.add(covered)
    session.add(uncovered)
    case = TestCase(suite_id=suite.id, title="Case cover")
    session.add(case)
    session.commit()
    session.refresh(covered)
    session.refresh(case)

    client.post(f"/api/requirements/{covered.id}/link-case", json={"test_case_id": case.id})

    resp = client.get(f"/api/products/{product.id}/traceability-matrix")
    assert resp.status_code == 200
    matrix = {row["title"]: row for row in resp.json()}

    assert matrix["Da co test cover"]["caseIds"] == [case.id]
    assert matrix["Da co test cover"]["covered"] is True
    assert matrix["Chua co test nao cover"]["caseIds"] == []
    assert matrix["Chua co test nao cover"]["covered"] is False
