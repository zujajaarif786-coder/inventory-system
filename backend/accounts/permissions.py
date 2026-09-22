from functools import wraps

from django.http import JsonResponse


SUPER_ADMIN = "SUPER_ADMIN"
CLIENT_ADMIN = "CLIENT_ADMIN"
MANAGER = "MANAGER"
STAFF = "STAFF"


def _is_super_admin(user):
    return bool(
        user
        and user.is_authenticated
        and (
            getattr(user, "is_superuser", False)
            or getattr(user, "role", "") == SUPER_ADMIN
        )
    )


def _deny(message, status=403):
    return JsonResponse(
        {"success": False, "error": message},
        status=status,
    )


def require_login(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return _deny("Authentication required.", 401)
        return view_func(request, *args, **kwargs)

    return wrapper


def has_role(user, *roles):
    if not user or not user.is_authenticated:
        return False
    if _is_super_admin(user):
        return True
    return getattr(user, "role", None) in roles


def ensure_role(request, *roles):
    if not request.user.is_authenticated:
        return _deny("Authentication required.", 401)
    if not has_role(request.user, *roles):
        return _deny("You do not have permission to perform this action.")
    if not _is_super_admin(request.user) and not getattr(request.user, "client_id", None):
        return _deny("Your account is not assigned to a client.")
    return None


def require_roles(*roles):
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            denied = ensure_role(request, *roles)
            if denied:
                return denied
            return view_func(request, *args, **kwargs)

        return wrapper

    return decorator


def require_client_admin(view_func):
    return require_roles(CLIENT_ADMIN)(view_func)


def require_manager_or_admin(view_func):
    return require_roles(CLIENT_ADMIN, MANAGER)(view_func)


def require_staff_access(view_func):
    return require_roles(CLIENT_ADMIN, MANAGER, STAFF)(view_func)
