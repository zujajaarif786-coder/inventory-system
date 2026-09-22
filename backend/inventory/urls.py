from django.urls import path

from . import views


app_name = "inventory"

urlpatterns = [

    path(
        "",
        views.inventory_list,
        name="inventory_list",
    ),

    path(
        "stats/",
        views.inventory_stats,
        name="inventory_stats",
    ),

    path(
        "history/",
        views.transaction_history,
        name="transaction_history",
    ),

    path(
        "stock-in/",
        views.stock_in,
        name="stock_in",
    ),

    path(
        "stock-out/",
        views.stock_out,
        name="stock_out",
    ),

    path(
        "adjustment/",
        views.stock_adjustment,
        name="stock_adjustment",
    ),
]