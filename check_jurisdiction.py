import sqlite3

db_path = 'd:/Historic Canada Site/historic-canada-api/historic_places.db'

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("--- PROVINCES ---")
    cursor.execute("SELECT DISTINCT province FROM places WHERE language='en' ORDER BY province LIMIT 20")
    for row in cursor.fetchall():
        print(row[0])

    print("\n--- JURISDICTIONS ---")
    cursor.execute("SELECT DISTINCT jurisdiction FROM places WHERE language='en' ORDER BY jurisdiction LIMIT 20")
    for row in cursor.fetchall():
        print(row[0])

    conn.close()
except Exception as e:
    print(f"Error: {e}")
