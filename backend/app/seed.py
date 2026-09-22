import secrets

from sqlmodel import Session, select

from app.models import FIXED_TEST_TYPES, ApiKey, Product, TestType, User


def seed(session: Session) -> None:
    """Idempotent — chỉ insert nếu bảng tương ứng đang rỗng."""

    if session.exec(select(User)).first() is None:
        session.add(User(username="admin", password="admin", display_name="QA Admin"))

    for name in FIXED_TEST_TYPES:
        if session.exec(select(TestType).where(TestType.name == name)).first() is None:
            session.add(TestType(name=name))

    session.commit()

    product = session.exec(select(Product).where(Product.name == "Curricula Trainer Account")).first()
    if product is None:
        product = Product(name="Curricula Trainer Account", description="Nguồn test AIQA (Playwright/pytest)")
        session.add(product)
        session.commit()
        session.refresh(product)

    api_key = session.exec(select(ApiKey).where(ApiKey.product_id == product.id)).first()
    if api_key is None:
        api_key = ApiKey(product_id=product.id, key=secrets.token_hex(24))
        session.add(api_key)
        session.commit()
        session.refresh(api_key)
        print(f"[seed] ApiKey moi cho Product '{product.name}': {api_key.key}")
    else:
        print(f"[seed] ApiKey hien co cho Product '{product.name}': {api_key.key}")
