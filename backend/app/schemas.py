from typing import Optional

from pydantic import BaseModel

from app.models import RunResult


class AutomationCaseResult(BaseModel):
    title: str
    result: RunResult
    durationMs: int = 0
    errorMessage: Optional[str] = None
    buildVersion: str = ""
    environmentName: Optional[str] = None


class AutomationResultsPayload(BaseModel):
    suiteName: str
    testTypeName: str
    cases: list[AutomationCaseResult]


class IngestSummary(BaseModel):
    suiteId: int
    suiteCreated: bool
    casesCreated: int
    casesUpdated: int
    runsCreated: int
