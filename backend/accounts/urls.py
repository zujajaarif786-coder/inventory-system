from django.urls import path

from . import views


app_name = "accounts"


urlpatterns = [
    path(
        "login/",
        views.login_view,
        name="login"
    ),

    path(
        "forgot-password/",
        views.forgot_password_view,
        name="forgot_password"
    ),

    path(
        "reset-password/",
        views.reset_password_view,
        name="reset_password"
    ),

    path(
        "logout/",
        views.logout_view,
        name="logout"
    ),

    path(
        "me/",
        views.current_user,
        name="current_user"
    ),
]