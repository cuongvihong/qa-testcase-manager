from sqlmodel import Session, select

from app.models import CaseStatus, TestCase, TestRun, TestSuite, TestType
from app.schemas import AutomationResultsPayload, IngestSummary


def ingest_results(session: Session, product_id: int, payload: AutomationResultsPayload) -> IngestSummary:
    """Theo TDD mục 5.12, logic 6 bước xử lý khi backend nhận kết quả automation."""

    # 1. Xác thực ApiKey, xác định Product -- đã làm ở route trước khi gọi hàm này.

    # 2. Tìm hoặc tạo TestType theo testTypeName
    test_type = session.exec(select(TestType).where(TestType.name == payload.testTypeName)).first()
    if test_type is None:
        test_type = TestType(name=payload.testTypeName)
        session.add(test_type)
        session.commit()
        session.refresh(test_type)

    # 3. Tìm Suite theo suiteName và productId, nếu không có thì tạo mới
    suite = session.exec(
        select(TestSuite).where(TestSuite.product_id == product_id, TestSuite.name == payload.suiteName)
    ).first()
    suite_created = suite is None
    if suite is None:
        suite = TestSuite(product_id=product_id, test_type_id=test_type.id, name=payload.suiteName)
        session.add(suite)
        session.commit()
        session.refresh(suite)

    cases_created = 0
    cases_updated = 0
    runs_created = 0

    for case_result in payload.cases:
        # 4. Với mỗi case trong danh sách, tìm TestCase theo title và suiteId
        case = session.exec(
            select(TestCase).where(TestCase.suite_id == suite.id, TestCase.title == case_result.title)
        ).first()

        if case is not None:
            # 5. Nếu tìm thấy, cập nhật currentStatus, tạo một TestRun mới
            case.current_status = CaseStatus(case_result.result.value)
            session.add(case)
            cases_updated += 1
        else:
            # 6. Nếu không tìm thấy, tạo TestCase mới với isAutoCreated=true, sau đó tạo TestRun
            case = TestCase(
                suite_id=suite.id,
                title=case_result.title,
                current_status=CaseStatus(case_result.result.value),
                is_auto_created=True,
            )
            session.add(case)
            session.commit()
            session.refresh(case)
            cases_created += 1

        session.commit()
        session.refresh(case)

        run = TestRun(
            test_case_id=case.id,
            result=case_result.result,
            build_version=case_result.buildVersion,
            error_note=case_result.errorMessage,
            duration_ms=case_result.durationMs,
        )
        session.add(run)
        runs_created += 1

    session.commit()

    return IngestSummary(
        suiteId=suite.id,
        suiteCreated=suite_created,
        casesCreated=cases_created,
        casesUpdated=cases_updated,
        runsCreated=runs_created,
    )
