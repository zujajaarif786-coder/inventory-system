from django.core.exceptions import PermissionDenied, ValidationError
from django.http import JsonResponse
from django.views.decorators.http import require_GET, require_POST

from accounts.permissions import ensure_role, require_login
from .models import Sale
from .services import complete_sale


def _is_super_admin(user):
    return bool(getattr(user, "is_superuser", False) or getattr(user, "role", "") == "SUPER_ADMIN")


def _sale_queryset(user):
    qs = Sale.objects.select_related("customer", "created_by", "client").prefetch_related("items__product")
    if _is_super_admin(user):
        return qs
    if getattr(user, "client_id", None):
        return qs.filter(client_id=user.client_id)
    return qs.none()


@require_login
@require_GET
def sales_list(request):
    sales = _sale_queryset(request.user)
    data = []
    for sale in sales:
        data.append({
            "id": sale.id,
            "invoice_number": sale.invoice_number,
            "customer": sale.customer.name if sale.customer else None,
            "sale_date": sale.sale_date,
            "status": sale.status,
            "subtotal": str(sale.subtotal),
            "tax": str(sale.tax),
            "discount": str(sale.discount),
            "total_amount": str(sale.total_amount),
            "client_id": sale.client_id,
            "items": [
                {"product": item.product.name, "sku": item.product.sku, "quantity": item.quantity, "unit_price": str(item.unit_price), "discount": str(item.discount), "total": str(item.total)}
                for item in sale.items.all()
            ],
        })
    return JsonResponse({"success": True, "count": len(data), "sales": data})


@require_POST
@require_login
def complete_sale_view(request, sale_id):
    denied = ensure_role(request, "CLIENT_ADMIN", "MANAGER", "STAFF")
    if denied:
        return denied
    sale = _sale_queryset(request.user).filter(id=sale_id).first()
    if not sale:
        return JsonResponse({"success": False, "error": "Sale not found."}, status=404)
    try:
        complete_sale(sale=sale, user=request.user)
        return JsonResponse({"success": True, "message": "Sale completed successfully.", "sale_id": sale.id, "invoice_number": sale.invoice_number})
    except PermissionDenied as error:
        return JsonResponse({"success": False, "error": str(error)}, status=403)
    except ValidationError as error:
        return JsonResponse({"success": False, "error": error.messages}, status=400)
