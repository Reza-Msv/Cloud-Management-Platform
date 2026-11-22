import logging
from django.core.exceptions import PermissionDenied as DjangoPermissionDenied
from django.http import Http404
from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Standardized DRF Exception Handler.
    - Handles standard DRF APIException instances (400, 401, 403, 404, etc.)
    - Prevents 500 stack traces and DB internal leakages in Production responses
    - Returns structured and predictable responses for Next.js frontend consumption
    """
    response = exception_handler(exc, context)

    if response is not None:
        # Standard DRF exception response
        return response

    # Handle unhandled server exceptions (500 Internal Server Error)
    # Log the full exception with traceback on the backend
    view_name = context.get('view').__class__.__name__ if context and context.get('view') else 'UnknownView'
    logger.exception(f"Unhandled server error in view '{view_name}': {exc}")

    # Return safe, clean 500 response without leaking internal traceback
    return Response(
        {
            'detail': 'An unexpected internal server error occurred. Please contact support.',
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
