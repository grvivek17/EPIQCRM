"""
Indian GST calculation logic.
- Seller state == Buyer state  →  CGST (9%) + SGST (9%)
- Seller state != Buyer state  →  IGST (18%)
"""

COMPANY_STATE = "Maharashtra"   # override via env

INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
]

GST_RATE = 18.0


def calculate_gst(subtotal: float, client_state: str, company_state: str = COMPANY_STATE):
    """Returns (gst_type, gst_rate, gst_amount, total)."""
    if client_state and client_state.strip().lower() == company_state.strip().lower():
        gst_type = "CGST+SGST"
    else:
        gst_type = "IGST"

    gst_amount = round(subtotal * GST_RATE / 100, 2)
    total = round(subtotal + gst_amount, 2)
    return gst_type, GST_RATE, gst_amount, total


def get_states():
    return INDIAN_STATES
