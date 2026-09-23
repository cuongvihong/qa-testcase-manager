from sqlmodel import Session, SQLModel, create_engine, select

from app.models import CaseStatus, Product, TestCase, TestSuite, TestType
from app.schemas import AutomationCaseResult, AutomationResultsPayload
from app.services.automation_ingest import ingest_results


def make_session():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False})
    SQLModel.metadata.create_all(engine)
    return Session(engine)


def make_product(session: Session) -> Product:
    product = Product(name="Curricula Trainer Account")
    session.add(product)
    session.commit()
    session.refresh(product)
    return product


def test_creates_testtype_suite_and_case_when_none_exist():
    session = make_session()
    product = make_product(session)

    payload = AutomationResultsPayload(
        suiteName="Personal Information",
        testTypeName="UI Test",
        cases=[
            AutomationCaseResult(title="Save without gender", result="Pass", durationMs=820),
        ],
    )

    summary = ingest_results(session, product_id=product.id, payload=payload)

    test_type = session.exec(select(TestType).where(TestType.name == "UI Test")).one()
    suite = session.exec(select(TestSuite).where(TestSuite.id == summary.suiteId)).one()
    case = session.exec(select(TestCase).where(TestCase.suite_id == suite.id)).one()

    assert suite.name == "Personal Information"
    assert suite.test_type_id == test_type.id
    assert summary.suiteCreated is True
    assert summary.casesCreated == 1
    assert summary.casesUpdated == 0
    assert summary.runsCreated == 1
    assert case.title == "Save without gender"
    assert case.is_auto_created is True
    assert case.current_status == CaseStatus.PASS


def test_reuses_existing_testtype_and_suite_by_name_and_product():
    session = make_session()
    product = make_product(session)

    first = AutomationResultsPayload(
        suiteName="Personal Information",
        testTypeName="UI Test",
        cases=[AutomationCaseResult(title="Save without gender", result="Pass")],
    )
    ingest_results(session, product_id=product.id, payload=first)

    second = AutomationResultsPayload(
        suiteName="Personal Information",
        testTypeName="UI Test",
        cases=[AutomationCaseResult(title="Reject invalid NRIC", result="Fail")],
    )
    summary = ingest_results(session, product_id=product.id, payload=second)

    suites = session.exec(
        select(TestSuite).where(TestSuite.product_id == product.id, TestSuite.name == "Personal Information")
    ).all()
    test_types = session.exec(select(TestType).where(TestType.name == "UI Test")).all()

    assert len(suites) == 1, "không được tạo trùng Suite khi suiteName+productId đã tồn tại"
    assert len(test_types) == 1, "không được tạo trùng TestType khi tên đã tồn tại"
    assert summary.suiteCreated is False
    assert summary.casesCreated == 1


def test_updates_existing_case_and_appends_testrun_instead_of_duplicating():
    session = make_session()
    product = make_product(session)

    payload = AutomationResultsPayload(
        suiteName="Personal Information",
        testTypeName="UI Test",
        cases=[AutomationCaseResult(title="Save without gender", result="Fail", errorMessage="Timeout")],
    )
    ingest_results(session, product_id=product.id, payload=payload)

    rerun_payload = AutomationResultsPayload(
        suiteName="Personal Information",
        testTypeName="UI Test",
        cases=[AutomationCaseResult(title="Save without gender", result="Pass")],
    )
    summary = ingest_results(session, product_id=product.id, payload=rerun_payload)

    cases = session.exec(
        select(TestCase).where(TestCase.title == "Save without gender")
    ).all()

    assert len(cases) == 1, "case trùng title+suiteId phải cập nhật, không tạo mới"
    assert cases[0].current_status == CaseStatus.PASS
    assert summary.casesCreated == 0
    assert summary.casesUpdated == 1
    assert summary.runsCreated == 1


def test_new_case_via_ingest_gets_automated_execution_type_and_inherits_suite_priority():
    session = make_session()
    product = make_product(session)

    test_type = TestType(name="UI Test")
    session.add(test_type)
    session.commit()
    session.refresh(test_type)

    suite = TestSuite(product_id=product.id, test_type_id=test_type.id, name="Payment", priority="High")
    session.add(suite)
    session.commit()
    session.refresh(suite)

    payload = AutomationResultsPayload(
        suiteName="Payment",
        testTypeName="UI Test",
        cases=[AutomationCaseResult(title="Test the het han", result="Fail", scriptPath="tests/test_card.py::test_expired")],
    )
    ingest_results(session, product_id=product.id, payload=payload)

    case = session.exec(select(TestCase).where(TestCase.title == "Test the het han")).one()
    assert case.execution_type == "Automated"
    assert case.priority == "High", "case mới tạo qua ingest phải kế thừa priority của suite"
    assert case.script_path == "tests/test_card.py::test_expired"


def test_updating_existing_case_via_ingest_does_not_touch_priority_or_execution_type():
    session = make_session()
    product = make_product(session)

    test_type = TestType(name="UI Test")
    session.add(test_type)
    session.commit()
    session.refresh(test_type)

    suite = TestSuite(product_id=product.id, test_type_id=test_type.id, name="Payment", priority="High")
    session.add(suite)
    session.commit()
    session.refresh(suite)

    manual_case = TestCase(suite_id=suite.id, title="Case da co", priority="Low", execution_type="Manual")
    session.add(manual_case)
    session.commit()
    session.refresh(manual_case)

    payload = AutomationResultsPayload(
        suiteName="Payment",
        testTypeName="UI Test",
        cases=[AutomationCaseResult(title="Case da co", result="Pass", scriptPath="should/not/apply")],
    )
    ingest_results(session, product_id=product.id, payload=payload)

    session.refresh(manual_case)
    assert manual_case.priority == "Low", "ingest cập nhật case đã có sẵn không được ghi đè priority thủ công"
    assert manual_case.execution_type == "Manual"
    assert manual_case.script_path is None


def test_manually_created_case_is_not_flagged_auto_created():
    session = make_session()
    product = make_product(session)

    test_type = TestType(name="UI Test")
    session.add(test_type)
    session.commit()
    session.refresh(test_type)

    suite = TestSuite(product_id=product.id, test_type_id=test_type.id, name="Personal Information")
    session.add(suite)
    session.commit()
    session.refresh(suite)

    manual_case = TestCase(suite_id=suite.id, title="Save without gender", is_auto_created=False)
    session.add(manual_case)
    session.commit()

    payload = AutomationResultsPayload(
        suiteName="Personal Information",
        testTypeName="UI Test",
        cases=[AutomationCaseResult(title="Save without gender", result="Pass")],
    )
    ingest_results(session, product_id=product.id, payload=payload)

    session.refresh(manual_case)
    assert manual_case.is_auto_created is False, "ingest chỉ update status, không được ghi đè cờ isAutoCreated của case đã có sẵn"
