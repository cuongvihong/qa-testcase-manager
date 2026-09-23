def test_list_reports_empty(client, product):
    resp = client.get(f"/api/products/{product.id}/reports")
    assert resp.status_code == 200
    assert resp.json() == []


def test_export_report_for_whole_product_creates_csv_file(client, session, product, suite):
    from app.models import CaseStatus, TestCase

    session.add(TestCase(suite_id=suite.id, title="Case 1", current_status=CaseStatus.PASS))
    session.add(TestCase(suite_id=suite.id, title="Case 2", current_status=CaseStatus.FAIL))
    session.commit()

    resp = client.post(
        "/api/reports/export", json={"product_id": product.id, "scope": "Product", "suite_id": None}
    )
    assert resp.status_code == 200
    report = resp.json()
    assert report["format"] == "CSV"
    assert report["scope"] == "Product"
    assert report["file_path"]

    from pathlib import Path

    content = Path(report["file_path"]).read_text()
    assert "Case 1" in content
    assert "Case 2" in content
    assert "Pass" in content
    assert "Fail" in content


def test_export_report_scoped_to_single_suite_excludes_other_suites(client, session, product, suite, test_type):
    from app.models import CaseStatus, TestCase, TestSuite

    other_suite = TestSuite(product_id=product.id, test_type_id=test_type.id, name="Suite khac")
    session.add(other_suite)
    session.commit()
    session.refresh(other_suite)

    session.add(TestCase(suite_id=suite.id, title="Trong suite nay", current_status=CaseStatus.PASS))
    session.add(TestCase(suite_id=other_suite.id, title="Ngoai suite nay", current_status=CaseStatus.PASS))
    session.commit()

    resp = client.post(
        "/api/reports/export", json={"product_id": product.id, "scope": "Suite", "suite_id": suite.id}
    )
    assert resp.status_code == 200

    from pathlib import Path

    content = Path(resp.json()["file_path"]).read_text()
    assert "Trong suite nay" in content
    assert "Ngoai suite nay" not in content


def test_export_report_appears_in_history(client, product, suite):
    client.post("/api/reports/export", json={"product_id": product.id, "scope": "Product", "suite_id": None})
    client.post("/api/reports/export", json={"product_id": product.id, "scope": "Suite", "suite_id": suite.id})

    resp = client.get(f"/api/products/{product.id}/reports")
    reports = resp.json()
    assert len(reports) == 2


def test_download_report_returns_the_csv_content(client, product, suite):
    export_resp = client.post(
        "/api/reports/export", json={"product_id": product.id, "scope": "Product", "suite_id": None}
    )
    report_id = export_resp.json()["id"]

    resp = client.get(f"/api/reports/{report_id}/download")
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("text/csv")


def test_download_nonexistent_report_returns_404(client):
    resp = client.get("/api/reports/999/download")
    assert resp.status_code == 404


def test_export_report_as_pdf_creates_pdf_file(client, session, product, suite):
    from app.models import CaseStatus, TestCase

    session.add(TestCase(suite_id=suite.id, title="Case PDF", current_status=CaseStatus.PASS))
    session.commit()

    resp = client.post(
        "/api/reports/export",
        json={"product_id": product.id, "scope": "Product", "suite_id": None, "format": "PDF"},
    )
    assert resp.status_code == 200
    report = resp.json()
    assert report["format"] == "PDF"

    from pathlib import Path

    raw = Path(report["file_path"]).read_bytes()
    assert raw.startswith(b"%PDF")


def test_export_report_as_excel_creates_xlsx_file(client, session, product, suite):
    from app.models import CaseStatus, TestCase

    session.add(TestCase(suite_id=suite.id, title="Case Excel", current_status=CaseStatus.PASS))
    session.commit()

    resp = client.post(
        "/api/reports/export",
        json={"product_id": product.id, "scope": "Product", "suite_id": None, "format": "Excel"},
    )
    assert resp.status_code == 200
    report = resp.json()
    assert report["format"] == "Excel"

    from pathlib import Path

    raw = Path(report["file_path"]).read_bytes()
    assert raw[:4] == b"PK\x03\x04"


def test_download_pdf_report_returns_pdf_content_type(client, session, product, suite):
    from app.models import CaseStatus, TestCase

    session.add(TestCase(suite_id=suite.id, title="Case PDF DL", current_status=CaseStatus.PASS))
    session.commit()

    export_resp = client.post(
        "/api/reports/export",
        json={"product_id": product.id, "scope": "Product", "suite_id": None, "format": "PDF"},
    )
    report_id = export_resp.json()["id"]

    resp = client.get(f"/api/reports/{report_id}/download")
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/pdf"
    assert resp.content.startswith(b"%PDF")


def test_download_excel_report_returns_xlsx_content_type(client, session, product, suite):
    from app.models import CaseStatus, TestCase

    session.add(TestCase(suite_id=suite.id, title="Case Excel DL", current_status=CaseStatus.PASS))
    session.commit()

    export_resp = client.post(
        "/api/reports/export",
        json={"product_id": product.id, "scope": "Product", "suite_id": None, "format": "Excel"},
    )
    report_id = export_resp.json()["id"]

    resp = client.get(f"/api/reports/{report_id}/download")
    assert resp.status_code == 200
    assert resp.headers["content-type"] == (
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    assert resp.content[:4] == b"PK\x03\x04"
