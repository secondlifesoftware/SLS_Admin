"""
Script to add person, start_time, end_time, hours columns to invoice_expenses table
"""
from sqlalchemy import text
from database import engine

def add_expense_fields():
    """Add new fields to invoice_expenses table if they don't exist"""
    with engine.connect() as conn:
        try:
            # Check if columns exist and add them if they don't
            columns_to_add = [
                ('person', 'VARCHAR(255)'),
                ('start_time', 'VARCHAR(10)'),
                ('end_time', 'VARCHAR(10)'),
                ('hours', 'FLOAT'),
            ]
            
            for column_name, column_type in columns_to_add:
                result = conn.execute(text(f"""
                    SELECT COUNT(*) as count
                    FROM pragma_table_info('invoice_expenses')
                    WHERE name = '{column_name}'
                """))
                row = result.fetchone()
                
                if row and row[0] == 0:
                    # Column doesn't exist, add it
                    conn.execute(text(f"""
                        ALTER TABLE invoice_expenses
                        ADD COLUMN {column_name} {column_type}
                    """))
                    print(f"✅ Added {column_name} column to invoice_expenses table")
                else:
                    print(f"✅ {column_name} column already exists")
            
            conn.commit()
        except Exception as e:
            print(f"❌ Error: {e}")
            conn.rollback()

if __name__ == "__main__":
    add_expense_fields()

