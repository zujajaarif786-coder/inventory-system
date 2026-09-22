import json
from decimal import Decimal, InvalidOperation

from django.db import transaction
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods, require_POST

from accounts.permissions import ensure_role, require_login
from products.models import Product
from suppliers.models import Supplier
from .models import PurchaseOrder, PurchaseOrderItem
from inventory.services import add_stock


def _is_super_admin(user):
    return bool(getattr(user, "is_superuser", False) or getattr(user, "role", "") == "SUPER_ADMIN")


def _json_body(request):
    if not request.body:
        return {}
    try:
        return json.loads(request.body.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None


def _purchase_queryset(user):
    qs = PurchaseOrder.objects.select_related("supplier", "client").prefetch_related("items__product")
    if _is_super_admin(user):
        return qs
    if getattr(user, "client_id", None):
        return qs.filter(client_id=user.client_id)
    return qs.none()


def _client_id_for_write(user, data):
    if _is_super_admin(user):
        value = data.get("client_id")
        try:
            return int(value)
        except (TypeError, ValueError):
            return None
    return user.client_id


def _serialize_purchase(purchase):
    return {
        "id": purchase.id,
        "order_number": purchase.order_number,
        "supplier": {"id": purchase.supplier_id, "name": purchase.supplier.name} if purchase.supplier else None,
        "client_id": purchase.client_id,
        "status": purchase.status,
        "order_date": purchase.order_date,
        "expected_date": purchase.expected_date,
        "notes": purchase.notes,
        "items": [
            {
                "id": item.id, "product_id": item.product_id, "product_name": item.product.name,
                "quantity": item.quantity, "received_quantity": item.received_quantity,
                "remaining_quantity": max(item.quantity - item.received_quantity, 0),
                "unit_cost": str(item.unit_cost),
            }
            for item in purchase.items.all()
        ],
    }


@require_login
@require_http_methods(["GET", "POST"])
def purchasing_list(request):
    if request.method == "GET":
        purchases = _purchase_queryset(request.user)
        return JsonResponse({"success": True, "count": purchases.count(), "results": [_serialize_purchase(p) for p in purchases]})

    denied = ensure_role(request, "CLIENT_ADMIN", "MANAGER")
    if denied:
        return denied
    data = _json_body(request)
    if data is None:
        return JsonResponse({"success": False, "error": "Invalid JSON request."}, status=400)

    client_id = _client_id_for_write(request.user, data)
    if not client_id:
        return JsonResponse({"success": False, "error": "A valid client_id is required."}, status=400)

    try:
        supplier_id = int(data.get("supplier_id"))
    except (TypeError, ValueError):
        return JsonResponse({"success": False, "error": "supplier_id is required."}, status=400)

    order_number = str(data.get("order_number", "")).strip()
    items = data.get("items", [])
    if not order_number:
        return JsonResponse({"success": False, "error": "order_number is required."}, status=400)
    if not isinstance(items, list) or not items:
        return JsonResponse({"success": False, "error": "At least one purchase item is required."}, status=400)

    try:
        supplier = Supplier.objects.get(id=supplier_id, client_id=client_id, is_active=True)
    except Supplier.DoesNotExist:
        return JsonResponse({"success": False, "error": "Supplier does not belong to this client."}, status=400)

    if PurchaseOrder.objects.filter(client_id=client_id, order_number=order_number).exists():
        return JsonResponse({"success": False, "error": "Order number already exists for this client."}, status=409)

    validated = []
    for raw in items:
        try:
            product_id = int(raw.get("product_id"))
            quantity = int(raw.get("quantity"))
            unit_cost = Decimal(str(raw.get("unit_cost", "0")))
        except (TypeError, ValueError, InvalidOperation, AttributeError):
            return JsonResponse({"success": False, "error": "Each item requires valid product_id, quantity and unit_cost."}, status=400)
        if quantity <= 0 or unit_cost < 0:
            return JsonResponse({"success": False, "error": "Quantity must be greater than zero and unit_cost cannot be negative."}, status=400)
        try:
            product = Product.objects.get(id=product_id, client_id=client_id, is_active=True)
        except Product.DoesNotExist:
            return JsonResponse({"success": False, "error": f"Product {product_id} does not belong to this client."}, status=400)
        validated.append((product, quantity, unit_cost))

    with transaction.atomic():
        purchase = PurchaseOrder.objects.create(client_id=client_id, supplier=supplier, order_number=order_number, status="draft", notes=str(data.get("notes", "")))
        PurchaseOrderItem.objects.bulk_create([
            PurchaseOrderItem(purchase_order=purchase, product=product, quantity=quantity, received_quantity=0, unit_cost=unit_cost)
            for product, quantity, unit_cost in validated
        ])

    return JsonResponse({"success": True, "message": "Purchase order created successfully.", "purchase": _serialize_purchase(_purchase_queryset(request.user).get(id=purchase.id))}, status=201)


@require_login
@require_http_methods(["GET"])
def purchasing_options(request):
    if _is_super_admin(request.user):
        suppliers = Supplier.objects.filter(is_active=True)
        products = Product.objects.filter(is_active=True)
    elif getattr(request.user, "client_id", None):
        suppliers = Supplier.objects.filter(is_active=True, client_id=request.user.client_id)
        products = Product.objects.filter(is_active=True, client_id=request.user.client_id)
    else:
        suppliers = Supplier.objects.none()
        products = Product.objects.none()
    return JsonResponse({
        "success": True,
        "suppliers": [{"id": s.id, "name": s.name, "client_id": s.client_id} for s in suppliers.order_by("name")],
        "products": [{"id": p.id, "name": p.name, "sku": p.sku, "stock_quantity": p.stock_quantity, "cost_price": str(p.cost_price), "client_id": p.client_id} for p in products.order_by("name")],
    })


@require_login
@require_http_methods(["GET"])
def purchasing_detail(request, purchase_id):
    purchase = _purchase_queryset(request.user).filter(id=purchase_id).first()
    if not purchase:
        return JsonResponse({"success": False, "error": "Purchase order not found."}, status=404)
    return JsonResponse({"success": True, "purchase": _serialize_purchase(purchase)})


@require_POST
@require_login
def purchasing_receive(request, purchase_id):
    denied = ensure_role(request, "CLIENT_ADMIN", "MANAGER")
    if denied:
        return denied
    purchase = _purchase_queryset(request.user).filter(id=purchase_id).first()
    if not purchase:
        return JsonResponse({"success": False, "error": "Purchase order not found."}, status=404)
    if purchase.status == "cancelled":
        return JsonResponse({"success": False, "error": "Cancelled purchase cannot be received."}, status=400)

    with transaction.atomic():
        items = list(purchase.items.select_related("product").select_for_update())
        received_any = False
        for item in items:
            remaining = item.quantity - item.received_quantity
            if remaining <= 0:
                continue
            if item.product.client_id != purchase.client_id:
                return JsonResponse({"success": False, "error": "Purchase item product does not belong to the purchase client."}, status=400)
            add_stock(item.product_id, remaining, request.user, "purchase", purchase.id, f"Received purchase {purchase.order_number}")
            item.received_quantity += remaining
            item.save(update_fields=["received_quantity"])
            received_any = True
        if not received_any:
            return JsonResponse({"success": False, "error": "All purchase items have already been received."}, status=400)
        purchase.status = "received"
        purchase.save(update_fields=["status", "updated_at"])

    return JsonResponse({"success": True, "message": "Purchase received and stock updated.", "purchase": _serialize_purchase(_purchase_queryset(request.user).get(id=purchase.id))})


@require_POST
@require_login
def purchasing_status(request, purchase_id):
    denied = ensure_role(request, "CLIENT_ADMIN", "MANAGER")
    if denied:
        return denied
    purchase = _purchase_queryset(request.user).filter(id=purchase_id).first()
    if not purchase:
        return JsonResponse({"success": False, "error": "Purchase order not found."}, status=404)
    data = _json_body(request)
    if data is None:
        return JsonResponse({"success": False, "error": "Invalid JSON request."}, status=400)
    new_status = data.get("status")
    if new_status not in {"draft", "ordered", "cancelled"}:
        return JsonResponse({"success": False, "error": "Status must be draft, ordered, or cancelled."}, status=400)
    if purchase.status == "received":
        return JsonResponse({"success": False, "error": "A received purchase cannot change status."}, status=400)
    purchase.status = new_status
    purchase.save(update_fields=["status", "updated_at"])
    return JsonResponse({"success": True, "message": "Purchase status updated.", "status": purchase.status})
