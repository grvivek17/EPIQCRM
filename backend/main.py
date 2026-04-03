from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
import os
from dotenv import load_dotenv

from database import engine, get_db, Base
import models
from schemas import DashboardStats, EmailRequest
from routers import clients, rate_cards, invoices
from email_service import send_invoice_email
from gst import get_states

load_dotenv()

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Posan CRM API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(clients.router, prefix="/api")
app.include_router(rate_cards.router, prefix="/api")
app.include_router(invoices.router, prefix="/api")


@app.get("/api/states")
def list_states():
    return get_states()


@app.get("/api/dashboard", response_model=DashboardStats)
def get_dashboard(db: Session = Depends(get_db)):
    total_clients = db.query(models.Client).count()
    total_invoices = db.query(models.Invoice).count()

    today = date.today()

    # Mark overdue automatically
    db.query(models.Invoice).filter(
        models.Invoice.status == "due",
        models.Invoice.due_date < today
    ).update({"status": "overdue"})
    db.commit()

    paid = db.query(func.sum(models.Invoice.total)).filter(
        models.Invoice.status == "paid"
    ).scalar() or 0.0

    due = db.query(func.sum(models.Invoice.total)).filter(
        models.Invoice.status.in_(["due", "overdue"])
    ).scalar() or 0.0

    overdue_count = db.query(models.Invoice).filter(
        models.Invoice.status == "overdue"
    ).count()

    return DashboardStats(
        total_clients=total_clients,
        total_invoices=total_invoices,
        total_due=round(due, 2),
        total_paid=round(paid, 2),
        overdue_count=overdue_count,
    )


@app.post("/api/invoices/send-email")
async def send_email_endpoint(payload: EmailRequest, db: Session = Depends(get_db)):
    invoice = db.query(models.Invoice).filter(models.Invoice.id == payload.invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    body_html = f"""
    <html><body>
    <p>{payload.message}</p>
    <br/>
    <p>Invoice Number: <strong>{invoice.invoice_number}</strong></p>
    <p>Total Amount: <strong>₹{invoice.total:,.2f}</strong></p>
    <p>Due Date: <strong>{invoice.due_date}</strong></p>
    </body></html>
    """
    try:
        await send_invoice_email(payload.to_email, payload.subject, body_html)
        return {"message": "Email sent successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Email failed: {str(e)}")


@app.get("/api/health")
def health():
    return {"status": "ok"}


# Seed default rate card if empty
@app.on_event("startup")
def seed_default_data():
    from database import SessionLocal
    db = SessionLocal()
    try:
        if db.query(models.DefaultRateCardItem).count() == 0:
            defaults = [
                models.DefaultRateCardItem(name="Junior Developer", unit="per month", rate=35000.0, category="Development"),
                models.DefaultRateCardItem(name="Senior Developer", unit="per month", rate=65000.0, category="Development"),
                models.DefaultRateCardItem(name="UI/UX Designer", unit="per month", rate=45000.0, category="Design"),
                models.DefaultRateCardItem(name="Project Manager", unit="per month", rate=70000.0, category="Management"),
                models.DefaultRateCardItem(name="QA Engineer", unit="per month", rate=40000.0, category="Quality"),
                models.DefaultRateCardItem(name="DevOps Engineer", unit="per month", rate=75000.0, category="Infrastructure"),
                models.DefaultRateCardItem(name="Business Analyst", unit="per month", rate=55000.0, category="Analysis"),
            ]
            db.add_all(defaults)
            db.commit()
    finally:
        db.close()
