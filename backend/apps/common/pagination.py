from rest_framework.pagination import PageNumberPagination


class StandardResultsSetPagination(PageNumberPagination):
    """
    Standard pagination for list endpoints:
    - Default page_size: 10
    - Configurable page size via 'page_size' query parameter
    - Max page size capped at 100 to prevent client-induced DoS
    - Response structure:
      {
        "count": 100,
        "next": "http://.../?page=2",
        "previous": null,
        "results": [...]
      }
    """
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100
