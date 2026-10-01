from .models import StockBalance,InventoryTransaction
def stock_in(stock_balance, quantity):
    stock_balance.total_quantity += quantity
    stock_balance.available_quantity += quantity
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