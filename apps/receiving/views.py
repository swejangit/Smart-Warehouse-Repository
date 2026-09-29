from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from purchasing_temp.models import TemporaryPurchaseOrder

from .models import GRN
from .serializers import (
    EligiblePOSerializer,
    GRNSerializer,
)


@api_view(["GET"])
def eligible_pos(request):

    eligible_pos = TemporaryPurchaseOrder.objects.filter(
        status="APPROVED"
    ).order_by("-order_date")

    serializer = EligiblePOSerializer(
        eligible_pos,
        many=True
    )

    return Response(
        {
            "success": True,
            "data": serializer.data,
            "message": (
                "Eligible purchase orders "
                "retrieved successfully"
            ),
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
def create_grn(request):

    serializer = GRNSerializer(
        data=request.data
    )

    if serializer.is_valid():

        grn = serializer.save()

        return Response(
            {
                "success": True,
                "data": GRNSerializer(grn).data,
                "message": "GRN created successfully",
            },
            status=status.HTTP_201_CREATED,
        )

    return Response(
        {
            "success": False,
            "errors": serializer.errors,
        },
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(["GET"])
def get_grns(request):

    grns = GRN.objects.all().order_by("-id")

    serializer = GRNSerializer(
        grns,
        many=True
    )

    return Response(
        {
            "success": True,
            "data": serializer.data,
            "message": "GRNs retrieved successfully",
        },
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
def get_grn(request, grn_id):

    try:
        grn = GRN.objects.get(
            id=grn_id
        )

    except GRN.DoesNotExist:

        return Response(
            {
                "success": False,
                "message": "GRN not found",
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    serializer = GRNSerializer(grn)

    return Response(
        {
            "success": True,
            "data": serializer.data,
            "message": "GRN retrieved successfully",
        },
        status=status.HTTP_200_OK,
    )