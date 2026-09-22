from django.urls import path
from . import views

app_name = "purchasing"

urlpatterns = [
    path("", views.purchasing_list, name="purchasing-list"),
    path(
        "options/",
        views.purchasing_options,
        name="purchasing-options",
    ),
    path(
        "<int:purchase_id>/",
        views.purchasing_detail,
        name="purchasing-detail",
    ),
    path(
        "<int:purchase_id>/receive/",
        views.purchasing_receive,
        name="purchasing-receive",
    ),
    path(
        "<int:purchase_id>/status/",
        views.purchasing_status,
        name="purchasing-status",
    ),
]