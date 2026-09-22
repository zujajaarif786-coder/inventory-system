from datetime import timedelta

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):

    ROLE_CHOICES = [
        ("SUPER_ADMIN", "Super Admin"),
        ("CLIENT_ADMIN", "Client Admin"),
        ("MANAGER", "Manager"),
        ("STAFF", "Staff"),
    ]

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="STAFF"
    )

    phone = models.CharField(
        max_length=30,
        blank=True
    )

    client = models.ForeignKey(
        "clients.Client",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users"
    )

    is_active = models.BooleanField(
        default=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return f"{self.username} - {self.get_role_display()}"


class PasswordResetToken(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="password_reset_tokens",
    )
    token_hash = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "used_at", "expires_at"]),
            models.Index(fields=["token_hash"]),
        ]

    @property
    def is_valid(self):
        return self.used_at is None and self.expires_at > timezone.now()

    def __str__(self):
        return f"Password reset token for {self.user.email or self.user.username}"

    @staticmethod
    def create_for_user(user, expires_in_minutes=60):
        now = timezone.now()
        user.password_reset_tokens.filter(
            used_at__isnull=True,
            expires_at__gt=now,
        ).update(used_at=now)

        token = None
        while token is None or PasswordResetToken.objects.filter(token_hash=token).exists():
            token = __import__("secrets").token_urlsafe(32)

        reset_token = PasswordResetToken.objects.create(
            user=user,
            token_hash=__import__("django.contrib.auth.hashers").contrib.auth.hashers.make_password(token),
            expires_at=now + timedelta(minutes=expires_in_minutes),
        )
        return token, reset_token

    @staticmethod
    def find_valid_token(raw_token):
        now = timezone.now()
        for token in PasswordResetToken.objects.filter(
            used_at__isnull=True,
            expires_at__gt=now,
        ).select_related("user"):
            if __import__("django.contrib.auth.hashers").contrib.auth.hashers.check_password(raw_token, token.token_hash):
                return token
        return None