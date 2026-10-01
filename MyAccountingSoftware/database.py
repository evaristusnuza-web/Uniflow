import sqlite3
from pathlib import Path


# ============================================================
# DATABASE CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "accounting.db"

connection = sqlite3.connect(DB_PATH)
connection.execute("PRAGMA foreign_keys = ON")

cursor = connection.cursor()


# ============================================================
# DATABASE INITIALIZATION
# ============================================================

def initialize_database():

    # --------------------------------------------------------
    # CUSTOMERS
    # --------------------------------------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT
        )
    """)

    # --------------------------------------------------------
    # SUPPLIERS
    # --------------------------------------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS suppliers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT
        )
    """)

    # --------------------------------------------------------
    # PRODUCTS
    # --------------------------------------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            price REAL NOT NULL DEFAULT 0,
            quantity INTEGER NOT NULL DEFAULT 0
        )
    """)

    # --------------------------------------------------------
    # SALES
    # --------------------------------------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER,
            sale_date TEXT NOT NULL,
            total REAL NOT NULL,
            payment_method TEXT,

            FOREIGN KEY (customer_id)
                REFERENCES customers(id)
        )
    """)

    # --------------------------------------------------------
    # SALE ITEMS
    # --------------------------------------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sale_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sale_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            price REAL NOT NULL,
            subtotal REAL NOT NULL,

            FOREIGN KEY (sale_id)
                REFERENCES sales(id),

            FOREIGN KEY (product_id)
                REFERENCES products(id)
        )
    """)

    # --------------------------------------------------------
    # PURCHASES
    # --------------------------------------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS purchases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            supplier_id INTEGER,
            purchase_date TEXT NOT NULL,
            total REAL NOT NULL,

            FOREIGN KEY (supplier_id)
                REFERENCES suppliers(id)
        )
    """)

    # --------------------------------------------------------
    # PURCHASE ITEMS
    # --------------------------------------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS purchase_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            purchase_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            price REAL NOT NULL,
            subtotal REAL NOT NULL,

            FOREIGN KEY (purchase_id)
                REFERENCES purchases(id),

            FOREIGN KEY (product_id)
                REFERENCES products(id)
        )
    """)

    # --------------------------------------------------------
    # PAYMENTS
    # --------------------------------------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            payment_type TEXT NOT NULL,
            customer_id INTEGER,
            supplier_id INTEGER,
            amount REAL NOT NULL,
            payment_method TEXT NOT NULL,
            payment_date TEXT NOT NULL,
            description TEXT,

            FOREIGN KEY (customer_id)
                REFERENCES customers(id),

            FOREIGN KEY (supplier_id)
                REFERENCES suppliers(id)
        )
    """)

    # ========================================================
    # ACCOUNTING TABLES
    # ========================================================

    # --------------------------------------------------------
    # CHART OF ACCOUNTS
    # --------------------------------------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_code TEXT NOT NULL UNIQUE,
            account_name TEXT NOT NULL,
            account_type TEXT NOT NULL,
            parent_id INTEGER,
            is_active INTEGER NOT NULL DEFAULT 1,

            FOREIGN KEY (parent_id)
                REFERENCES accounts(id)
        )
    """)

    # --------------------------------------------------------
    # JOURNAL ENTRIES
    # --------------------------------------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS journal_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entry_date TEXT NOT NULL,
            reference TEXT,
            description TEXT,
            created_at TEXT NOT NULL
        )
    """)

    # --------------------------------------------------------
    # JOURNAL LINES
    # --------------------------------------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS journal_lines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            journal_entry_id INTEGER NOT NULL,
            account_id INTEGER NOT NULL,
            description TEXT,
            debit REAL NOT NULL DEFAULT 0,
            credit REAL NOT NULL DEFAULT 0,

            FOREIGN KEY (journal_entry_id)
                REFERENCES journal_entries(id),

            FOREIGN KEY (account_id)
                REFERENCES accounts(id)
        )
    """)

    # --------------------------------------------------------
    # ACCOUNTING SETTINGS
    # --------------------------------------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS accounting_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            setting_name TEXT NOT NULL UNIQUE,
            setting_value TEXT
        )
    """)

    # --------------------------------------------------------
    # DEFAULT ACCOUNTS
    # --------------------------------------------------------

    default_accounts = [

        ("1010", "Cash", "Asset"),
        ("1020", "Bank", "Asset"),
        ("1030", "Mobile Money", "Asset"),

        ("1100", "Accounts Receivable", "Asset"),
        ("1200", "Inventory", "Asset"),

        ("2010", "Accounts Payable", "Liability"),

        ("3010", "Owner's Capital", "Equity"),
        ("3020", "Retained Earnings", "Equity"),

        ("4010", "Sales Revenue", "Revenue"),

        ("5010", "Cost of Goods Sold", "Expense"),
        ("5020", "Operating Expenses", "Expense"),
    ]

    for code, name, account_type in default_accounts:

        cursor.execute(
            """
            INSERT OR IGNORE INTO accounts
            (
                account_code,
                account_name,
                account_type
            )
            VALUES (?, ?, ?)
            """,
            (
                code,
                name,
                account_type
            )
        )

    connection.commit()


# ============================================================
# DATABASE MIGRATIONS
# ============================================================

def migrate_database():

    # --------------------------------------------------------
    # CHECK SALES TABLE
    # --------------------------------------------------------

    cursor.execute("""
        PRAGMA table_info(sales)
    """)

    columns = cursor.fetchall()

    column_names = [
        column[1]
        for column in columns
    ]

    # --------------------------------------------------------
    # ADD PAYMENT METHOD IF MISSING
    # --------------------------------------------------------

    if "payment_method" not in column_names:

        cursor.execute("""
            ALTER TABLE sales
            ADD COLUMN payment_method TEXT
        """)

        connection.commit()

        print("Database updated successfully.")


# ============================================================
# CLOSE DATABASE
# ============================================================

def close_database():

    connection.close()


# ============================================================
# INITIALIZE DATABASE
# ============================================================

initialize_database()
migrate_database()