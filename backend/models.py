from sqlalchemy import Column, Integer, String, Float, Date, Text, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    spoc_name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String)
    address = Column(Text)
    state = Column(String)
    gst_number = Column(String)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    invoices = relationship("Invoice", back_populates="client", cascade="all, delete-orphan")
    rate_card_items = relationship("ClientRateCardItem", back_populates="client", cascade="all, delete-orphan")


class DefaultRateCardItem(Base):
    __tablename__ = "default_rate_card_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    unit = Column(String, default="per month")
    rate = Column(Float, nullable=False)
    category = Column(String, default="General")
    created_at = Column(DateTime, server_default=func.now())


class ClientRateCardItem(Base):
    __tablename__ = "client_rate_card_items"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    name = Column(String, nullable=False)
    unit = Column(String, default="per month")
    rate = Column(Float, nullable=False)
    category = Column(String, default="General")
    created_at = Column(DateTime, server_default=func.now())

    client = relationship("Client", back_populates="rate_card_items")


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String, unique=True, nullable=False)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    invoice_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=False)
    notes = Column(Text)
    subtotal = Column(Float, default=0.0)
    gst_type = Column(String, default="IGST")   # IGST or CGST+SGST
    gst_rate = Column(Float, default=18.0)
    gst_amount = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
    status = Column(String, default="due")      # due | paid | overdue
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    client = relationship("Client", back_populates="invoices")
    line_items = relationship("InvoiceLineItem", back_populates="invoice", cascade="all, delete-orphan")


class InvoiceLineItem(Base):
    __tablename__ = "invoice_line_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    description = Column(String, nullable=False)
    unit = Column(String, default="per month")
    quantity = Column(Float, default=1.0)
    rate = Column(Float, nullable=False)
    amount = Column(Float, nullable=False)

    invoice = relationship("Invoice", back_populates="line_items")
