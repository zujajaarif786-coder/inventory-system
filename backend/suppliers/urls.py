from django.urls import path

from . import views


app_name = "suppliers"


urlpatterns = [

    path(
        "",
        views.suppliers_api,
        name="suppliers-api",
    ),

    path(
        "<int:supplier_id>/",
        views.supplier_detail_api,
        name="supplier-detail-api",
    ),
]