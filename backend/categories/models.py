from django.conf import settings
from django.db import models


class Category(models.Model):

    client = models.ForeignKey(
        "clients.Client",
        on_delete=models.CASCADE,
        related_name="categories",
    )

    name = models.CharField(
        max_length=150,
    )

    description = models.TextField(
        blank=True,
    )

    is_active = models.BooleanField(
        default=True,
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_categories",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["client", "name"],
                name="unique_category_per_client",
            )
        ]

    def __str__(self):
        return f"{self.name} - {self.client.name}"