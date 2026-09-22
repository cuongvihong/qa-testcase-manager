from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from sqlmodel import Session

from app.db import engine, init_db
from app.routes import automation, cases, categories, environments, products, requirements, suites, test_types
from app.seed import seed


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    with Session(engine) as session:
        seed(session)
    yield


app = FastAPI(title="QA Test Case Manager", lifespan=lifespan)

app.include_router(products.router)
app.include_router(suites.router)
app.include_router(cases.router)
app.include_router(automation.router)
app.include_router(test_types.router)
app.include_router(environments.router)
app.include_router(categories.router)
app.include_router(requirements.router)

STATIC_DIR = Path(__file__).resolve().parent / "static"

if STATIC_DIR.exists():
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
