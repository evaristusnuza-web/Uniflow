from datetime import datetime

from database import cursor, connection

from modules.accounting_engine import (
    record_purchase_accounting
)

from languages import t


def purchase_menu():

    while True:

        print()
        print("================================")
        print(t("purchases").upper())
        print("================================")

        print("1.", t("create_purchase"))
        print("2.", t("view_purchases"))
        print("3.", t("purchase_details"))
        print("4.", t("back"))

        choice = input(
            t("choose_option") + " "
        ).strip()

        # ====================================================
        # CREATE PURCHASE
        # ====================================================

        if choice == "1":

            # ------------------------------------------------
            # GET SUPPLIERS
            # ------------------------------------------------

            cursor.execute(
                """
                SELECT id, name
                FROM suppliers
                ORDER BY name
                """
            )

            suppliers = cursor.fetchall()

            if not suppliers:

                print(t("not_found"))
                print("Please add a supplier first.")

                continue

            # ------------------------------------------------
            # GET PRODUCTS
            # ------------------------------------------------

            cursor.execute(
                """
                SELECT
                    id,
                    code,
                    name,
                    quantity
                FROM products
                ORDER BY name
                """
            )

            products = cursor.fetchall()

            if not products:

                print(t("not_found"))
                print("Please add a product first.")

                continue

            # ------------------------------------------------
            # SELECT SUPPLIER
            # ------------------------------------------------

            print()
            print(
                "========== "
                + t("suppliers").upper()
                + " =========="
            )

            for supplier in suppliers:

                print(
                    f"{t('id')}: {supplier[0]} | "
                    f"{t('name')}: {supplier[1]}"
                )

            supplier_id = input(
                t("enter_id") + " "
            ).strip()

            cursor.execute(
                """
                SELECT id, name
                FROM suppliers
                WHERE id = ?
                """,
                (supplier_id,)
            )

            supplier = cursor.fetchone()

            if supplier is None:

                print(t("supplier_not_found"))

                continue

            # ------------------------------------------------
            # PAYMENT METHOD
            # ------------------------------------------------

            print()
            print(t("method") + ":")
            print("1. Cash")
            print("2. Bank")
            print("3. Mobile Money")
            print("4. Credit")

            payment_choice = input(
                t("choose_option") + " "
            ).strip()

            payment_methods = {
                "1": "Cash",
                "2": "Bank",
                "3": "Mobile Money",
                "4": "Accounts Payable"
            }

            payment_method = payment_methods.get(
                payment_choice
            )

            if payment_method is None:

                print(t("invalid_option"))

                continue

            # ------------------------------------------------
            # ADD PURCHASE ITEMS
            # ------------------------------------------------

            purchase_items = []

            while True:

                cursor.execute(
                    """
                    SELECT
                        id,
                        code,
                        name,
                        quantity
                    FROM products
                    ORDER BY name
                    """
                )

                products = cursor.fetchall()

                print()
                print(
                    "========== "
                    + t("products_inventory").upper()
                    + " =========="
                )

                for product in products:

                    print(
                        f"{t('id')}: {product[0]} | "
                        f"{t('code')}: {product[1]} | "
                        f"{t('name')}: {product[2]} | "
                        f"{t('quantity')}: {product[3]}"
                    )

                product_id = input(
                    t("enter_id")
                    + " "
                    + "(or 'done'): "
                ).strip()

                if product_id.lower() == "done":

                    break

                cursor.execute(
                    """
                    SELECT
                        id,
                        code,
                        name,
                        quantity
                    FROM products
                    WHERE id = ?
                    """,
                    (product_id,)
                )

                product = cursor.fetchone()

                if product is None:

                    print(t("product_not_found"))

                    continue

                print()
                print(
                    f"{t('name')}:",
                    product[2]
                )

                print(
                    f"{t('quantity')}:",
                    product[3]
                )

                try:

                    quantity = int(
                        input(
                            t("enter_quantity") + " "
                        )
                    )

                    purchase_price = float(
                        input(
                            t("enter_price") + " "
                        )
                    )

                except ValueError:

                    print(
                        t("invalid_quantity")
                        + " / "
                        + t("invalid_price")
                    )

                    continue

                if quantity <= 0:

                    print(t("invalid_quantity"))

                    continue

                if purchase_price < 0:

                    print(t("invalid_price"))

                    continue

                subtotal = (
                    quantity * purchase_price
                )

                purchase_items.append(
                    (
                        product[0],
                        quantity,
                        purchase_price,
                        subtotal
                    )
                )

                print(
                    f"{t('added_successfully')} "
                    f"{product[2]} | "
                    f"{t('quantity')}: {quantity} | "
                    f"{t('total')}: {subtotal:.2f}"
                )

            # ------------------------------------------------
            # CHECK ITEMS
            # ------------------------------------------------

            if not purchase_items:

                print(
                    "No products added. "
                    "Purchase cancelled."
                )

                continue

            total = sum(
                item[3]
                for item in purchase_items
            )

            # ------------------------------------------------
            # PURCHASE SUMMARY
            # ------------------------------------------------

            print()
            print("==============================")
            print(
                t("purchases").upper()
                + " SUMMARY"
            )
            print("==============================")

            print(
                f"{t('suppliers')}:",
                supplier[1]
            )

            print(
                f"{t('method')}:",
                payment_method
            )

            for item in purchase_items:

                print(
                    f"{t('id')}: {item[0]} | "
                    f"{t('quantity')}: {item[1]} | "
                    f"{t('price')}: {item[2]:.2f} | "
                    f"{t('total')}: {item[3]:.2f}"
                )

            print("------------------------------")

            print(
                f"{t('total').upper()}: "
                f"{total:.2f}"
            )

            print("==============================")

            confirm = input(
                "Confirm purchase? (yes/no): "
            ).strip().lower()

            if confirm not in (
                t("yes").lower(),
                "yes"
            ):

                print(t("operation_cancelled"))

                continue

            # =================================================
            # SAVE PURCHASE + ACCOUNTING
            # =================================================

            try:

                purchase_date = datetime.now().strftime(
                    "%Y-%m-%d %H:%M:%S"
                )

                # ---------------------------------------------
                # SAVE PURCHASE
                # ---------------------------------------------

                cursor.execute(
                    """
                    INSERT INTO purchases
                    (
                        supplier_id,
                        purchase_date,
                        total
                    )
                    VALUES (?, ?, ?)
                    """,
                    (
                        supplier_id,
                        purchase_date,
                        total
                    )
                )

                purchase_id = cursor.lastrowid

                # ---------------------------------------------
                # SAVE PURCHASE ITEMS
                # ---------------------------------------------

                for item in purchase_items:

                    product_id = item[0]
                    quantity = item[1]
                    price = item[2]
                    subtotal = item[3]

                    cursor.execute(
                        """
                        INSERT INTO purchase_items
                        (
                            purchase_id,
                            product_id,
                            quantity,
                            price,
                            subtotal
                        )
                        VALUES (?, ?, ?, ?, ?)
                        """,
                        (
                            purchase_id,
                            product_id,
                            quantity,
                            price,
                            subtotal
                        )
                    )

                    # -----------------------------------------
                    # INCREASE INVENTORY
                    # -----------------------------------------

                    cursor.execute(
                        """
                        UPDATE products
                        SET quantity = quantity + ?
                        WHERE id = ?
                        """,
                        (
                            quantity,
                            product_id
                        )
                    )

                # ---------------------------------------------
                # CREATE ACCOUNTING ENTRY
                # ---------------------------------------------

                record_purchase_accounting(
                    purchase_id,
                    total,
                    payment_method
                )

                # ---------------------------------------------
                # COMMIT EVERYTHING
                # ---------------------------------------------

                connection.commit()

                print()
                print("================================")
                print(
                    t("saved_successfully").upper()
                )
                print("================================")

                print(
                    f"{t('id')}:",
                    purchase_id
                )

                print(
                    f"{t('total')}: {total:.2f}"
                )

                print(
                    "Accounting entry created."
                )

            except Exception as error:

                connection.rollback()

                print()
                print(
                    "Purchase could not be completed."
                )

                print(
                    "Reason:",
                    error
                )

        # ====================================================
        # VIEW PURCHASES
        # ====================================================

        elif choice == "2":

            cursor.execute(
                """
                SELECT
                    purchases.id,
                    suppliers.name,
                    purchases.purchase_date,
                    purchases.total
                FROM purchases
                LEFT JOIN suppliers
                    ON purchases.supplier_id =
                       suppliers.id
                ORDER BY purchases.id DESC
                """
            )

            purchases = cursor.fetchall()

            print()
            print(
                "========== "
                + t("view_purchases").upper()
                + " =========="
            )

            if not purchases:

                print(t("not_found"))

            else:

                for purchase in purchases:

                    print(
                        f"{t('id')}: {purchase[0]} | "
                        f"{t('suppliers')}: "
                        f"{purchase[1] or 'Unknown'} | "
                        f"{t('date')}: {purchase[2]} | "
                        f"{t('total')}: {purchase[3]:.2f}"
                    )

        # ====================================================
        # VIEW PURCHASE DETAILS
        # ====================================================

        elif choice == "3":

            purchase_id = input(
                t("enter_id") + " "
            ).strip()

            cursor.execute(
                """
                SELECT
                    purchases.id,
                    suppliers.name,
                    purchases.purchase_date,
                    purchases.total
                FROM purchases
                LEFT JOIN suppliers
                    ON purchases.supplier_id =
                       suppliers.id
                WHERE purchases.id = ?
                """,
                (purchase_id,)
            )

            purchase = cursor.fetchone()

            if purchase is None:

                print("Purchase not found.")

                continue

            print()
            print(
                "========== "
                + t("purchase_details").upper()
                + " =========="
            )

            print(
                f"{t('id')}:",
                purchase[0]
            )

            print(
                f"{t('suppliers')}:",
                purchase[1] or "Unknown"
            )

            print(
                f"{t('date')}:",
                purchase[2]
            )

            print(
                f"{t('total')}: {purchase[3]:.2f}"
            )

            cursor.execute(
                """
                SELECT
                    products.code,
                    products.name,
                    purchase_items.quantity,
                    purchase_items.price,
                    purchase_items.subtotal
                FROM purchase_items
                JOIN products
                    ON purchase_items.product_id =
                       products.id
                WHERE purchase_items.purchase_id = ?
                """,
                (purchase_id,)
            )

            items = cursor.fetchall()

            print()
            print(t("products_inventory") + ":")

            if not items:

                print(t("not_found"))

            else:

                for item in items:

                    print(
                        f"{t('code')}: {item[0]} | "
                        f"{t('name')}: {item[1]} | "
                        f"{t('quantity')}: {item[2]} | "
                        f"{t('price')}: {item[3]:.2f} | "
                        f"{t('total')}: {item[4]:.2f}"
                    )

        # ====================================================
        # BACK
        # ====================================================

        elif choice == "4":

            return

        else:

            print(t("invalid_option"))