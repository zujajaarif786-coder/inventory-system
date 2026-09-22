from django.db.models import F, Sum
from django.http import JsonResponse

from accounts.permissions import require_login
from categories.models import Category
from customers.models import Customer
from products.models import Product
from purchasing.models import PurchaseOrder
from sales.models import Sale
from suppliers.models import Supplier


@require_login
def report_dashboard(request):
    user = request.user
    is_super_admin = user.is_superuser or user.role == "SUPER_ADMIN"
    if is_super_admin:
        products = Product.objects.filter(is_active=True)
        categories = Category.objects.filter(is_active=True)
        suppliers = Supplier.objects.filter(is_active=True)
        customers = Customer.objects.filter(is_active=True)
        purchases = PurchaseOrder.objects.all()
        sales = Sale.objects.filter(status="completed")
    elif user.client_id:
        products = Product.objects.filter(is_active=True, client_id=user.client_id)
        categories = Category.objects.filter(is_active=True, client_id=user.client_id)
        suppliers = Supplier.objects.filter(is_active=True, client_id=user.client_id)
        customers = Customer.objects.filter(is_active=True, client_id=user.client_id)
        purchases = PurchaseOrder.objects.filter(client_id=user.client_id)
        sales = Sale.objects.filter(status="completed", client_id=user.client_id)
    else:
        products = Product.objects.none()
        categories = Category.objects.none()
        suppliers = Supplier.objects.none()
        customers = Customer.objects.none()
        purchases = PurchaseOrder.objects.none()
        sales = Sale.objects.none()

    return JsonResponse({
        "success": True,
        "stats": {
            "total_products": products.count(),
            "total_categories": categories.count(),
            "total_suppliers": suppliers.count(),
            "total_customers": customers.count(),
            "total_stock": products.aggregate(total=Sum("stock_quantity"))["total"] or 0,
            "stock_value": float(sum(product.stock_quantity * product.cost_price for product in products)),
            "low_stock": products.filter(stock_quantity__gt=0, stock_quantity__lte=F("minimum_stock_level")).count(),
            "out_of_stock": products.filter(stock_quantity=0).count(),
            "total_purchases": purchases.count(),
            "pending_purchases": purchases.filter(status__in=["draft", "ordered", "partial"]).count(),
            "total_sales": sales.count(),
            "revenue": float(sales.aggregate(total=Sum("total_amount"))["total"] or 0),
        },
    })