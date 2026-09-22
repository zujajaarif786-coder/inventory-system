from django.db.models import Q
from django.http import JsonResponse

from accounts.permissions import require_login
from inventory.models import InventoryTransaction


@require_login
def activity_logs_home(request):
    user = request.user
    transactions = InventoryTransaction.objects.select_related(
        "product",
        "created_by",
    )
    if not (user.is_superuser or user.role == "SUPER_ADMIN"):
        if not user.client_id:
            transactions = transactions.none()
        else:
            transactions = transactions.filter(client_id=user.client_id)

    search = request.GET.get("search", "").strip()
    transaction_type = request.GET.get("transaction_type", "").strip()
    if search:
        transactions = transactions.filter(
            Q(product__name__icontains=search)
            | Q(product__sku__icontains=search)
            | Q(notes__icontains=search)
            | Q(created_by__username__icontains=search)
        )
    if transaction_type in {"stock_in", "stock_out", "adjustment"}:
        transactions = transactions.filter(transaction_type=transaction_type)

    logs = [
        {
            "id": transaction.id,
            "created_at": transaction.created_at.isoformat(),
            "action": transaction.get_transaction_type_display(),
            "transaction_type": transaction.transaction_type,
            "product": transaction.product.name,
            "sku": transaction.product.sku,
            "quantity": transaction.quantity,
            "stock_before": transaction.stock_before,
            "stock_after": transaction.stock_after,
            "notes": transaction.notes,
            "created_by": transaction.created_by.username if transaction.created_by else None,
        }
        for transaction in transactions[:500]
    ]

    return JsonResponse({
        "success": True,
        "count": len(logs),
        "logs": logs,
    })