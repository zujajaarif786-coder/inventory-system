import json
from urllib.parse import urljoin

from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import send_mail
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from .models import PasswordResetToken, User


def _get_request_data(request):
    if "application/json" in request.META.get("CONTENT_TYPE", ""):
        try:
            return json.loads(request.body or "{}")
        except json.JSONDecodeError:
            return None
    return request.POST


def _safe_password_reset_response():
    return JsonResponse(
        {"success": True, "message": "If that account exists, a reset email has been sent."},
        status=200,
    )


@csrf_exempt
@require_POST
def login_view(request):
    data = _get_request_data(request)
    if data is None:
        return JsonResponse({"success": False, "error": "Invalid JSON."}, status=400)

    email = str(data.get("email", "")).strip()
    password = str(data.get("password", ""))
    if not email:
        return JsonResponse({"success": False, "error": "Email is required."}, status=400)
    if not password:
        return JsonResponse({"success": False, "error": "Password is required."}, status=400)

    try:
        user = User.objects.select_related("client").get(email__iexact=email)
    except User.DoesNotExist:
        return JsonResponse({"success": False, "error": "Invalid email or password."}, status=401)

    authenticated_user = authenticate(request, username=user.username, password=password)
    if authenticated_user is None:
        return JsonResponse({"success": False, "error": "Invalid email or password."}, status=401)
    if not authenticated_user.is_active:
        return JsonResponse({"success": False, "error": "This account is inactive."}, status=403)

    login(request, authenticated_user)
    return JsonResponse({
        "success": True,
        "message": "Login successful.",
        "user": {
            "id": authenticated_user.id,
            "username": authenticated_user.username,
            "email": authenticated_user.email,
            "role": authenticated_user.role,
            "client_id": authenticated_user.client_id,
            "client_name": authenticated_user.client.name if authenticated_user.client_id else None,
        },
    })


@csrf_exempt
@require_POST
def forgot_password_view(request):
    data = _get_request_data(request)
    if data is None:
        return JsonResponse({"success": False, "error": "Invalid JSON."}, status=400)

    email = str(data.get("email", "") or "").strip().lower()
    if not email:
        return JsonResponse({"success": False, "error": "Email is required."}, status=400)

    user = User.objects.filter(email__iexact=email).first()
    if user is not None and user.is_active:
        raw_token, _ = PasswordResetToken.create_for_user(user)
        reset_url = urljoin(
            settings.FRONTEND_BASE_URL or "http://127.0.0.1:5500/",
            f"reset-password.html?token={raw_token}",
        )
        send_mail(
            subject="StockMaster password reset",
            message=(
                f"Use the following link to reset your password: {reset_url}\n\n"
                "This link expires in 60 minutes."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )

    return _safe_password_reset_response()


@csrf_exempt
@require_POST
def reset_password_view(request):
    data = _get_request_data(request)
    if data is None:
        return JsonResponse({"success": False, "error": "Invalid JSON."}, status=400)

    token = str(data.get("token", "") or "").strip()
    password = str(data.get("password", "") or "")

    if not token:
        return JsonResponse({"success": False, "error": "Token is required."}, status=400)
    if not password:
        return JsonResponse({"success": False, "error": "Password is required."}, status=400)

    reset_token = PasswordResetToken.find_valid_token(token)
    if reset_token is None:
        return JsonResponse({"success": False, "error": "This reset link is invalid or has expired."}, status=400)

    try:
        validate_password(password, user=reset_token.user)
    except DjangoValidationError as exc:
        return JsonResponse({"success": False, "error": exc.messages[0]}, status=400)

    reset_token.user.set_password(password)
    reset_token.user.save(update_fields=["password"])
    reset_token.used_at = timezone.now()
    reset_token.save(update_fields=["used_at"])

    PasswordResetToken.objects.filter(user=reset_token.user, used_at__isnull=True).update(used_at=timezone.now())

    return JsonResponse({"success": True, "message": "Password reset successfully."}, status=200)


@csrf_exempt
@require_POST
def logout_view(request):
    logout(request)
    return JsonResponse({"success": True, "message": "Logged out successfully."})


@require_GET
def current_user(request):
    if not request.user.is_authenticated:
        return JsonResponse({"authenticated": False})

    user = request.user
    return JsonResponse({
        "authenticated": True,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role,
            "client_id": user.client_id,
        },
    })
