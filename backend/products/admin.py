from django.contrib import admin
from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "sku",
        "category",
        "cost_price",
        "selling_price",
        "stock_quantity",
        "minimum_stock_level",
        "stock_status",
        "is_active",
        "updated_at",
    )

    list_filter = (
        "category",
        "is_active",
    )

    search_fields = (
        "name",
        "sku",
        "description",
    )

    ordering = ("name",)

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    fieldsets = (
        (
            "Product Information",
            {
                "fields": (
                    "name",
                    "sku",
                    "category",
                    "description",
                )
            },
        ),
        (
            "Pricing",
            {
                "fields": (
                    "cost_price",
                    "selling_price",
                )
            },
        ),
        (
            "Inventory",
            {
                "fields": (
                    "stock_quantity",
                    "minimum_stock_level",
                )
            },
        ),
        (
            "Status",
            {
                "fields": (
                    "is_active",
                    "created_at",
                    "updated_at",
                )
            },
        ),
    )

    def stock_status(self, obj):
        if obj.stock_quantity == 0:
            return "Out of Stock"

        if obj.is_low_stock:
            return "Low Stock"

        return "In Stock"

    stock_status.short_description = "Stock Status"