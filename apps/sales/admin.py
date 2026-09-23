from django.contrib import admin

# Register your models here.
from .models import SalesOrder, SalesOrderItem


admin.site.register(SalesOrder)
admin.site.register(SalesOrderItem)

