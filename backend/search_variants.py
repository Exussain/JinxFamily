import sqlite3

conn = sqlite3.connect("/root/NubixShop/public/backend/db.sqlite3")
cursor = conn.cursor()

tables = ['shop_product', 'shop_productvariant']

for table_name in tables:
    try:
        cursor.execute(f"PRAGMA table_info({table_name});")
        columns = cursor.fetchall()
        
        text_cols = [col[1] for col in columns if "text" in col[2].lower() or "varchar" in col[2].lower() or "char" in col[2].lower()]
        
        if text_cols:
            query = f"SELECT * FROM {table_name} WHERE " + " OR ".join([f"{col} LIKE '%ساعت%'" for col in text_cols])
            cursor.execute(query)
            rows = cursor.fetchall()
            for row in rows:
                print(f"Table: {table_name}, Match: {row}")
    except Exception as e:
        print(f"Error on {table_name}: {e}")

