from django.contrib import admin
from .models import InventoryTransaction


@admin.register(InventoryTransaction)
class InventoryTransactionAdmin(admin.ModelAdmin):

    list_display = (
        "product",
        "transaction_type",
        "quantity",
        "stock_before",
        "stock_after",
        "reference_type",
        "reference_id",
        "created_by",
        "created_at",
    )

    list_filter = (
        "transaction_type",
        "reference_type",
        "created_at",
    )

    search_fields = (
        "product__name",
        "product__sku",
        "notes",
    )

    readonly_fields = (
        "created_at",
    )

    ordering = (
        "-created_at",
    )