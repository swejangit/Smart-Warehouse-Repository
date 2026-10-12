from django.urls import path

from .views import (
    eligible_pos,
    create_grn,
    get_grns,
    get_grn,
)


urlpatterns = [
    path(
        "eligible-pos/",
        eligible_pos,
        name="eligible-pos",
    ),

    path(
        "grns/",
        create_grn,
        name="create-grn",
    ),

    path(
        "grns/list/",
        get_grns,
        name="get-grns",
    ),

    path(
        "grns/<int:grn_id>/",
        get_grn,
        name="get-grn",
    ),
]