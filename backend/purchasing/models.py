from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models


class PurchaseOrder(models.Model):

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("ordered", "Ordered"),
        ("partial", "Partially Received"),
        ("received", "Received"),
        ("cancelled", "Cancelled"),
    ]

    client = models.ForeignKey(
        "clients.Client",
        on_delete=models.CASCADE,
        related_name="purchase_orders",
        null=True,
        blank=True,
    )

    order_number = models.CharField(
        max_length=50
    )

    supplier = models.ForeignKey(
        "suppliers.Supplier",
        on_delete=models.PROTECT,
        related_name="purchase_orders",
    )

    order_date = models.DateField(
        auto_now_add=True
    )

    expected_date = models.DateField(
        null=True,
        blank=True
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="draft",
    )

    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        ordering = ["-order_date", "-id"]

        constraints = [
            models.UniqueConstraint(
                fields=["client", "order_number"],
                name="unique_purchase_order_per_client",
            )
        ]

    @property
    def total_amount(self):
        return sum(
            item.total_price
            for item in self.items.all()
        ) or Decimal("0.00")

    def __str__(self):
        return f"{self.order_number} - {self.supplier}"


class PurchaseOrderItem(models.Model):

    purchase_order = models.ForeignKey(
        PurchaseOrder,
        on_delete=models.CASCADE,
        related_name="items",
    )

    product = models.ForeignKey(
        "products.Product",
        on_delete=models.PROTECT,
        related_name="purchase_items",
    )

    quantity = models.PositiveIntegerField(
        validators=[
            MinValueValidator(1)
        ]
    )

    unit_cost = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[
            MinValueValidator(
                Decimal("0.00")
            )
        ],
    )

    received_quantity = models.PositiveIntegerField(
        default=0
    )

    @property
    def total_price(self):
        return Decimal(self.quantity) * self.unit_cost

    @property
    def pending_quantity(self):
        return max(
            self.quantity - self.received_quantity,
            0
        )

    def __str__(self):
        return (
            f"{self.purchase_order.order_number} - "
            f"{self.product}"
        )