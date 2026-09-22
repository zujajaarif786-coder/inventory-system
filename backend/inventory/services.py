from django.core.exceptions import PermissionDenied, ValidationError
from django.db import transaction

from products.models import Product
from .models import InventoryTransaction


def _is_super_admin(user):
    return bool(user and user.is_authenticated and (getattr(user, "is_superuser", False) or getattr(user, "role", "") == "SUPER_ADMIN"))


def _get_product_for_user(product_id, user):
    try:
        product = Product.objects.select_for_update().select_related("client").get(id=product_id)
    except Product.DoesNotExist:
        raise
    if not _is_super_admin(user) and product.client_id != getattr(user, "client_id", None):
        raise PermissionDenied("You do not have access to this product.")
    return product


@transaction.atomic
def add_stock(product_id, quantity, user=None, reference_type="manual", reference_id=None, notes=""):
    if quantity <= 0:
        raise ValidationError("Quantity must be greater than zero.")
    product = _get_product_for_user(product_id, user) if user is not None else Product.objects.select_for_update().get(id=product_id)
    stock_before = product.stock_quantity
    stock_after = stock_before + quantity
    product.stock_quantity = stock_after
    product.save(update_fields=["stock_quantity", "updated_at"])
    return InventoryTransaction.objects.create(
        client=product.client, product=product, transaction_type="stock_in", quantity=quantity,
        stock_before=stock_before, stock_after=stock_after, reference_type=reference_type,
        reference_id=reference_id, notes=notes, created_by=user,
    )


@transaction.atomic
def remove_stock(product_id, quantity, user=None, reference_type="manual", reference_id=None, notes=""):
    if quantity <= 0:
        raise ValidationError("Quantity must be greater than zero.")
    product = _get_product_for_user(product_id, user) if user is not None else Product.objects.select_for_update().get(id=product_id)
    stock_before = product.stock_quantity
    if stock_before < quantity:
        raise ValidationError(f"Insufficient stock for {product.name}. Available: {stock_before}, requested: {quantity}.")
    stock_after = stock_before - quantity
    product.stock_quantity = stock_after
    product.save(update_fields=["stock_quantity", "updated_at"])
    return InventoryTransaction.objects.create(
        client=product.client, product=product, transaction_type="stock_out", quantity=-quantity,
        stock_before=stock_before, stock_after=stock_after, reference_type=reference_type,
        reference_id=reference_id, notes=notes, created_by=user,
    )


@transaction.atomic
def adjust_stock(product_id, new_quantity, user=None, notes=""):
    if new_quantity < 0:
        raise ValidationError("Stock quantity cannot be negative.")
    product = _get_product_for_user(product_id, user) if user is not None else Product.objects.select_for_update().get(id=product_id)
    stock_before = product.stock_quantity
    product.stock_quantity = new_quantity
    product.save(update_fields=["stock_quantity", "updated_at"])
    difference = new_quantity - stock_before
    return InventoryTransaction.objects.create(
        client=product.client, product=product, transaction_type="adjustment", quantity=difference,
        stock_before=stock_before, stock_after=new_quantity, notes=notes, created_by=user,
    )
