"""
Script to add theme_preference column to user_profiles table
"""
from sqlalchemy import text
from database import engine

def add_theme_preference_column():
    """Add theme_preference column to user_profiles table if it doesn't exist"""
    with engine.connect() as conn:
        try:
            # Check if column exists
            result = conn.execute(text("""
                SELECT COUNT(*) as count
                FROM pragma_table_info('user_profiles')
                WHERE name = 'theme_preference'
            """))
            row = result.fetchone()
            
            if row and row[0] == 0:
                # Column doesn't exist, add it
                conn.execute(text("""
                    ALTER TABLE user_profiles
                    ADD COLUMN theme_preference VARCHAR(20) DEFAULT 'dark'
                """))
                conn.commit()
                print("✅ Added theme_preference column to user_profiles table")
            else:
                print("✅ theme_preference column already exists")
        except Exception as e:
            print(f"❌ Error: {e}")
            conn.rollback()

if __name__ == "__main__":
    add_theme_preference_column()

