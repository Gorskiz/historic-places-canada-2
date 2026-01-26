import sqlite3
import os

db_path = 'd:/Historic Canada Site/historic_places.db'

try:
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        exit(1)

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("--- PROVINCES (Limit 20) ---")
    try:
        cursor.execute("SELECT DISTINCT province_territory FROM places WHERE name_en IS NOT NULL ORDER BY province_territory LIMIT 20")
        for row in cursor.fetchall():
            print(row[0])
    except sqlite3.OperationalError:
        try:
             # Fallback to 'province' if 'province_territory' doesn't exist (schema difference)
             cursor.execute("SELECT DISTINCT province FROM places WHERE language='en' ORDER BY province LIMIT 20")
             for row in cursor.fetchall():
                 print(row[0])
        except Exception as e:
            print(f"Error querying provinces: {e}")


    print("\n--- JURISDICTIONS (Limit 20) ---")
    try:
        cursor.execute("SELECT DISTINCT jurisdiction FROM places WHERE name_en IS NOT NULL ORDER BY jurisdiction LIMIT 20")
        for row in cursor.fetchall():
             print(row[0])
    except sqlite3.OperationalError:
        try:
             cursor.execute("SELECT DISTINCT jurisdiction FROM places WHERE language='en' ORDER BY jurisdiction LIMIT 20")
             for row in cursor.fetchall():
                 print(row[0])
        except Exception as e:
             print(f"Error querying jurisdictions: {e}")

    conn.close()
except Exception as e:
    print(f"Error: {e}")
