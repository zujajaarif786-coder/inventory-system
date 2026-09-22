from django.urls import path

from . import views


urlpatterns = [
    path("", views.activity_logs_home, name="activity-logs-home"),
]