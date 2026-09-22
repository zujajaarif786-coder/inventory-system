from django.core.exceptions import PermissionDenied, ValidationError
from django.db import transaction

from inventory.services import remove_stock
from .models import Sale


def _is_super_admin(user):
    return bool(user and user.is_authenticated and (getattr(user, "is_superuser", False) or getattr(user, "role", "") == "SUPER_ADMIN"))


@transaction.atomic
def complete_sale(sale, user=None):
    if user is not None and not _is_super_admin(user) and sale.client_id != getattr(user, "client_id", None):
        raise PermissionDenied("You do not have access to this sale.")
    if sale.status == "completed":
        raise ValidationError("This sale has already been completed.")
    if sale.status == "cancelled":
        raise ValidationError("A cancelled sale cannot be completed.")

    items = list(sale.items.select_related("product").all())
    if not items:
        raise ValidationError("A sale must contain at least one item.")

    for item in items:
        if item.product.client_id != sale.client_id:
            raise ValidationError(f"Product {item.product.name} does not belong to this client.")
        if item.quantity <= 0:
            raise ValidationError("Sale quantity must be greater than zero.")

    for item in items:
        remove_stock(item.product_id, item.quantity, user, "sale", sale.id, f"Completed sale {sale.invoice_number}")

    sale.status = "completed"
    sale.save(update_fields=["status", "updated_at"])
    return sale
