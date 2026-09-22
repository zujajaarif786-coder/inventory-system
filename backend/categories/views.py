import json

from django.db import IntegrityError
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils.text import slugify
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from accounts.permissions import ensure_role, require_login
from clients.models import Client
from .models import Category


def _payload(request):
    try:
        return json.loads(request.body or "{}")
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None


def _is_super_admin(user):
    return bool(getattr(user, "is_superuser", False) or getattr(user, "role", "") == "SUPER_ADMIN")


def _category_queryset(user):
    qs = Category.objects.select_related("client", "created_by").prefetch_related("products")
    if _is_super_admin(user):
        return qs
    if getattr(user, "client_id", None):
        return qs.filter(client_id=user.client_id)
    return qs.none()


def _serialize(category):
    return {
        "id": category.id,
        "name": category.name,
        "slug": slugify(category.name),
        "description": category.description,
        "is_active": category.is_active,
        "products_count": category.products.count(),
        "client_id": category.client_id,
        "client_name": category.client.name if category.client_id else "",
        "created_at": category.created_at.isoformat(),
        "updated_at": category.updated_at.isoformat(),
    }


@csrf_exempt
@require_login
@require_http_methods(["GET", "POST"])
def categories_list_create(request):
    if request.method == "GET":
        data = [_serialize(category) for category in _category_queryset(request.user)]
        return JsonResponse({"categories": data, "count": len(data)})

    denied = ensure_role(request, "CLIENT_ADMIN", "MANAGER")
    if denied:
        return denied

    payload = _payload(request)
    if payload is None:
        return JsonResponse({"error": "Invalid JSON."}, status=400)

    name = str(payload.get("name", "")).strip()
    description = str(payload.get("description", "")).strip()
    if not name:
        return JsonResponse({"error": "Category name is required."}, status=400)
    if len(name) > 150:
        return JsonResponse({"error": "Category name must be 150 characters or fewer."}, status=400)

    if _is_super_admin(request.user):
        client_id = payload.get("client_id")
        try:
            client = Client.objects.get(id=int(client_id), is_active=True)
        except (TypeError, ValueError, Client.DoesNotExist):
            return JsonResponse({"error": "A valid active client_id is required for Super Admin."}, status=400)
    else:
        client = Client.objects.filter(id=request.user.client_id, is_active=True).first()
        if not client:
            return JsonResponse({"error": "Your account is not assigned to an active client."}, status=403)

    try:
        category = Category.objects.create(client=client, name=name, description=description, created_by=request.user)
    except IntegrityError:
        return JsonResponse({"error": "A category with this name already exists for this client."}, status=409)

    return JsonResponse({"category": _serialize(category)}, status=201)


@csrf_exempt
@require_login
@require_http_methods(["GET", "PUT", "PATCH", "DELETE"])
def category_detail(request, category_id):
    category = get_object_or_404(_category_queryset(request.user), id=category_id)

    if request.method == "GET":
        return JsonResponse({"category": _serialize(category)})

    denied = ensure_role(request, "CLIENT_ADMIN", "MANAGER")
    if denied:
        return denied

    if request.method == "DELETE":
        category.is_active = False
        category.save(update_fields=["is_active", "updated_at"])
        return JsonResponse({"message": "Category deactivated successfully."})

    payload = _payload(request)
    if payload is None:
        return JsonResponse({"error": "Invalid JSON."}, status=400)

    name = str(payload.get("name", category.name)).strip()
    description = str(payload.get("description", category.description)).strip()
    if not name:
        return JsonResponse({"error": "Category name is required."}, status=400)
    if len(name) > 150:
        return JsonResponse({"error": "Category name must be 150 characters or fewer."}, status=400)

    if Category.objects.filter(client_id=category.client_id, name__iexact=name).exclude(id=category.id).exists():
        return JsonResponse({"error": "A category with this name already exists for this client."}, status=409)

    category.name = name
    category.description = description
    if "is_active" in payload:
        category.is_active = bool(payload["is_active"])
    category.save()
    return JsonResponse({"category": _serialize(category)})
