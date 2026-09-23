from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class UserRole(str, Enum):
    ADMIN = "Admin"
    MEMBER = "Member"


class UserStatus(str, Enum):
    ACTIVE = "Active"
    LOCKED = "Locked"


class SuitePriority(str, Enum):
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


class SuiteStatus(str, Enum):
    ACTIVE = "Active"
    DEPRECATED = "Deprecated"
    DRAFT = "Draft"


class CaseStatus(str, Enum):
    NOT_RUN = "Not Run"
    IN_PROGRESS = "In Progress"
    PASS = "Pass"
    FAIL = "Fail"
    BLOCKED = "Blocked"
    SKIPPED = "Skipped"


class RunResult(str, Enum):
    PASS = "Pass"
    FAIL = "Fail"
    BLOCKED = "Blocked"
    SKIPPED = "Skipped"


class CaseExecutionType(str, Enum):
    MANUAL = "Manual"
    AUTOMATED = "Automated"


class DeleteRequestStatus(str, Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"


class TargetType(str, Enum):
    SUITE = "Suite"
    CASE = "Case"


class ReportFormat(str, Enum):
    PDF = "PDF"
    EXCEL = "Excel"
    CSV = "CSV"


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    password: str
    display_name: str
    # Phase 2, tạm chưa dùng
    role: UserRole = Field(default=UserRole.ADMIN)
    status: UserStatus = Field(default=UserStatus.ACTIVE)
    created_at: datetime = Field(default_factory=utcnow)


class Product(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    description: str = ""
    owner_id: Optional[int] = Field(default=None, foreign_key="user.id")
    created_at: datetime = Field(default_factory=utcnow)


class ProductMember(SQLModel, table=True):
    """Phase 2, tạm chưa dùng."""

    id: Optional[int] = Field(default=None, primary_key=True)
    product_id: int = Field(foreign_key="product.id")
    user_id: int = Field(foreign_key="user.id")


class TestType(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)


FIXED_TEST_TYPES = [
    "Unit Test",
    "Integration Test",
    "UI Test",
    "Performance Test",
    "API Test",
    "Regression Test",
    "Smoke Test",
    "Security Test",
    "Compatibility Test",
    "Usability Test",
    "Load / Stress Test",
    "Acceptance Test (UAT)",
]


class TestSuite(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    product_id: int = Field(foreign_key="product.id", index=True)
    test_type_id: int = Field(foreign_key="testtype.id", index=True)
    name: str = Field(index=True)
    description: str = ""
    module: str = ""
    owner_id: Optional[int] = Field(default=None, foreign_key="user.id")
    priority: SuitePriority = Field(default=SuitePriority.MEDIUM)
    status: SuiteStatus = Field(default=SuiteStatus.ACTIVE)
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)


class TestCase(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    suite_id: int = Field(foreign_key="testsuite.id", index=True)
    title: str = Field(index=True)
    description: str = ""
    current_status: CaseStatus = Field(default=CaseStatus.NOT_RUN)
    is_auto_created: bool = Field(default=False)
    priority: SuitePriority = Field(default=SuitePriority.MEDIUM)
    execution_type: CaseExecutionType = Field(default=CaseExecutionType.MANUAL)
    script_path: Optional[str] = None
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)


class TestRun(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    test_case_id: int = Field(foreign_key="testcase.id", index=True)
    executed_by: Optional[int] = Field(default=None, foreign_key="user.id")
    result: RunResult
    build_version: str = ""
    environment_id: Optional[int] = Field(default=None, foreign_key="environment.id")
    error_note: Optional[str] = None
    bug_ticket_link: Optional[str] = None
    retry_of_run_id: Optional[int] = Field(default=None, foreign_key="testrun.id")
    duration_ms: Optional[int] = None
    executed_at: datetime = Field(default_factory=utcnow)


class Requirement(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    product_id: int = Field(foreign_key="product.id", index=True)
    title: str
    description: str = ""
    created_at: datetime = Field(default_factory=utcnow)


class RequirementCoverage(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    requirement_id: int = Field(foreign_key="requirement.id")
    test_case_id: int = Field(foreign_key="testcase.id")


class Environment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    product_id: int = Field(foreign_key="product.id", index=True)
    name: str
    device_info: Optional[str] = None


class Comment(SQLModel, table=True):
    """Phase 2, tạm chưa dùng."""

    id: Optional[int] = Field(default=None, primary_key=True)
    target_type: TargetType
    target_id: int
    author_id: int = Field(foreign_key="user.id")
    content: str
    mention_user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    is_hidden: bool = Field(default=False)
    created_at: datetime = Field(default_factory=utcnow)


class DeleteRequest(SQLModel, table=True):
    """Phase 2, tạm chưa dùng."""

    id: Optional[int] = Field(default=None, primary_key=True)
    target_type: TargetType
    target_id: int
    requested_by: int = Field(foreign_key="user.id")
    status: DeleteRequestStatus = Field(default=DeleteRequestStatus.PENDING)
    reviewed_by: Optional[int] = Field(default=None, foreign_key="user.id")
    created_at: datetime = Field(default_factory=utcnow)
    reviewed_at: Optional[datetime] = None


class ApiKey(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    product_id: int = Field(foreign_key="product.id", index=True)
    key: str = Field(unique=True, index=True)
    created_by: Optional[int] = Field(default=None, foreign_key="user.id")
    created_at: datetime = Field(default_factory=utcnow)


class ReportExport(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    product_id: int = Field(foreign_key="product.id", index=True)
    scope: str
    format: ReportFormat
    exported_by: Optional[int] = Field(default=None, foreign_key="user.id")
    exported_at: datetime = Field(default_factory=utcnow)
    file_path: Optional[str] = None
