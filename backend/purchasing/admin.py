from django.contrib import admin
from .models import PurchaseOrder, PurchaseOrderItem


class PurchaseOrderItemInline(admin.TabularInline):
    model = PurchaseOrderItem
    extra = 1
    fields = (
        "product",
        "quantity",
        "unit_cost",
        "received_quantity",
    )
    readonly_fields = ("received_quantity",)


@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = (
        "order_number",
        "supplier",
        "order_date",
        "expected_date",
        "status",
        "total_amount_display",
    )

    list_filter = (
        "status",
        "order_date",
        "expected_date",
    )

    search_fields = (
        "order_number",
        "supplier__name",
    )

    readonly_fields = (
        "order_date",
        "created_at",
        "updated_at",
    )

    inlines = [PurchaseOrderItemInline]

    ordering = ("-order_date",)

    def total_amount_display(self, obj):
        return obj.total_amount

    total_amount_display.short_description = "Total Amount"


@admin.register(PurchaseOrderItem)
class PurchaseOrderItemAdmin(admin.ModelAdmin):
    list_display = (
        "purchase_order",
        "product",
        "quantity",
        "received_quantity",
        "pending_quantity_display",
        "unit_cost",
        "total_price_display",
    )

    list_filter = (
        "purchase_order__status",
    )

    search_fields = (
        "purchase_order__order_number",
        "product__name",
    )

    def pending_quantity_display(self, obj):
        return obj.pending_quantity

    pending_quantity_display.short_description = "Pending"

    def total_price_display(self, obj):
        return obj.total_price

    total_price_display.short_description = "Total"