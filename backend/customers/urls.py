from django.urls import path

from . import views


app_name = "customers"


urlpatterns = [

    path(
        "",
        views.customers_api,
        name="customers-api",
    ),

    path(
        "<int:customer_id>/",
        views.customer_detail_api,
        name="customer-detail-api",
    ),
]