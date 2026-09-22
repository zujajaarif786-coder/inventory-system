from django.urls import path

from . import views


app_name = "categories"


urlpatterns = [
    path(
        "",
        views.categories_list_create,
        name="list_create"
    ),

    path(
        "<int:category_id>/",
        views.category_detail,
        name="detail"
    ),
]