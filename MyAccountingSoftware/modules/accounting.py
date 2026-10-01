from database import cursor, connection
from languages import t


def accounting_menu():

    while True:

        print()
        print("================================")
        print(t("accounting"))
        print("================================")

        print("1.", t("chart_of_accounts"))
        print("2.", t("journal_entry"))
        print("3.", t("journal_entries"))
        print("4.", t("general_ledger"))
        print("5.", t("trial_balance"))
        print("6.", t("profit_loss"))
        print("7.", t("balance_sheet"))
        print("8.", t("back"))

        print()

        choice = input(
            t("choose_option") + " "
        ).strip()

        if choice == "1":
            chart_of_accounts()
            input("\nPress Enter to continue...")

        elif choice == "2":
            create_journal_entry()

        elif choice == "3":
            view_journal_entries()
            input("\nPress Enter to continue...")

        elif choice == "4":
            general_ledger()
            input("\nPress Enter to continue...")

        elif choice == "5":
            trial_balance()
            input("\nPress Enter to continue...")

        elif choice == "6":
            profit_loss()
            input("\nPress Enter to continue...")

        elif choice == "7":
            balance_sheet()
            input("\nPress Enter to continue...")

        elif choice == "8":
            return

        else:
            print()
            print(t("invalid_option"))
            input("\nPress Enter to continue...")


def chart_of_accounts():

    print()
    print("================================")
    print(t("chart_of_accounts"))
    print("================================")

    cursor.execute("""
        SELECT
            id,
            account_code,
            account_name,
            account_type
        FROM accounts
        WHERE is_active = 1
        ORDER BY account_code
    """)

    accounts = cursor.fetchall()

    if not accounts:
        print(t("not_found"))
        return

    for account in accounts:

        print(
            f"{t('id')}: {account[0]} | "
            f"{t('code')}: {account[1]} | "
            f"{t('name')}: {account[2]} | "
            f"Type: {account[3]}"
        )


def create_journal_entry():

    print()
    print("================================")
    print(t("journal_entry"))
    print("================================")

    description = input(
        t("enter_description") + " "
    ).strip()

    if not description:
        print(t("operation_cancelled"))
        return

    debit_id = input(
        "Enter debit account ID: "
    ).strip()

    credit_id = input(
        "Enter credit account ID: "
    ).strip()

    amount_text = input(
        t("enter_amount") + " "
    ).strip()

    try:
        debit_id = int(debit_id)
        credit_id = int(credit_id)
        amount = float(amount_text)

        if amount <= 0:
            raise ValueError

    except ValueError:
        print(t("invalid_amount"))
        return

    # Get debit account
    cursor.execute(
        """
        SELECT account_code
        FROM accounts
        WHERE id = ? AND is_active = 1
        """,
        (debit_id,)
    )

    debit_account = cursor.fetchone()

    if debit_account is None:
        print(t("not_found"))
        return

    # Get credit account
    cursor.execute(
        """
        SELECT account_code
        FROM accounts
        WHERE id = ? AND is_active = 1
        """,
        (credit_id,)
    )

    credit_account = cursor.fetchone()

    if credit_account is None:
        print(t("not_found"))
        return

    # Prepare journal lines
    lines = [
        {
            "account_code": debit_account[0],
            "description": description,
            "debit": amount,
            "credit": 0
        },
        {
            "account_code": credit_account[0],
            "description": description,
            "debit": 0,
            "credit": amount
        }
    ]

    # Save journal entry
    from modules.accounting_engine import (
        create_journal_entry as engine_create
    )

    try:

        engine_create(
            description=description,
            lines=lines
        )

        connection.commit()

        print()
        print(t("saved_successfully"))

    except Exception as e:

        connection.rollback()

        print()
        print("Error:", e)


def view_journal_entries():

    print()
    print("================================")
    print(t("journal_entries"))
    print("================================")

    cursor.execute("""
        SELECT
            id,
            entry_date,
            reference,
            description
        FROM journal_entries
        ORDER BY id DESC
    """)

    entries = cursor.fetchall()

    if not entries:
        print(t("not_found"))
        return

    for entry in entries:

        print(
            f"{t('id')}: {entry[0]} | "
            f"{t('date')}: {entry[1]} | "
            f"Reference: {entry[2] or '-'} | "
            f"{t('description')}: {entry[3]}"
        )


def general_ledger():

    print()
    print("================================")
    print(t("general_ledger"))
    print("================================")

    cursor.execute("""
        SELECT
            journal_lines.id,
            journal_entries.entry_date,
            accounts.account_code,
            accounts.account_name,
            journal_lines.debit,
            journal_lines.credit
        FROM journal_lines
        JOIN journal_entries
            ON journal_lines.journal_entry_id = journal_entries.id
        JOIN accounts
            ON journal_lines.account_id = accounts.id
        ORDER BY
            journal_entries.entry_date,
            journal_lines.id
    """)

    rows = cursor.fetchall()

    if not rows:
        print(t("not_found"))
        return

    for row in rows:

        print(
            f"{t('id')}: {row[0]} | "
            f"{t('date')}: {row[1]} | "
            f"{t('code')}: {row[2]} | "
            f"{t('name')}: {row[3]} | "
            f"Debit: {row[4]:.2f} | "
            f"Credit: {row[5]:.2f}"
        )


def trial_balance():

    print()
    print("================================")
    print(t("trial_balance"))
    print("================================")

    try:

        cursor.execute("""
            SELECT
                accounts.account_code,
                accounts.account_name,
                COALESCE(SUM(journal_lines.debit), 0),
                COALESCE(SUM(journal_lines.credit), 0)
            FROM accounts
            LEFT JOIN journal_lines
                ON accounts.id = journal_lines.account_id
            WHERE accounts.is_active = 1
            GROUP BY
                accounts.id,
                accounts.account_code,
                accounts.account_name
            ORDER BY accounts.account_code
        """)

        rows = cursor.fetchall()

        print()
        print("DEBUG: Trial Balance query executed successfully.")
        print("DEBUG: Number of accounts found:", len(rows))
        print()

        if not rows:
            print(t("not_found"))
            return

        total_debit = 0.0
        total_credit = 0.0

        print("ACCOUNT CODE | ACCOUNT NAME | DEBIT | CREDIT")
        print("-----------------------------------------------")

        for row in rows:

            code = row[0]
            name = row[1]

            debit = float(row[2] or 0)
            credit = float(row[3] or 0)

            total_debit += debit
            total_credit += credit

            print(
                f"{code:<12} | "
                f"{name:<25} | "
                f"{debit:>10.2f} | "
                f"{credit:>10.2f}"
            )

        print("-----------------------------------------------")
        print(
            f"{'TOTAL':<40} "
            f"{total_debit:>10.2f} | "
            f"{total_credit:>10.2f}"
        )
        print("-----------------------------------------------")

        if abs(total_debit - total_credit) < 0.01:
            print("Trial Balance: BALANCED")
        else:
            print("Trial Balance: NOT BALANCED")

    except Exception as e:

        print()
        print("ERROR IN TRIAL BALANCE:")
        print(e)


def profit_loss():

    print()
    print("================================")
    print(t("profit_loss"))
    print("================================")

    cursor.execute("""
        SELECT
            accounts.account_code,
            accounts.account_name,
            accounts.account_type,
            COALESCE(SUM(journal_lines.debit), 0),
            COALESCE(SUM(journal_lines.credit), 0)
        FROM accounts
        LEFT JOIN journal_lines
            ON accounts.id = journal_lines.account_id
        WHERE accounts.account_type IN ('Revenue', 'Expense')
        AND accounts.is_active = 1
        GROUP BY
            accounts.id,
            accounts.account_code,
            accounts.account_name,
            accounts.account_type
        ORDER BY accounts.account_code
    """)

    rows = cursor.fetchall()

    if not rows:
        print(t("not_found"))
        return

    total_revenue = 0.0
    total_expenses = 0.0

    print()

    for row in rows:

        code = row[0]
        name = row[1]
        account_type = row[2]
        debit = row[3] or 0
        credit = row[4] or 0

        if account_type == "Revenue":

            amount = credit - debit
            total_revenue += amount

            if amount != 0:
                print(
                    f"Revenue | "
                    f"Code: {code} | "
                    f"Name: {name} | "
                    f"Amount: {amount:.2f}"
                )

        elif account_type == "Expense":

            amount = debit - credit
            total_expenses += amount

            if amount != 0:
                print(
                    f"Expense | "
                    f"Code: {code} | "
                    f"Name: {name} | "
                    f"Amount: {amount:.2f}"
                )

    net_profit = total_revenue - total_expenses

    print("--------------------------------")
    print(f"TOTAL REVENUE:  {total_revenue:.2f}")
    print(f"TOTAL EXPENSES: {total_expenses:.2f}")
    print("--------------------------------")

    if net_profit >= 0:
        print(f"NET PROFIT:     {net_profit:.2f}")
    else:
        print(f"NET LOSS:       {abs(net_profit):.2f}")

    print("--------------------------------")


def balance_sheet():

    print()
    print("================================")
    print(t("balance_sheet"))
    print("================================")

    cursor.execute("""
        SELECT
            accounts.account_code,
            accounts.account_type,
            accounts.account_name,
            COALESCE(SUM(journal_lines.debit), 0),
            COALESCE(SUM(journal_lines.credit), 0)
        FROM accounts
        LEFT JOIN journal_lines
            ON accounts.id = journal_lines.account_id
        WHERE accounts.account_type IN (
            'Asset',
            'Liability',
            'Equity'
        )
        AND accounts.is_active = 1
        GROUP BY
            accounts.id,
            accounts.account_code,
            accounts.account_type,
            accounts.account_name
        ORDER BY accounts.account_code
    """)

    rows = cursor.fetchall()

    if not rows:
        print(t("not_found"))
        return

    total_assets = 0.0
    total_liabilities = 0.0
    total_equity = 0.0

    print()

    for row in rows:

        code = row[0]
        account_type = row[1]
        name = row[2]

        debit = float(row[3] or 0)
        credit = float(row[4] or 0)

        if account_type == "Asset":

            amount = debit - credit
            total_assets += amount

        elif account_type == "Liability":

            amount = credit - debit
            total_liabilities += amount

        else:

            amount = credit - debit
            total_equity += amount

        print(
            f"Code: {code} | "
            f"Name: {name} | "
            f"Type: {account_type} | "
            f"Amount: {amount:.2f}"
        )

    # Calculate current profit/loss
    cursor.execute("""
        SELECT
            COALESCE(
                SUM(
                    CASE
                        WHEN accounts.account_type = 'Revenue'
                        THEN journal_lines.credit - journal_lines.debit
                        ELSE 0
                    END
                ), 0
            ),
            COALESCE(
                SUM(
                    CASE
                        WHEN accounts.account_type = 'Expense'
                        THEN journal_lines.debit - journal_lines.credit
                        ELSE 0
                    END
                ), 0
            )
        FROM accounts
        LEFT JOIN journal_lines
            ON accounts.id = journal_lines.account_id
        WHERE accounts.account_type IN ('Revenue', 'Expense')
        AND accounts.is_active = 1
    """)

    profit_row = cursor.fetchone()

    total_revenue = float(profit_row[0] or 0)
    total_expenses = float(profit_row[1] or 0)

    net_profit = total_revenue - total_expenses

    print("--------------------------------")
    print(f"Assets:              {total_assets:.2f}")
    print(f"Liabilities:         {total_liabilities:.2f}")
    print(f"Equity:              {total_equity:.2f}")
    print(f"Current Net Profit:  {net_profit:.2f}")
    print("--------------------------------")

    total_equity_with_profit = total_equity + net_profit

    liabilities_equity = (
        total_liabilities + total_equity_with_profit
    )

    print(
        f"Liabilities + Equity: "
        f"{liabilities_equity:.2f}"
    )

    print("--------------------------------")

    if abs(total_assets - liabilities_equity) < 0.01:
        print("Balance Sheet: BALANCED")
    else:
        print("Balance Sheet: NOT BALANCED")