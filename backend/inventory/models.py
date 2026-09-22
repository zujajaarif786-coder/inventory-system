from django.contrib.auth import get_user_model
from django.db import models

from products.models import Product


User = get_user_model()


class InventoryTransaction(models.Model):

    TRANSACTION_TYPES = [
        ("stock_in", "Stock In"),
        ("stock_out", "Stock Out"),
        ("adjustment", "Adjustment"),
    ]

    REFERENCE_TYPES = [
        ("purchase", "Purchase"),
        ("sale", "Sale"),
        ("manual", "Manual"),
    ]

    client = models.ForeignKey(
        "clients.Client",
        on_delete=models.CASCADE,
        related_name="inventory_transactions",
        null=True,
        blank=True,
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="inventory_transactions"
    )

    transaction_type = models.CharField(
        max_length=20,
        choices=TRANSACTION_TYPES
    )

    quantity = models.IntegerField()

    stock_before = models.IntegerField()

    stock_after = models.IntegerField()

    reference_type = models.CharField(
        max_length=20,
        choices=REFERENCE_TYPES,
        default="manual"
    )

    reference_id = models.PositiveIntegerField(
        null=True,
        blank=True
    )

    notes = models.TextField(
        blank=True
    )

    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="inventory_transactions"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        ordering = ["-created_at"]

        indexes = [
            models.Index(
                fields=["client", "-created_at"],
                name="inventory_client_created_idx",
            ),
            models.Index(
                fields=["product", "-created_at"],
                name="inventory_product_created_idx",
            ),
        ]

    def __str__(self):
        return (
            f"{self.product.name} - "
            f"{self.get_transaction_type_display()} - "
            f"{self.quantity}"
        )