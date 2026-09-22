from django.urls import path

from . import views


app_name = "products"


urlpatterns = [

    path(
        "",
        views.products_api,
        name="products-api",
    ),

    path(
        "<int:product_id>/",
        views.product_detail_api,
        name="product-detail-api",
    ),
]