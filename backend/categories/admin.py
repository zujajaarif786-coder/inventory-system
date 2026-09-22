from django.contrib import admin

from .models import Category


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "client",
        "is_active",
        "created_by",
        "created_at",
        "updated_at",
    )

    list_filter = (
        "client",
        "is_active",
        "created_at",
    )

    search_fields = (
        "name",
        "description",
        "client__name",
        "client__code",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    ordering = (
        "client",
        "name",
    )