from languages import choose_language, t, get_language_name

from modules.customers import customer_menu
from modules.suppliers import supplier_menu
from modules.products import product_menu
from modules.sales import sales_menu
from modules.purchases import purchase_menu
from modules.payments import payment_menu
from modules.accounting import accounting_menu
from modules.reports import reports_menu

from database import close_database


def main():

    # ==========================================
    # LANGUAGE SELECTION
    # ==========================================

    choose_language()

    while True:

        print()
        print("================================")
        print(t("app_title"))
        print("================================")
        print()

        print("1.", t("customers"))
        print("2.", t("suppliers"))
        print("3.", t("products_inventory"))
        print("4.", t("sales"))
        print("5.", t("purchases"))
        print("6.", t("payments"))
        print("7.", t("accounting"))
        print("8.", t("reports"))
        print("9.", t("exit"))

        print()

        choice = input(
            t("choose_option") + " "
        ).strip()

        if choice == "1":

            customer_menu()

        elif choice == "2":

            supplier_menu()

        elif choice == "3":

            product_menu()

        elif choice == "4":

            sales_menu()

        elif choice == "5":

            purchase_menu()

        elif choice == "6":

            payment_menu()

        elif choice == "7":

            accounting_menu()

        elif choice == "8":

            reports_menu()

        elif choice == "9":

            print()
            print(
                t("exit")
            )

            close_database()

            break

        else:

            print()
            print(
                t("invalid_option")
            )


if __name__ == "__main__":
    main()