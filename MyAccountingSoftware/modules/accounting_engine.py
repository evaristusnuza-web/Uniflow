from database import cursor


# ============================================================
# CREATE JOURNAL ENTRY
# ============================================================

def create_journal_entry(description, lines, reference=None):

    cursor.execute("""
        INSERT INTO journal_entries
        (
            entry_date,
            reference,
            description,
            created_at
        )
        VALUES
        (
            DATE('now'),
            ?,
            ?,
            DATETIME('now')
        )
    """, (
        reference,
        description
    ))

    journal_entry_id = cursor.lastrowid

    for line in lines:

        account_code = line["account_code"]
        debit = float(line.get("debit", 0))
        credit = float(line.get("credit", 0))

        cursor.execute("""
            SELECT id
            FROM accounts
            WHERE account_code = ?
            AND is_active = 1
        """, (account_code,))

        account = cursor.fetchone()

        if account is None:
            raise ValueError(
                f"Account code {account_code} not found."
            )

        account_id = account[0]

        cursor.execute("""
            INSERT INTO journal_lines
            (
                journal_entry_id,
                account_id,
                debit,
                credit
            )
            VALUES (?, ?, ?, ?)
        """, (
            journal_entry_id,
            account_id,
            debit,
            credit
        ))

    return journal_entry_id


# ============================================================
# SALES ACCOUNTING
# ============================================================

def record_sale_accounting(
    sale_id,
    total,
    payment_method,
    sale_items=None
):

    payment_accounts = {
        "Cash": "1010",
        "Bank": "1020",
        "Mobile Money": "1030",
        "Accounts Receivable": "1100"
    }

    debit_account_code = payment_accounts.get(
        payment_method
    )

    if debit_account_code is None:
        raise ValueError(
            f"Unknown payment method: {payment_method}"
        )

    description = f"Sale #{sale_id}"

    # --------------------------------------------------------
    # SALES REVENUE
    # --------------------------------------------------------

    lines = [
        {
            "account_code": debit_account_code,
            "debit": float(total),
            "credit": 0.0
        },
        {
            "account_code": "4010",
            "debit": 0.0,
            "credit": float(total)
        }
    ]

    create_journal_entry(
        description=description,
        lines=lines,
        reference=f"SALE-{sale_id}"
    )

    # --------------------------------------------------------
    # COGS + INVENTORY
    # --------------------------------------------------------

    if sale_items:

        total_cost = 0.0

        for item in sale_items:

            product_id = item[0]
            quantity = item[1]

            cursor.execute("""
                SELECT cost_price
                FROM products
                WHERE id = ?
            """, (product_id,))

            product = cursor.fetchone()

            if product is None:
                raise ValueError(
                    f"Product ID {product_id} not found."
                )

            cost_price = float(product[0] or 0)

            total_cost += cost_price * quantity

        if total_cost > 0:

            cogs_lines = [
                {
                    "account_code": "5010",
                    "debit": total_cost,
                    "credit": 0.0
                },
                {
                    "account_code": "1200",
                    "debit": 0.0,
                    "credit": total_cost
                }
            ]

            create_journal_entry(
                description=f"COGS for Sale #{sale_id}",
                lines=cogs_lines,
                reference=f"COGS-SALE-{sale_id}"
            )


# ============================================================
# PURCHASE ACCOUNTING
# ============================================================

def record_purchase_accounting(
    purchase_id,
    total,
    payment_method
):

    payment_accounts = {
        "Cash": "1010",
        "Bank": "1020",
        "Mobile Money": "1030",
        "Accounts Payable": "2010"
    }

    credit_account_code = payment_accounts.get(
        payment_method
    )

    if credit_account_code is None:
        raise ValueError(
            f"Unknown payment method: {payment_method}"
        )

    description = f"Purchase #{purchase_id}"

    lines = [
        {
            "account_code": "1200",
            "debit": float(total),
            "credit": 0.0
        },
        {
            "account_code": credit_account_code,
            "debit": 0.0,
            "credit": float(total)
        }
    ]

    create_journal_entry(
        description=description,
        lines=lines,
        reference=f"PURCHASE-{purchase_id}"
    )


# ============================================================
# CUSTOMER PAYMENT ACCOUNTING
# ============================================================

def record_customer_payment(
    payment_id,
    amount,
    payment_method
):

    payment_accounts = {
        "Cash": "1010",
        "Bank": "1020",
        "Mobile Money": "1030"
    }

    debit_account_code = payment_accounts.get(
        payment_method
    )

    if debit_account_code is None:
        raise ValueError(
            f"Unknown payment method: {payment_method}"
        )

    description = f"Customer Payment #{payment_id}"

    lines = [
        {
            "account_code": debit_account_code,
            "debit": float(amount),
            "credit": 0.0
        },
        {
            "account_code": "1100",
            "debit": 0.0,
            "credit": float(amount)
        }
    ]

    create_journal_entry(
        description=description,
        lines=lines,
        reference=f"PAY-{payment_id}"
    )


# ============================================================
# SUPPLIER PAYMENT ACCOUNTING
# ============================================================

def record_supplier_payment(
    payment_id,
    amount,
    payment_method
):

    payment_accounts = {
        "Cash": "1010",
        "Bank": "1020",
        "Mobile Money": "1030"
    }

    credit_account_code = payment_accounts.get(
        payment_method
    )

    if credit_account_code is None:
        raise ValueError(
            f"Unknown payment method: {payment_method}"
        )

    description = f"Supplier Payment #{payment_id}"

    lines = [
        {
            "account_code": "2010",
            "debit": float(amount),
            "credit": 0.0
        },
        {
            "account_code": credit_account_code,
            "debit": 0.0,
            "credit": float(amount)
        }
    ]

    create_journal_entry(
        description=description,
        lines=lines,
        reference=f"PAY-{payment_id}"
    )
