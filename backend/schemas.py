from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime


# ── Clients ──────────────────────────────────────────────────────────────────
class ClientBase(BaseModel):
    name: str
    spoc_name: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    state: Optional[str] = None
    gst_number: Optional[str] = None


class ClientCreate(ClientBase):
    pass


class ClientUpdate(ClientBase):
    pass


class ClientOut(ClientBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Rate Card Items ───────────────────────────────────────────────────────────
class DefaultRateCardItemBase(BaseModel):
    name: str
    unit: Optional[str] = "per month"
    rate: float
    category: Optional[str] = "General"


class DefaultRateCardItemCreate(DefaultRateCardItemBase):
    pass


class DefaultRateCardItemOut(DefaultRateCardItemBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ClientRateCardItemBase(BaseModel):
    name: str
    unit: Optional[str] = "per month"
    rate: float
    category: Optional[str] = "General"


class ClientRateCardItemCreate(ClientRateCardItemBase):
    client_id: int


class ClientRateCardItemOut(ClientRateCardItemBase):
    id: int
    client_id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Invoice Line Items ────────────────────────────────────────────────────────
class LineItemBase(BaseModel):
    description: str
    unit: Optional[str] = "per month"
    quantity: float = 1.0
    rate: float
    amount: float


class LineItemCreate(LineItemBase):
    pass


class LineItemOut(LineItemBase):
    id: int

    class Config:
        from_attributes = True


# ── Invoices ──────────────────────────────────────────────────────────────────
class InvoiceBase(BaseModel):
    client_id: int
    invoice_date: date
    due_date: date
    notes: Optional[str] = None
    status: Optional[str] = "due"


class InvoiceCreate(InvoiceBase):
    line_items: List[LineItemCreate]


class InvoiceUpdate(BaseModel):
    status: Optional[str] = None
    due_date: Optional[date] = None
    notes: Optional[str] = None


class InvoiceOut(InvoiceBase):
    id: int
    invoice_number: str
    subtotal: float
    gst_type: str
    gst_rate: float
    gst_amount: float
    total: float
    created_at: Optional[datetime] = None
    line_items: List[LineItemOut] = []
    client: Optional[ClientOut] = None

    class Config:
        from_attributes = True


# ── Email ─────────────────────────────────────────────────────────────────────
class EmailRequest(BaseModel):
    invoice_id: int
    to_email: str
    subject: str
    message: str


# ── Dashboard ─────────────────────────────────────────────────────────────────
class DashboardStats(BaseModel):
    total_clients: int
    total_invoices: int
    total_due: float
    total_paid: float
    overdue_count: int
