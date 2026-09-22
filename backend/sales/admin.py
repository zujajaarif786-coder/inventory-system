from django.contrib import admin, messages
from django.core.exceptions import ValidationError

from .models import Sale, SaleItem
from .services import complete_sale


class SaleItemInline(admin.TabularInline):
    model = SaleItem
    extra = 1


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = (
        "invoice_number",
        "customer",
        "sale_date",
        "status",
        "subtotal",
        "tax",
        "discount",
        "total_amount",
        "created_by",
    )

    list_filter = (
        "status",
        "sale_date",
    )

    search_fields = (
        "invoice_number",
        "customer__name",
    )

    readonly_fields = (
        "sale_date",
        "created_at",
        "updated_at",
    )

    inlines = [
        SaleItemInline,
    ]

    actions = [
        "complete_selected_sales",
    ]

    @admin.action(description="Complete selected sales and deduct stock")
    def complete_selected_sales(self, request, queryset):

        completed = 0

        for sale in queryset:

            try:
                complete_sale(
                    sale=sale,
                    user=request.user,
                )

                completed += 1

            except ValidationError as e:

                self.message_user(
                    request,
                    f"{sale.invoice_number}: {e}",
                    level=messages.ERROR,
                )

            except Exception as e:

                self.message_user(
                    request,
                    f"{sale.invoice_number}: {e}",
                    level=messages.ERROR,
                )

        if completed:
            self.message_user(
                request,
                f"{completed} sale(s) completed successfully. "
                f"Inventory stock has been deducted.",
                level=messages.SUCCESS,
            )


@admin.register(SaleItem)
class SaleItemAdmin(admin.ModelAdmin):

    list_display = (
        "sale",
        "product",
        "quantity",
        "unit_price",
        "discount",
        "total",
    )

    search_fields = (
        "sale__invoice_number",
        "product__name",
        "product__sku",
    )