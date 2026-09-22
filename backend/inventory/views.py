from django.core.exceptions import PermissionDenied, ValidationError
from django.db.models import F, Q, Sum
from django.http import JsonResponse
from django.views.decorators.http import require_GET, require_POST

from accounts.permissions import ensure_role, require_login
from products.models import Product
from .models import InventoryTransaction
from .services import add_stock, remove_stock, adjust_stock


def _is_super_admin(user):
    return bool(getattr(user, "is_superuser", False) or getattr(user, "role", "") == "SUPER_ADMIN")


def _product_queryset(user):
    qs = Product.objects.select_related("category", "client")
    if _is_super_admin(user):
        return qs
    if getattr(user, "client_id", None):
        return qs.filter(client_id=user.client_id)
    return qs.none()


def _transaction_queryset(user):
    qs = InventoryTransaction.objects.select_related("product", "product__client", "created_by")
    if _is_super_admin(user):
        return qs
    if getattr(user, "client_id", None):
        return qs.filter(client_id=user.client_id)
    return qs.none()


@require_login
@require_GET
def inventory_list(request):
    products = _product_queryset(request.user).filter(is_active=True)
    search = request.GET.get("search", "").strip()
    status = request.GET.get("status", "").strip().lower()
    if search:
        products = products.filter(Q(name__icontains=search) | Q(sku__icontains=search) | Q(category__name__icontains=search))
    if status == "out":
        products = products.filter(stock_quantity=0)
    elif status == "low":
        products = products.filter(stock_quantity__gt=0, stock_quantity__lte=F("minimum_stock_level"))
    elif status == "in":
        products = products.filter(stock_quantity__gt=F("minimum_stock_level"))

    data = []
    for product in products:
        purchased = _transaction_queryset(request.user).filter(product=product, transaction_type="stock_in").aggregate(total=Sum("quantity"))["total"] or 0
        sold = _transaction_queryset(request.user).filter(product=product, transaction_type="stock_out").aggregate(total=Sum("quantity"))["total"] or 0
        status_label = "Out of Stock" if product.stock_quantity == 0 else "Low Stock" if product.is_low_stock else "In Stock"
        data.append({"id": product.id, "name": product.name, "sku": product.sku, "category": product.category.name, "quantity": product.stock_quantity, "available_stock": product.stock_quantity, "min_stock": product.minimum_stock_level, "price": float(product.selling_price), "cost_price": float(product.cost_price), "purchased_quantity": purchased, "sold_quantity": abs(sold), "status": status_label})
    return JsonResponse({"success": True, "count": len(data), "products": data})


@require_login
@require_GET
def inventory_stats(request):
    products = _product_queryset(request.user).filter(is_active=True)
    total_stock = products.aggregate(total=Sum("stock_quantity"))["total"] or 0
    low_stock = products.filter(stock_quantity__gt=0, stock_quantity__lte=F("minimum_stock_level")).count()
    out_of_stock = products.filter(stock_quantity=0).count()
    stock_value = sum(product.stock_quantity * product.cost_price for product in products)
    return JsonResponse({"success": True, "stats": {"total_products": products.count(), "total_stock": total_stock, "low_stock": low_stock, "out_of_stock": out_of_stock, "stock_value": float(stock_value)}})


@require_login
@require_GET
def transaction_history(request):
    transactions = _transaction_queryset(request.user)
    search = request.GET.get("search", "").strip()
    if search:
        transactions = transactions.filter(Q(product__name__icontains=search) | Q(product__sku__icontains=search) | Q(notes__icontains=search))
    data = [{"id": t.id, "created_at": t.created_at.isoformat(), "product": t.product.name, "sku": t.product.sku, "transaction_type": t.transaction_type, "transaction_type_display": t.get_transaction_type_display(), "quantity": t.quantity, "stock_before": t.stock_before, "stock_after": t.stock_after, "reference_type": t.reference_type, "reference_id": t.reference_id, "notes": t.notes, "created_by": t.created_by.username if t.created_by else None} for t in transactions[:500]]
    return JsonResponse({"success": True, "count": len(data), "transactions": data})


def _post_value(request, key, default=None):
    return request.POST.get(key, default)


def _write_denied(request):
    return ensure_role(request, "CLIENT_ADMIN", "MANAGER")


@require_login
@require_POST
def stock_in(request):
    denied = _write_denied(request)
    if denied:
        return denied
    try:
        product = _product_queryset(request.user).get(pk=int(_post_value(request, "product_id")))
        quantity = int(_post_value(request, "quantity"))
        notes = str(_post_value(request, "notes", "")).strip()
        tx = add_stock(product.id, quantity, request.user, "manual", None, notes)
        return JsonResponse({"success": True, "message": "Stock added successfully.", "transaction_id": tx.id, "product_id": tx.product_id, "quantity": quantity, "stock_before": tx.stock_before, "stock_after": tx.stock_after})
    except (ValueError, TypeError):
        return JsonResponse({"success": False, "error": "Invalid product or quantity."}, status=400)
    except Product.DoesNotExist:
        return JsonResponse({"success": False, "error": "Product not found."}, status=404)
    except PermissionDenied as error:
        return JsonResponse({"success": False, "error": str(error)}, status=403)
    except ValidationError as error:
        return JsonResponse({"success": False, "error": error.messages}, status=400)


@require_login
@require_POST
def stock_out(request):
    denied = _write_denied(request)
    if denied:
        return denied
    try:
        product = _product_queryset(request.user).get(pk=int(_post_value(request, "product_id")))
        quantity = int(_post_value(request, "quantity"))
        notes = str(_post_value(request, "notes", "")).strip()
        tx = remove_stock(product.id, quantity, request.user, "manual", None, notes)
        return JsonResponse({"success": True, "message": "Stock removed successfully.", "transaction_id": tx.id, "product_id": tx.product_id, "quantity": quantity, "stock_before": tx.stock_before, "stock_after": tx.stock_after})
    except (ValueError, TypeError):
        return JsonResponse({"success": False, "error": "Invalid product or quantity."}, status=400)
    except Product.DoesNotExist:
        return JsonResponse({"success": False, "error": "Product not found."}, status=404)
    except PermissionDenied as error:
        return JsonResponse({"success": False, "error": str(error)}, status=403)
    except ValidationError as error:
        return JsonResponse({"success": False, "error": error.messages}, status=400)


@require_login
@require_POST
def stock_adjustment(request):
    denied = _write_denied(request)
    if denied:
        return denied
    try:
        product = _product_queryset(request.user).get(pk=int(_post_value(request, "product_id")))
        new_quantity = int(_post_value(request, "new_quantity"))
        notes = str(_post_value(request, "notes", "")).strip()
        if not notes:
            return JsonResponse({"success": False, "error": "Please provide an adjustment reason."}, status=400)
        tx = adjust_stock(product.id, new_quantity, request.user, notes)
        return JsonResponse({"success": True, "message": "Stock adjusted successfully.", "transaction_id": tx.id, "product_id": tx.product_id, "stock_before": tx.stock_before, "stock_after": tx.stock_after, "difference": tx.quantity})
    except (ValueError, TypeError):
        return JsonResponse({"success": False, "error": "Invalid product or quantity."}, status=400)
    except Product.DoesNotExist:
        return JsonResponse({"success": False, "error": "Product not found."}, status=404)
    except PermissionDenied as error:
        return JsonResponse({"success": False, "error": str(error)}, status=403)
    except ValidationError as error:
        return JsonResponse({"success": False, "error": error.messages}, status=400)
