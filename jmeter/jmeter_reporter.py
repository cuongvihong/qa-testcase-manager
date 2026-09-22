"""Đọc file JTL (CSV) do JMeter xuất ra (`jmeter -n -t plan.jmx -l results.jtl`),
convert về đúng JSON schema chung của endpoint automation-ingest (TDD mục 5.12),
rồi POST lên QA Test Case Manager — cùng endpoint AIQA's qa_reporter_plugin.py đã dùng,
không cần sửa backend (theo TDD mục 7.2).

Usage:
    python3 jmeter_reporter.py results.jtl \
        --api-url http://127.0.0.1:8000 \
        --api-key <ApiKey> \
        --suite-name "Load Test - API Products"
"""

import argparse
import csv
import sys
from collections import defaultdict
from pathlib import Path

import requests


def convert_jtl_to_cases(jtl_path: Path) -> dict[str, list[dict]]:
    """Gom các sample JMeter theo `label` — mỗi label thành 1 case, mỗi sample là 1 lần chạy."""

    cases_by_label: dict[str, list[dict]] = defaultdict(list)

    with jtl_path.open(newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            label = row["label"]
            success = row["success"].strip().lower() == "true"
            cases_by_label[label].append(
                {
                    "elapsed": int(row["elapsed"]),
                    "success": success,
                    "responseCode": row.get("responseCode", ""),
                }
            )

    return cases_by_label


def build_payload(suite_name: str, cases_by_label: dict[str, list[dict]], build_version: str) -> dict:
    cases = []
    for label, samples in cases_by_label.items():
        for sample in samples:
            cases.append(
                {
                    "title": label,
                    "result": "Pass" if sample["success"] else "Fail",
                    "durationMs": sample["elapsed"],
                    "errorMessage": None if sample["success"] else f"HTTP {sample['responseCode']}",
                    "buildVersion": build_version,
                }
            )

    return {"suiteName": suite_name, "testTypeName": "Performance Test", "cases": cases}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("jtl_path", type=Path, help="File .jtl do jmeter -l xuất ra")
    parser.add_argument("--api-url", required=True, help="Ví dụ http://127.0.0.1:8000")
    parser.add_argument("--api-key", required=True)
    parser.add_argument("--suite-name", default="JMeter Load Test")
    parser.add_argument("--build-version", default="jmeter-run")
    args = parser.parse_args()

    if not args.jtl_path.exists():
        print(f"Khong tim thay file JTL: {args.jtl_path}", file=sys.stderr)
        return 1

    cases_by_label = convert_jtl_to_cases(args.jtl_path)
    if not cases_by_label:
        print("File JTL khong co sample nao.", file=sys.stderr)
        return 1

    payload = build_payload(args.suite_name, cases_by_label, args.build_version)

    resp = requests.post(
        f"{args.api_url}/api/automation/results",
        json=payload,
        headers={"Authorization": f"Bearer {args.api_key}"},
        timeout=10,
    )
    if resp.status_code != 200:
        print(f"Push that bai: {resp.status_code} {resp.text}", file=sys.stderr)
        return 1

    print(f"Da push {len(payload['cases'])} sample len suite '{args.suite_name}': {resp.json()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
