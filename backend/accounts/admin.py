from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):

    fieldsets = UserAdmin.fieldsets + (
        (
            "StockMaster Information",
            {
                "fields": (
                    "role",
                    "phone",
                    "client",
                )
            }
        ),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        (
            "StockMaster Information",
            {
                "fields": (
                    "role",
                    "phone",
                    "client",
                )
            }
        ),
    )

    list_display = (
        "username",
        "email",
        "first_name",
        "last_name",
        "role",
        "client",
        "is_active",
        "is_staff",
    )

    list_filter = (
        "role",
        "client",
        "is_active",
        "is_staff",
    )

    search_fields = (
        "username",
        "email",
        "first_name",
        "last_name",
        "client__name",
        "client__code",
    )