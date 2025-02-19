"""Util filters"""
from typing import Optional

from django.core.exceptions import FieldError
from rest_framework import filters
from rest_framework.request import Request


class ModelFilter(filters.BaseFilterBackend):
    """Common filter for model viewsets"""

    def filter_queryset(self, request: Request, queryset, view):
        _queryset = queryset
        for param in request.query_params:
            try:
                value = request.query_params[param]
                if isinstance(value, str):
                    if value.lower() == "true":
                        value = True
                    elif value.lower() == "false":
                        value = False
                _queryset = _queryset.filter(**{param: value})
            except FieldError:
                continue
        return _queryset


def get_boolean_query_param(request: Request, label: str) -> Optional[bool]:
    """Recover boolean query param as bool"""
    param = request.query_params.get(label)
    if param is None:
        return None
    if isinstance(param, bool):
        return param
    if isinstance(param, str):
        return param.lower() == "true"
    return False
