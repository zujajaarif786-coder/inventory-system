from django.core.exceptions import PermissionDenied


def get_user_client(user):
    """
    Return the client associated with the authenticated user.
    Super Admins are not restricted to a single client.
    """

    if not user or not user.is_authenticated:
        raise PermissionDenied("Authentication required.")

    if user.role == "SUPER_ADMIN":
        return None

    if not user.client_id:
        raise PermissionDenied(
            "Your account is not assigned to a client."
        )

    return user.client


def require_client(user):
    """
    Return the user's client.

    Super Admins receive None because they can access
    multiple clients.
    """

    return get_user_client(user)