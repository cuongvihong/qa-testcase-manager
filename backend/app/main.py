from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from sqlmodel import Session

from app.db import engine, init_db
from app.routes import automation, cases, products, suites
from app.seed import seed

app = FastAPI(title="QA Test Case Manager")

app.include_router(products.router)
app.include_router(suites.router)
app.include_router(cases.router)
app.include_router(automation.router)

STATIC_DIR = Path(__file__).resolve().parent / "static"


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    with Session(engine) as session:
        seed(session)


if STATIC_DIR.exists():
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
