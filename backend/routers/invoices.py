from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import date
from database import get_db
from gst import calculate_gst
import models, schemas

router = APIRouter(prefix="/invoices", tags=["Invoices"])


def generate_invoice_number(db: Session) -> str:
    count = db.query(models.Invoice).count()
    return f"INV-{date.today().strftime('%Y%m')}-{str(count + 1).zfill(4)}"


@router.get("/", response_model=List[schemas.InvoiceOut])
def list_invoices(
    status: str = None,
    client_id: int = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.Invoice)
    if status:
        query = query.filter(models.Invoice.status == status)
    if client_id:
        query = query.filter(models.Invoice.client_id == client_id)
    return query.order_by(models.Invoice.created_at.desc()).all()


@router.get("/{invoice_id}", response_model=schemas.InvoiceOut)
def get_invoice(invoice_id: int, db: Session = Depends(get_db)):
    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice


@router.post("/", response_model=schemas.InvoiceOut, status_code=201)
def create_invoice(payload: schemas.InvoiceCreate, db: Session = Depends(get_db)):
    client = db.query(models.Client).filter(models.Client.id == payload.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    subtotal = sum(item.amount for item in payload.line_items)
    gst_type, gst_rate, gst_amount, total = calculate_gst(subtotal, client.state or "")

    invoice = models.Invoice(
        invoice_number=generate_invoice_number(db),
        client_id=payload.client_id,
        invoice_date=payload.invoice_date,
        due_date=payload.due_date,
        notes=payload.notes,
        subtotal=subtotal,
        gst_type=gst_type,
        gst_rate=gst_rate,
        gst_amount=gst_amount,
        total=total,
        status=payload.status or "due",
    )
    db.add(invoice)
    db.flush()

    for li in payload.line_items:
        db.add(models.InvoiceLineItem(invoice_id=invoice.id, **li.model_dump()))

    db.commit()
    db.refresh(invoice)
    return invoice


@router.patch("/{invoice_id}", response_model=schemas.InvoiceOut)
def update_invoice(invoice_id: int, payload: schemas.InvoiceUpdate, db: Session = Depends(get_db)):
    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(invoice, key, value)
    db.commit()
    db.refresh(invoice)
    return invoice


@router.delete("/{invoice_id}", status_code=204)
def delete_invoice(invoice_id: int, db: Session = Depends(get_db)):
    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    db.delete(invoice)
    db.commit()
