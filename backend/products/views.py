import json

from django.db import IntegrityError
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from accounts.permissions import require_login

from categories.models import Category
from clients.models import Client

from .models import Product


def _product_queryset(user):
    """
    Return only products the current user is allowed to see.
    """

    qs = Product.objects.select_related(
        "category",
        "client",
    )

    # Super Admin can see all clients.
    if (
        getattr(user, "is_superuser", False)
        or getattr(user, "role", "") == "SUPER_ADMIN"
    ):
        return qs

    # Normal users can only see their own client's products.
    if getattr(user, "client_id", None):
        return qs.filter(
            client_id=user.client_id
        )

    # User has no client.
    return qs.none()


def _user_client(user):
    """
    Return the authenticated user's client.

    Super Admins are allowed to choose a client through
    an explicit client_id in the request.
    """

    if getattr(user, "client_id", None):
        return Client.objects.filter(
            id=user.client_id,
            is_active=True,
        ).first()

    if (
        getattr(user, "is_superuser", False)
        or getattr(user, "role", "") == "SUPER_ADMIN"
    ):
        return None

    return None


def _serialize_product(product):
    return {
        "id": product.id,
        "name": product.name,
        "sku": product.sku,
        "description": product.description,

        "client_id": product.client_id,
        "client_name": (
            product.client.name
            if product.client_id
            else ""
        ),

        "category_id": product.category_id,
        "category_name": (
            product.category.name
            if product.category_id
            else ""
        ),

        "cost_price": str(product.cost_price),
        "selling_price": str(product.selling_price),

        "stock_quantity": product.stock_quantity,
        "minimum_stock_level": product.minimum_stock_level,

        "is_low_stock": product.is_low_stock,

        "is_active": product.is_active,

        "created_at": product.created_at.isoformat(),
        "updated_at": product.updated_at.isoformat(),
    }



def _can_manage_products(user):
    """Return True when the user may create, update, or delete products."""

    return (
        getattr(user, "is_superuser", False)
        or getattr(user, "role", "") in {
            "SUPER_ADMIN",
            "CLIENT_ADMIN",
            "MANAGER",
        }
    )

def _payload(request):
    try:
        return json.loads(
            request.body or "{}"
        )
    except json.JSONDecodeError:
        return None


@require_login
@csrf_exempt
@require_http_methods(["GET", "POST"])
def products_api(request):

    # =========================================================
    # GET PRODUCTS
    # =========================================================

    if request.method == "GET":

        products = _product_queryset(
            request.user
        ).order_by("-created_at")

        search = request.GET.get(
            "search",
            ""
        ).strip()

        if search:
            products = products.filter(
                name__icontains=search
            ) | products.filter(
                sku__icontains=search
            )

        data = [
            _serialize_product(product)
            for product in products
        ]

        return JsonResponse({
            "success": True,
            "products": data,
            "count": len(data),
        })

    # Product creation is restricted to Super Admin, Client Admin,
    # and Manager. Staff remains read-only.
    if not _can_manage_products(request.user):
        return JsonResponse(
            {
                "success": False,
                "error": "You do not have permission to create products.",
            },
            status=403,
        )

    # =========================================================
    # CREATE PRODUCT
    # =========================================================

    payload = _payload(request)

    if payload is None:
        return JsonResponse(
            {
                "success": False,
                "error": "Invalid JSON request.",
            },
            status=400,
        )

    name = str(
        payload.get("name", "")
    ).strip()

    sku = str(
        payload.get("sku", "")
    ).strip()

    description = str(
        payload.get("description", "")
    ).strip()

    if not name:
        return JsonResponse(
            {
                "success": False,
                "error": "Product name is required.",
            },
            status=400,
        )

    if not sku:
        return JsonResponse(
            {
                "success": False,
                "error": "SKU is required.",
            },
            status=400,
        )

    try:
        category_id = int(
            payload.get("category_id")
        )
    except (TypeError, ValueError):
        return JsonResponse(
            {
                "success": False,
                "error": "Valid category is required.",
            },
            status=400,
        )

    # ---------------------------------------------------------
    # Category must belong to the same client.
    # ---------------------------------------------------------

    category = get_object_or_404(
        Category.objects.select_related("client"),
        id=category_id,
    )

    # ---------------------------------------------------------
    # Determine client.
    # ---------------------------------------------------------

    user_client = _user_client(
        request.user
    )

    if user_client:

        client = user_client

        # Prevent a client user from using another client's
        # category.
        if category.client_id != client.id:
            return JsonResponse(
                {
                    "success": False,
                    "error": (
                        "You cannot use a category "
                        "belonging to another client."
                    ),
                },
                status=403,
            )

    else:

        # Super Admin must explicitly provide a client.
        client_id = payload.get(
            "client_id"
        )

        if not client_id:
            return JsonResponse(
                {
                    "success": False,
                    "error": (
                        "client_id is required "
                        "when creating a product as Super Admin."
                    ),
                },
                status=400,
            )

        try:
            client = Client.objects.get(
                id=int(client_id),
                is_active=True,
            )
        except (
            Client.DoesNotExist,
            TypeError,
            ValueError,
        ):
            return JsonResponse(
                {
                    "success": False,
                    "error": "Invalid client.",
                },
                status=400,
            )

        if category.client_id != client.id:
            return JsonResponse(
                {
                    "success": False,
                    "error": (
                        "Category does not belong "
                        "to the selected client."
                    ),
                },
                status=400,
            )

    # ---------------------------------------------------------
    # Check SKU inside this client only.
    # ---------------------------------------------------------

    if Product.objects.filter(
        client_id=client.id,
        sku=sku,
    ).exists():

        return JsonResponse(
            {
                "success": False,
                "error": (
                    "SKU already exists "
                    "for this client."
                ),
            },
            status=409,
        )

    # ---------------------------------------------------------
    # Numeric values.
    # ---------------------------------------------------------

    try:

        cost_price = payload.get(
            "cost_price",
            0
        )

        selling_price = payload.get(
            "selling_price",
            0
        )

        stock_quantity = int(
            payload.get(
                "stock_quantity",
                0
            )
        )

        minimum_stock_level = int(
            payload.get(
                "minimum_stock_level",
                payload.get(
                    "reorder_level",
                    0
                ),
            )
        )

    except (
        TypeError,
        ValueError,
    ):

        return JsonResponse(
            {
                "success": False,
                "error": (
                    "Invalid numeric product values."
                ),
            },
            status=400,
        )

    if stock_quantity < 0:
        return JsonResponse(
            {
                "success": False,
                "error": (
                    "Stock quantity cannot be negative."
                ),
            },
            status=400,
        )

    if minimum_stock_level < 0:
        return JsonResponse(
            {
                "success": False,
                "error": (
                    "Minimum stock level cannot be negative."
                ),
            },
            status=400,
        )

    # ---------------------------------------------------------
    # Create.
    # ---------------------------------------------------------

    try:

        product = Product.objects.create(
            client=client,
            category=category,
            name=name,
            sku=sku,
            description=description,
            cost_price=cost_price,
            selling_price=selling_price,
            stock_quantity=stock_quantity,
            minimum_stock_level=minimum_stock_level,
            is_active=True,
        )

    except IntegrityError:

        return JsonResponse(
            {
                "success": False,
                "error": (
                    "A product with this SKU "
                    "already exists for this client."
                ),
            },
            status=409,
        )

    return JsonResponse(
        {
            "success": True,
            "message": "Product created successfully.",
            "product": _serialize_product(product),
        },
        status=201,
    )


@require_login
@csrf_exempt
@require_http_methods([
    "GET",
    "PUT",
    "PATCH",
    "DELETE",
])
def product_detail_api(
    request,
    product_id,
):

    # ---------------------------------------------------------
    # IMPORTANT:
    # The product is retrieved through the tenant-filtered
    # queryset.
    # ---------------------------------------------------------

    product = get_object_or_404(
        _product_queryset(
            request.user
        ),
        id=product_id,
    )

    # Staff may read their tenant's products, but cannot update/delete.
    if request.method in {"PUT", "PATCH", "DELETE"} and not _can_manage_products(request.user):
        return JsonResponse(
            {
                "success": False,
                "error": "You do not have permission to modify products.",
            },
            status=403,
        )

    # =========================================================
    # GET
    # =========================================================

    if request.method == "GET":

        return JsonResponse({
            "success": True,
            "product": _serialize_product(
                product
            ),
        })

    # =========================================================
    # DELETE = SOFT DELETE
    # =========================================================

    if request.method == "DELETE":

        product.is_active = False

        product.save(
            update_fields=[
                "is_active",
                "updated_at",
            ]
        )

        return JsonResponse({
            "success": True,
            "message": (
                "Product deactivated successfully."
            ),
        })

    # =========================================================
    # UPDATE
    # =========================================================

    payload = _payload(request)

    if payload is None:

        return JsonResponse(
            {
                "success": False,
                "error": "Invalid JSON request.",
            },
            status=400,
        )

    if "name" in payload:

        name = str(
            payload["name"]
        ).strip()

        if not name:
            return JsonResponse(
                {
                    "success": False,
                    "error": (
                        "Product name cannot be empty."
                    ),
                },
                status=400,
            )

        product.name = name

    if "description" in payload:

        product.description = str(
            payload["description"]
        ).strip()

    if "cost_price" in payload:

        product.cost_price = payload[
            "cost_price"
        ]

    if "selling_price" in payload:

        product.selling_price = payload[
            "selling_price"
        ]

    if "minimum_stock_level" in payload:

        try:
            minimum_stock_level = int(
                payload[
                    "minimum_stock_level"
                ]
            )
        except (
            TypeError,
            ValueError,
        ):
            return JsonResponse(
                {
                    "success": False,
                    "error": (
                        "Minimum stock level "
                        "must be a number."
                    ),
                },
                status=400,
            )

        if minimum_stock_level < 0:
            return JsonResponse(
                {
                    "success": False,
                    "error": (
                        "Minimum stock level "
                        "cannot be negative."
                    ),
                },
                status=400,
            )

        product.minimum_stock_level = (
            minimum_stock_level
        )

    # Backward compatibility with old frontend.
    elif "reorder_level" in payload:

        try:
            product.minimum_stock_level = int(
                payload[
                    "reorder_level"
                ]
            )
        except (
            TypeError,
            ValueError,
        ):
            return JsonResponse(
                {
                    "success": False,
                    "error": (
                        "Reorder level "
                        "must be a number."
                    ),
                },
                status=400,
            )

    if "is_active" in payload:

        product.is_active = bool(
            payload["is_active"]
        )

    product.save()

    return JsonResponse({
        "success": True,
        "message": (
            "Product updated successfully."
        ),
        "product": _serialize_product(
            product
        ),
    })