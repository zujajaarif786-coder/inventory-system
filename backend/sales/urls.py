from django.urls import path

from . import views


app_name = "sales"


urlpatterns = [

    path(
        "",
        views.sales_list,
        name="sales_list",
    ),

    path(
        "<int:sale_id>/complete/",
        views.complete_sale_view,
        name="complete_sale",
    ),
]