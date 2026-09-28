from django.db import models

class Category(models.Model):
    name = models.CharField(max_length = 100 , unique = True)

    def __str__(self):
        return self.name


class Product(models.Model):
    sku = models.CharField(max_length = 50 , unique = True)
    name = models.CharField(max_length = 150)
    category = models.ForeignKey(
        Category,
        on_delete = models.PROTECT,
        related_name = "products"
    )
    base_unit = models.CharField(max_length = 20)
    reorder_level = models.PositiveIntegerField(default = 0)
    active = models.BooleanField(default = True)

    def __str__(self):
        return f"{self.sku} - {self.name}"






