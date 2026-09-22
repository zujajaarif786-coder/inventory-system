from django.db import models


class Supplier(models.Model):

    client = models.ForeignKey(
        "clients.Client",
        on_delete=models.CASCADE,
        related_name="suppliers",
        null=True,
        blank=True,
    )

    name = models.CharField(max_length=200)

    contact_person = models.CharField(
        max_length=150,
        blank=True
    )

    email = models.EmailField(blank=True)

    phone = models.CharField(
        max_length=50,
        blank=True
    )

    address = models.TextField(blank=True)

    city = models.CharField(
        max_length=100,
        blank=True
    )

    country = models.CharField(
        max_length=100,
        blank=True
    )

    tax_number = models.CharField(
        max_length=100,
        blank=True
    )

    notes = models.TextField(blank=True)

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

        constraints = [
            models.UniqueConstraint(
                fields=["client", "name"],
                name="unique_supplier_per_client",
            )
        ]

    def __str__(self):
        return self.name