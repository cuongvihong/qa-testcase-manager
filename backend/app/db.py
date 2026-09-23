from pathlib import Path
from typing import Iterator

from sqlalchemy import text
from sqlmodel import Session, SQLModel, create_engine

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DATA_DIR / "app.db"

engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})

# create_all() only creates missing TABLES, it never ALTERs an existing one — this project has
# no Alembic, so new columns on an existing table need a manual, idempotent migration here.
# SQLAlchemy's Enum column stores the Python Enum MEMBER NAME (e.g. "MEDIUM"), not the str
# value ("Medium") — confirmed against the existing testsuite.priority column, which already
# stores "MEDIUM"/"HIGH"/"LOW". The DEFAULT literal here must match that or SQLAlchemy raises
# a LookupError when reading rows back through the ORM.
TESTCASE_NEW_COLUMNS = [
    ("priority", "VARCHAR(6) NOT NULL DEFAULT 'MEDIUM'"),
    ("execution_type", "VARCHAR(9) NOT NULL DEFAULT 'MANUAL'"),
    ("script_path", "VARCHAR"),
]


def init_db() -> None:
    SQLModel.metadata.create_all(engine)
    _migrate_testcase_columns()


def _migrate_testcase_columns() -> None:
    with engine.begin() as conn:
        existing = {row[1] for row in conn.execute(text("PRAGMA table_info(testcase)"))}
        for column, ddl in TESTCASE_NEW_COLUMNS:
            if column not in existing:
                conn.execute(text(f"ALTER TABLE testcase ADD COLUMN {column} {ddl}"))


def get_session() -> Iterator[Session]:
    with Session(engine) as session:
        yield session
