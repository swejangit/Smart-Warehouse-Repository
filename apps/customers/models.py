from django.db import models
from django.core.validators import RegexValidator
# Create your models here.
class Customer(models.Model):

    STATUS_CHOICES = [
        ("ACTIVE", "Active"),
        ("INACTIVE", "Inactive"),
    ]

    customer_code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=150)
    contact = models.CharField(max_length=10,blank=True,null=True,
        validators=[
            RegexValidator(
                regex=r"^\d{10}$",
                message="Contact number must contain exactly 10 digits."
            )
        ]
    )

    email = models.EmailField(unique=True,blank=True,null=True)
    billing_address = models.TextField(blank=True)
    shipping_address = models.TextField(blank=True)
    payment_terms = models.CharField(max_length=100, blank=True)
    credit_limit = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="ACTIVE"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
