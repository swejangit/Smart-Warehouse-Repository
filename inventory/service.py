from .models import StockBalance,InventoryTransaction,Product
from rest_framework.exceptions import ValidationError
from django.db import transaction
from Warehouse.models import Warehouse,Location
from decimal import Decimal
from django.db.models import Sum
from .dummy_grns import DUMMY_GRNS
def stock_in(stock_balance, quantity):
    stock_balance.total_quantity += quantity
    stock_balance.available_quantity += quantity
    stock_balance.save(
        update_fields=["total_quantity","available_quantity","updated_at",]
    )

    return stock_balance


def stock_out(stock_balance, quantity):
    if stock_balance.available_quantity < quantity:
        raise ValueError("Insufficient available stock for stock out.")

    stock_balance.total_quantity -= quantity
    stock_balance.available_quantity -= quantity
    stock_balance.save(
        update_fields=["total_quantity","available_quantity","updated_at",]
    )

    return stock_balance

def reserve_stock(stock_balance, quantity):
    if stock_balance.available_quantity < quantity:
        raise ValueError("Insufficient available stock.")
    stock_balance.reserved_quantity += quantity
    stock_balance.available_quantity -= quantity
    stock_balance.save(
        update_fields=["reserved_quantity","available_quantity","updated_at",]
    )

    return stock_balance
def release_stock(stock_balance, quantity):
    if stock_balance.reserved_quantity < quantity:
        raise ValueError("Insufficient reserved stock.")
    stock_balance.reserved_quantity -= quantity
    stock_balance.available_quantity += quantity

    stock_balance.save(
        update_fields=["reserved_quantity","available_quantity","updated_at",]
    )

    return stock_balance
def validate_grn_exists(grn_id):
    grn = DUMMY_GRNS.get(grn_id)
    if grn is None:
        raise ValidationError(f"GRN {grn_id} does not exist.")

    return grn
@transaction.atomic
def process_inventory_in(grn_id, warehouse_id ,items):
    grn = validate_grn_exists(grn_id)
    if grn['warehouse_id'] != warehouse_id:
        raise ValidationError("The selected warehouse does not belong to this GRN.")
    warehouse = Warehouse.objects.get(id=warehouse_id)
    response_items = []
    for item in items:
        product_id = item['product_id']
        received_quantity = item['received_quantity']
        location_id = item.get('location_id') or 1
        grn_item = next(
            (
                grn_item
                for grn_item in grn['items']
                if grn_item['product_id'] == product_id
            ),
            None
        )

        if grn_item is None:
            raise ValidationError(f"Product {product_id} is not part of this GRN.")

        grn_quantity = grn_item['grn_quantity']
        already_received = (
            InventoryTransaction.objects
            .filter(
                transaction_type='IN',
                source_reference=str(grn_id),
                product_id=product_id
            )
            .aggregate(
                total_received=Sum('quantity')
            )['total_received'] or Decimal("0.00")
        )

        remaining_quantity = grn_quantity - already_received

        if remaining_quantity <= 0:
            raise ValidationError(
                f"Product {product_id} in the GRN has already been completely processed."
            )
        if received_quantity > remaining_quantity:
            raise ValidationError(
                f"Only {remaining_quantity} quantity remains for product {product_id} in this GRN."
            )

        stock_balance, created = StockBalance.objects.select_for_update().get_or_create(
            product_id=product_id,
            warehouse_id=warehouse_id,
            location_id=location_id,
            defaults={
                "total_quantity": Decimal("0.00"),
                "available_quantity": Decimal("0.00"),
                "reserved_quantity": Decimal("0.00"),
            }
        )

        stock_in(stock_balance, received_quantity)
        InventoryTransaction.objects.create(
            product_id=product_id,
            transaction_type='IN',
            quantity=received_quantity,
            source_reference=str(grn_id)
        )

        remaining_quantity -= received_quantity

        response_items.append({
            'productId': product_id,
            'grnQuantity': grn_quantity,
            'receivedQuantity': received_quantity,
            'remainingQuantity': remaining_quantity
        })

    return {
        'grnId': grn_id,
        'warehouse': {
            'warehouseId': warehouse.id,
            'warehouseName': warehouse.name
        },
        'items': response_items
    }

@transaction.atomic
def process_stock_reservation(sales_order_id,product_id,warehouse_id,location_id,quantity):
    quantity = int(quantity)

    if quantity <= 0:
        raise ValidationError("Reservation quantity must be greater than zero.")
    product = Product.objects.get(Product_id=product_id)
    already_reserved = InventoryTransaction.objects.filter(
        transaction_type='RESERVE',
        source_reference=str(sales_order_id),
        product=product
    ).exists()

    if already_reserved:
        raise ValidationError(
            f"Product '{product.Product_name}' is already reserved "
            f"for {sales_order_id}."
        )

    stock_balance = StockBalance.objects.select_for_update().filter(
        product=product,
        warehouse_id=warehouse_id,
        location_id=location_id
    ).first()

    if not stock_balance:
        raise ValidationError(
            f"No stock balance found for "
            f"'{product.Product_name}' at location {location_id} "
            f"in warehouse {warehouse_id}."
        )

    if stock_balance.available_quantity < quantity:
        raise ValidationError(
            f"Insufficient stock for '{product.Product_name}'. "
            f"Available: {stock_balance.available_quantity}, "
            f"Requested: {quantity}."
        )

    reserve_stock(stock_balance, quantity)

    InventoryTransaction.objects.create(
        product=product,
        transaction_type='RESERVE',
        quantity=quantity,
        source_reference=str(sales_order_id)
    )

    return {
        "sales_order_id": sales_order_id,
        "warehouse_id": warehouse_id,
        "product_id": product.Product_id,
        "product_name": product.Product_name,
        "location_id": location_id,
        "reserved_quantity": stock_balance.reserved_quantity,
        "available_quantity": stock_balance.available_quantity,
        "total_quantity": stock_balance.total_quantity
    }
@transaction.atomic
def process_stock_release(sales_order_id, product_id, warehouse_id, location_id, quantity):
    quantity = Decimal(str(quantity))

    if quantity <= Decimal("0.00"):
        raise ValidationError("Release quantity must be greater than zero.")

    if not Warehouse.objects.filter(id=warehouse_id).exists():
        raise ValidationError(f"Warehouse {warehouse_id} does not exist.")

    product = Product.objects.filter(Product_id=product_id).first()
    if not product:
        raise ValidationError(f"Product {product_id} does not exist.")
    was_reserved = InventoryTransaction.objects.filter(
    transaction_type='RESERVE',
    source_reference=str(sales_order_id),
    product=product
    ).exists()
    if not was_reserved:
        raise ValidationError(
            f"No active reservation found for Product '{product.Product_name}' under order {sales_order_id}."
        )
    stock_balance = StockBalance.objects.select_for_update().filter(
        product=product,
        warehouse_id=warehouse_id,
        location_id=location_id
    ).first()

    if not stock_balance:
        raise ValidationError(
            f"No stock balance found for '{product.Product_name}' at location {location_id} in warehouse {warehouse_id}."
        )


    if stock_balance.reserved_quantity < quantity:
        raise ValidationError(
            f"Cannot release {quantity} for '{product.Product_name}'. Only {stock_balance.reserved_quantity} is currently reserved."
        )

    release_stock(stock_balance,quantity)
    InventoryTransaction.objects.create(
        product=product,
        transaction_type='RELEASED',
        quantity=quantity,
        source_reference=str(sales_order_id)
    )

    return {
        "sales_order_id": sales_order_id,
        "warehouse_id": warehouse_id,
        "product_id": product.Product_id,
        "product_name": product.Product_name,
        "location_id": location_id,
        "released_quantity": str(quantity),
        "available_quantity": str(stock_balance.available_quantity),
        "reserved_balance": str(stock_balance.reserved_quantity),
        "total_quantity": str(stock_balance.total_quantity)
    }

@transaction.atomic
def process_inventory_out(sales_order_id, warehouse_id, items):
    warehouse = Warehouse.objects.filter(id=warehouse_id).first()
    if warehouse is None:
        raise ValidationError(f"Warehouse {warehouse_id} does not exist.")

    response_items = []

    for item in items:
        product_id = item["product_id"]
        quantity = int(item["quantity"])
        location_id = item.get("location_id") or 1

        product = Product.objects.filter(Product_id=product_id).first()
        if product is None:
            raise ValidationError(f"Product {product_id} does not exist.")

        stock_balance = StockBalance.objects.select_for_update().filter(
            product_id=product_id,
            warehouse_id=warehouse_id,
            location_id=location_id,
        ).first()

        if stock_balance is None:
            raise ValidationError(
                f"No stock balance found for product {product_id} at warehouse {warehouse_id} and location {location_id}."
            )

        if stock_balance.available_quantity < quantity:
            raise ValidationError(
                f"Insufficient available stock for product {product_id}. "
                f"Available: {stock_balance.available_quantity}, requested: {quantity}."
            )

        stock_out(stock_balance, quantity)
        InventoryTransaction.objects.create(
            product_id=product_id,
            transaction_type='OUT',
            quantity=quantity,
            source_reference=str(sales_order_id),
        )

        response_items.append({
            "productId": product_id,
            "locationId": location_id,
            "quantity": quantity,
            "remainingAvailableQuantity": stock_balance.available_quantity,
        })

    return {
        "salesOrderId": sales_order_id,
        "warehouse": {
            "warehouseId": warehouse.id,
            "warehouseName": warehouse.name,
        },
        "items": response_items,
    }

