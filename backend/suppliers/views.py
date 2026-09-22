import json

from django.db import IntegrityError
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from accounts.permissions import ensure_role, require_login
from clients.models import Client
from .models import Supplier


def _is_super_admin(user):
    return bool(getattr(user, "is_superuser", False) or getattr(user, "role", "") == "SUPER_ADMIN")


def _supplier_queryset(user):
    qs = Supplier.objects.select_related("client")
    if _is_super_admin(user):
        return qs
    if getattr(user, "client_id", None):
        return qs.filter(client_id=user.client_id)
    return qs.none()


def _payload(request):
    try:
        return json.loads(request.body or "{}")
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None


def _serialize_supplier(supplier):
    return {
        "id": supplier.id, "client_id": supplier.client_id,
        "client_name": supplier.client.name if supplier.client_id else "",
        "name": supplier.name, "contact_person": supplier.contact_person,
        "email": supplier.email, "phone": supplier.phone,
        "address": supplier.address, "city": supplier.city,
        "country": supplier.country, "tax_number": supplier.tax_number,
        "notes": supplier.notes, "is_active": supplier.is_active,
        "created_at": supplier.created_at.isoformat(),
        "updated_at": supplier.updated_at.isoformat(),
    }


def _client_for_write(user, payload):
    if _is_super_admin(user):
        try:
            return Client.objects.get(id=int(payload.get("client_id")), is_active=True)
        except (TypeError, ValueError, Client.DoesNotExist):
            return None
    return Client.objects.filter(id=user.client_id, is_active=True).first()


@csrf_exempt
@require_login
@require_http_methods(["GET", "POST"])
def suppliers_api(request):
    if request.method == "GET":
        suppliers = _supplier_queryset(request.user).order_by("name")
        search = request.GET.get("search", "").strip()
        if search:
            from django.db.models import Q
            suppliers = suppliers.filter(Q(name__icontains=search) | Q(contact_person__icontains=search) | Q(email__icontains=search) | Q(phone__icontains=search))
        data = [_serialize_supplier(supplier) for supplier in suppliers]
        return JsonResponse({"success": True, "count": len(data), "suppliers": data})

    denied = ensure_role(request, "CLIENT_ADMIN", "MANAGER")
    if denied:
        return denied
    payload = _payload(request)
    if payload is None:
        return JsonResponse({"success": False, "error": "Invalid JSON request."}, status=400)
    name = str(payload.get("name", "")).strip()
    if not name:
        return JsonResponse({"success": False, "error": "Supplier name is required."}, status=400)
    client = _client_for_write(request.user, payload)
    if not client:
        return JsonResponse({"success": False, "error": "A valid active client_id is required."}, status=400 if _is_super_admin(request.user) else 403)
    if Supplier.objects.filter(client_id=client.id, name__iexact=name).exists():
        return JsonResponse({"success": False, "error": "A supplier with this name already exists for this client."}, status=409)
    try:
        supplier = Supplier.objects.create(
            client=client, name=name,
            contact_person=str(payload.get("contact_person", "")).strip(),
            email=str(payload.get("email", "")).strip(), phone=str(payload.get("phone", "")).strip(),
            address=str(payload.get("address", "")).strip(), city=str(payload.get("city", "")).strip(),
            country=str(payload.get("country", "")).strip(), tax_number=str(payload.get("tax_number", "")).strip(),
            notes=str(payload.get("notes", "")).strip(), is_active=True,
        )
    except IntegrityError:
        return JsonResponse({"success": False, "error": "A supplier with this name already exists for this client."}, status=409)
    return JsonResponse({"success": True, "message": "Supplier created successfully.", "supplier": _serialize_supplier(supplier)}, status=201)


@csrf_exempt
@require_login
@require_http_methods(["GET", "PUT", "PATCH", "DELETE"])
def supplier_detail_api(request, supplier_id):
    supplier = get_object_or_404(_supplier_queryset(request.user), id=supplier_id)
    if request.method == "GET":
        return JsonResponse({"success": True, "supplier": _serialize_supplier(supplier)})

    denied = ensure_role(request, "CLIENT_ADMIN", "MANAGER")
    if denied:
        return denied
    if request.method == "DELETE":
        supplier.is_active = False
        supplier.save(update_fields=["is_active", "updated_at"])
        return JsonResponse({"success": True, "message": "Supplier deactivated successfully."})

    payload = _payload(request)
    if payload is None:
        return JsonResponse({"success": False, "error": "Invalid JSON request."}, status=400)
    if "name" in payload:
        name = str(payload["name"]).strip()
        if not name:
            return JsonResponse({"success": False, "error": "Supplier name cannot be empty."}, status=400)
        if Supplier.objects.filter(client_id=supplier.client_id, name__iexact=name).exclude(id=supplier.id).exists():
            return JsonResponse({"success": False, "error": "A supplier with this name already exists for this client."}, status=409)
        supplier.name = name
    for field in ["contact_person", "email", "phone", "address", "city", "country", "tax_number", "notes"]:
        if field in payload:
            setattr(supplier, field, str(payload[field] if payload[field] is not None else "").strip())
    if "is_active" in payload:
        supplier.is_active = bool(payload["is_active"])
    supplier.save()
    return JsonResponse({"success": True, "supplier": _serialize_supplier(supplier)})
