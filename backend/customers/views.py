import json

from django.db import IntegrityError
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from accounts.permissions import ensure_role, require_login
from clients.models import Client
from .models import Customer


def _is_super_admin(user):
    return bool(getattr(user, "is_superuser", False) or getattr(user, "role", "") == "SUPER_ADMIN")


def _customer_queryset(user):
    qs = Customer.objects.select_related("client")
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


def _serialize_customer(customer):
    return {
        "id": customer.id, "client_id": customer.client_id,
        "client_name": customer.client.name if customer.client_id else "",
        "name": customer.name, "contact_person": customer.contact_person,
        "email": customer.email, "phone": customer.phone,
        "address": customer.address, "city": customer.city,
        "country": customer.country, "tax_number": customer.tax_number,
        "notes": customer.notes, "is_active": customer.is_active,
        "created_at": customer.created_at.isoformat(),
        "updated_at": customer.updated_at.isoformat(),
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
def customers_api(request):
    if request.method == "GET":
        customers = _customer_queryset(request.user).order_by("name")
        search = request.GET.get("search", "").strip()
        if search:
            from django.db.models import Q
            customers = customers.filter(Q(name__icontains=search) | Q(contact_person__icontains=search) | Q(email__icontains=search) | Q(phone__icontains=search))
        data = [_serialize_customer(customer) for customer in customers]
        return JsonResponse({"success": True, "count": len(data), "customers": data})

    denied = ensure_role(request, "CLIENT_ADMIN", "MANAGER")
    if denied:
        return denied
    payload = _payload(request)
    if payload is None:
        return JsonResponse({"success": False, "error": "Invalid JSON request."}, status=400)
    name = str(payload.get("name", "")).strip()
    if not name:
        return JsonResponse({"success": False, "error": "Customer name is required."}, status=400)
    client = _client_for_write(request.user, payload)
    if not client:
        return JsonResponse({"success": False, "error": "A valid active client_id is required."}, status=400 if _is_super_admin(request.user) else 403)
    if Customer.objects.filter(client_id=client.id, name__iexact=name).exists():
        return JsonResponse({"success": False, "error": "A customer with this name already exists for this client."}, status=409)
    try:
        customer = Customer.objects.create(
            client=client, name=name,
            contact_person=str(payload.get("contact_person", "")).strip(), email=str(payload.get("email", "")).strip(),
            phone=str(payload.get("phone", "")).strip(), address=str(payload.get("address", "")).strip(),
            city=str(payload.get("city", "")).strip(), country=str(payload.get("country", "")).strip(),
            tax_number=str(payload.get("tax_number", "")).strip(), notes=str(payload.get("notes", "")).strip(), is_active=True,
        )
    except IntegrityError:
        return JsonResponse({"success": False, "error": "A customer with this name already exists for this client."}, status=409)
    return JsonResponse({"success": True, "message": "Customer created successfully.", "customer": _serialize_customer(customer)}, status=201)


@csrf_exempt
@require_login
@require_http_methods(["GET", "PUT", "PATCH", "DELETE"])
def customer_detail_api(request, customer_id):
    customer = get_object_or_404(_customer_queryset(request.user), id=customer_id)
    if request.method == "GET":
        return JsonResponse({"success": True, "customer": _serialize_customer(customer)})

    denied = ensure_role(request, "CLIENT_ADMIN", "MANAGER")
    if denied:
        return denied
    if request.method == "DELETE":
        customer.is_active = False
        customer.save(update_fields=["is_active", "updated_at"])
        return JsonResponse({"success": True, "message": "Customer deactivated successfully."})

    payload = _payload(request)
    if payload is None:
        return JsonResponse({"success": False, "error": "Invalid JSON request."}, status=400)
    if "name" in payload:
        name = str(payload["name"]).strip()
        if not name:
            return JsonResponse({"success": False, "error": "Customer name cannot be empty."}, status=400)
        if Customer.objects.filter(client_id=customer.client_id, name__iexact=name).exclude(id=customer.id).exists():
            return JsonResponse({"success": False, "error": "A customer with this name already exists for this client."}, status=409)
        customer.name = name
    for field in ["contact_person", "email", "phone", "address", "city", "country", "tax_number", "notes"]:
        if field in payload:
            setattr(customer, field, str(payload[field] if payload[field] is not None else "").strip())
    if "is_active" in payload:
        customer.is_active = bool(payload["is_active"])
    customer.save()
    return JsonResponse({"success": True, "customer": _serialize_customer(customer)})
