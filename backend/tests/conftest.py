import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.db import get_session
from app.main import app
from app.models import ApiKey, Product, TestSuite, TestType


@pytest.fixture
def session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as s:
        yield s


@pytest.fixture
def client(session):
    def override_get_session():
        yield session

    app.dependency_overrides[get_session] = override_get_session
    # Cố tình KHÔNG dùng `with TestClient(app) as c:` — dạng context manager sẽ kích
    # hoạt lifespan startup thật (init_db + seed) chạy trên app.db.engine THẬT (file
    # data/app.db), không phải DB tạm override ở trên, có thể đụng độ với server
    # thật đang chạy nền. Không dùng context manager thì lifespan không tự chạy.
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def product(session):
    p = Product(name="Website Ban Hang")
    session.add(p)
    session.commit()
    session.refresh(p)
    return p


@pytest.fixture
def test_type(session):
    t = TestType(name="UI Test")
    session.add(t)
    session.commit()
    session.refresh(t)
    return t


@pytest.fixture
def suite(session, product, test_type):
    s = TestSuite(product_id=product.id, test_type_id=test_type.id, name="Bo test dang nhap")
    session.add(s)
    session.commit()
    session.refresh(s)
    return s


@pytest.fixture
def api_key(session, product):
    key = ApiKey(product_id=product.id, key="test-key-123")
    session.add(key)
    session.commit()
    session.refresh(key)
    return key
