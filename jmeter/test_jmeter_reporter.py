import csv
from pathlib import Path

from jmeter_reporter import build_payload, convert_jtl_to_cases


def write_jtl(tmp_path: Path, rows: list[dict]) -> Path:
    jtl_path = tmp_path / "results.jtl"
    with jtl_path.open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["label", "elapsed", "success", "responseCode"])
        writer.writeheader()
        writer.writerows(rows)
    return jtl_path


def test_convert_groups_samples_by_label(tmp_path):
    jtl_path = write_jtl(
        tmp_path,
        [
            {"label": "GET /api/products", "elapsed": "12", "success": "true", "responseCode": "200"},
            {"label": "GET /api/products", "elapsed": "8", "success": "true", "responseCode": "200"},
            {"label": "GET /api/test-types", "elapsed": "5", "success": "true", "responseCode": "200"},
        ],
    )

    result = convert_jtl_to_cases(jtl_path)

    assert list(result.keys()) == ["GET /api/products", "GET /api/test-types"]
    assert len(result["GET /api/products"]) == 2
    assert len(result["GET /api/test-types"]) == 1


def test_convert_parses_success_and_failure(tmp_path):
    jtl_path = write_jtl(
        tmp_path,
        [
            {"label": "X", "elapsed": "10", "success": "true", "responseCode": "200"},
            {"label": "X", "elapsed": "10", "success": "false", "responseCode": "500"},
        ],
    )

    result = convert_jtl_to_cases(jtl_path)

    assert result["X"][0]["success"] is True
    assert result["X"][1]["success"] is False


def test_build_payload_maps_success_to_pass_and_failure_to_fail_with_error():
    cases_by_label = {
        "X": [
            {"elapsed": 12, "success": True, "responseCode": "200"},
            {"elapsed": 8, "success": False, "responseCode": "500"},
        ]
    }

    payload = build_payload("Suite A", cases_by_label, "v1")

    assert payload["suiteName"] == "Suite A"
    assert payload["testTypeName"] == "Performance Test"
    assert payload["cases"][0] == {
        "title": "X",
        "result": "Pass",
        "durationMs": 12,
        "errorMessage": None,
        "buildVersion": "v1",
    }
    assert payload["cases"][1]["result"] == "Fail"
    assert payload["cases"][1]["errorMessage"] == "HTTP 500"


def test_build_payload_multiple_labels_all_included():
    cases_by_label = {
        "A": [{"elapsed": 1, "success": True, "responseCode": "200"}],
        "B": [{"elapsed": 2, "success": True, "responseCode": "200"}],
    }

    payload = build_payload("Suite", cases_by_label, "v1")

    titles = [c["title"] for c in payload["cases"]]
    assert titles == ["A", "B"]
