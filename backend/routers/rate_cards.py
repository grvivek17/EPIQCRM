from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas

router = APIRouter(prefix="/rate-cards", tags=["Rate Cards"])

# ── Default Rate Card ─────────────────────────────────────────────────────────

@router.get("/default", response_model=List[schemas.DefaultRateCardItemOut])
def list_default_items(db: Session = Depends(get_db)):
    return db.query(models.DefaultRateCardItem).all()


@router.post("/default", response_model=schemas.DefaultRateCardItemOut, status_code=201)
def create_default_item(payload: schemas.DefaultRateCardItemCreate, db: Session = Depends(get_db)):
    item = models.DefaultRateCardItem(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/default/{item_id}", response_model=schemas.DefaultRateCardItemOut)
def update_default_item(item_id: int, payload: schemas.DefaultRateCardItemCreate, db: Session = Depends(get_db)):
    item = db.query(models.DefaultRateCardItem).filter(models.DefaultRateCardItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    for key, value in payload.model_dump().items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/default/{item_id}", status_code=204)
def delete_default_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.DefaultRateCardItem).filter(models.DefaultRateCardItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()


# ── Client-specific Rate Card ─────────────────────────────────────────────────

@router.get("/client/{client_id}", response_model=List[schemas.ClientRateCardItemOut])
def list_client_items(client_id: int, db: Session = Depends(get_db)):
    return db.query(models.ClientRateCardItem).filter(
        models.ClientRateCardItem.client_id == client_id
    ).all()


@router.post("/client", response_model=schemas.ClientRateCardItemOut, status_code=201)
def create_client_item(payload: schemas.ClientRateCardItemCreate, db: Session = Depends(get_db)):
    item = models.ClientRateCardItem(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/client/{item_id}", response_model=schemas.ClientRateCardItemOut)
def update_client_item(item_id: int, payload: schemas.ClientRateCardItemCreate, db: Session = Depends(get_db)):
    item = db.query(models.ClientRateCardItem).filter(models.ClientRateCardItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    for key, value in payload.model_dump().items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/client/{item_id}", status_code=204)
def delete_client_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.ClientRateCardItem).filter(models.ClientRateCardItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
