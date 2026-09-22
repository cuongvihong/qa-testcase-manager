from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.db import get_session
from app.models import Environment

router = APIRouter(tags=["environments"])


@router.get("/api/products/{product_id}/environments", response_model=list[Environment])
def list_environments(product_id: int, session: Session = Depends(get_session)):
    return session.exec(select(Environment).where(Environment.product_id == product_id)).all()


@router.post("/api/environments", response_model=Environment)
def create_environment(env: Environment, session: Session = Depends(get_session)):
    env.id = None
    session.add(env)
    session.commit()
    session.refresh(env)
    return env


@router.put("/api/environments/{environment_id}", response_model=Environment)
def update_environment(environment_id: int, patch: Environment, session: Session = Depends(get_session)):
    env = session.get(Environment, environment_id)
    if env is None:
        raise HTTPException(status_code=404, detail="Environment not found")
    env.name = patch.name
    env.device_info = patch.device_info
    session.add(env)
    session.commit()
    session.refresh(env)
    return env
