"""Util filters"""
from django.core.exceptions import FieldError
from rest_framework import filters
from rest_framework.request import Request


class ModelFilter(filters.BaseFilterBackend):
    """Common filter for model viewsets"""

    def filter_queryset(self, request: Request, queryset, view):
        _queryset = queryset
        for param in request.query_params:
            try:
                _queryset = _queryset.filter(**{param: request.query_params[param]})
            except FieldError:
                continue
        return _queryset


def get_boolean_query_param(request: Request, label: str) -> bool:
    param = request.query_params.get(label)
    if param is None:
        return False
    if type(param) == bool:
        return param
    if type(param) == str:
        return param.lower() == "true"
    return False
