from django.contrib import admin
from .models import Customer


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "contact_person",
        "email",
        "phone",
        "city",
        "country",
        "is_active",
        "updated_at",
    )

    list_filter = (
        "is_active",
        "country",
        "city",
    )

    search_fields = (
        "name",
        "contact_person",
        "email",
        "phone",
        "tax_number",
    )

    ordering = ("name",)

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    fieldsets = (
        (
            "Customer Information",
            {
                "fields": (
                    "name",
                    "contact_person",
                    "email",
                    "phone",
                )
            },
        ),
        (
            "Address",
            {
                "fields": (
                    "address",
                    "city",
                    "country",
                )
            },
        ),
        (
            "Business Information",
            {
                "fields": (
                    "tax_number",
                    "notes",
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