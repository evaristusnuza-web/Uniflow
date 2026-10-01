from database import cursor
from languages import t


def reports_menu():
    while True:
        print()
        print("========== REPORTS ==========")
        print("1. Sales report")
        print("2. Purchases report")
        print("3. Payments report")
        print("4. Inventory report")
        print("5. Financial summary")
        print("6. Back")

        choice = input(t("choose_option") + " ").strip()

        if choice == "1":
            sales_report()

        elif choice == "2":
            purchases_report()

        elif choice == "3":
            payments_report()

        elif choice == "4":
            inventory_report()

        elif choice == "5":
            financial_summary()

        elif choice == "6":
            break

        else:
            print(t("invalid_option"))


def sales_report():
    print()
    print("========== SALES REPORT ==========")

    cursor.execute("""
        SELECT COUNT(*), COALESCE(SUM(total), 0)
        FROM sales
    """)

    result = cursor.fetchone()

    print(f"Total sales: {result[0]}")
    print(f"Total sales amount: {result[1]:,.2f}")

    input("\nPress Enter to continue...")


def purchases_report():
    print()
    print("========== PURCHASES REPORT ==========")

    cursor.execute("""
        SELECT COUNT(*), COALESCE(SUM(total), 0)
        FROM purchases
    """)

    result = cursor.fetchone()

    print(f"Total purchases: {result[0]}")
    print(f"Total purchase amount: {result[1]:,.2f}")

    input("\nPress Enter to continue...")


def payments_report():
    print()
    print("========== PAYMENTS REPORT ==========")

    cursor.execute("""
        SELECT COUNT(*), COALESCE(SUM(amount), 0)
        FROM payments
    """)

    result = cursor.fetchone()

    print(f"Total payments: {result[0]}")
    print(f"Total payment amount: {result[1]:,.2f}")

    input("\nPress Enter to continue...")


def inventory_report():
    print()
    print("========== INVENTORY REPORT ==========")

    cursor.execute("""
        SELECT id, name, quantity, price
        FROM products
        ORDER BY name
    """)

    products = cursor.fetchall()

    if not products:
        print("No products found.")
        input("\nPress Enter to continue...")
        return

    print()
    print(f"{'ID':<6}{'PRODUCT':<30}{'QUANTITY':<12}{'PRICE':<12}")
    print("-" * 60)

    total_value = 0

    for product in products:
        product_id = product[0]
        name = product[1]
        quantity = product[2]
        price = product[3]

        value = quantity * price
        total_value += value

        print(
            f"{product_id:<6}"
            f"{name:<30}"
            f"{quantity:<12}"
            f"{price:<12.2f}"
        )

    print("-" * 60)
    print(f"Total inventory value: {total_value:,.2f}")

    input("\nPress Enter to continue...")


def financial_summary():
    print()
    print("========== FINANCIAL SUMMARY ==========")

    cursor.execute("""
        SELECT COALESCE(SUM(total), 0)
        FROM sales
    """)

    sales = cursor.fetchone()[0]

    cursor.execute("""
        SELECT COALESCE(SUM(total), 0)
        FROM purchases
    """)

    purchases = cursor.fetchone()[0]

    cursor.execute("""
        SELECT COALESCE(SUM(amount), 0)
        FROM payments
    """)

    payments = cursor.fetchone()[0]

    balance = sales - purchases

    print()
    print(f"Total sales:       {sales:,.2f}")
    print(f"Total purchases:   {purchases:,.2f}")
    print(f"Total payments:    {payments:,.2f}")
    print("-" * 40)
    print(f"Net balance:       {balance:,.2f}")

    input("\nPress Enter to continue...")