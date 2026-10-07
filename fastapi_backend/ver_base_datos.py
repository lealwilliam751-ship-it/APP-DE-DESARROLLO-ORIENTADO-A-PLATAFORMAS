import sqlite3
import os
import sys

# Ensure UTF-8 output on Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

db_path = os.path.join(os.path.dirname(__file__), "ecopuntos.db")

def print_table(cursor, table_name):
    print(f"\n========================================================")
    print(f" TABLA: {table_name.upper()}")
    print(f"========================================================")
    cursor.execute(f"PRAGMA table_info({table_name});")
    columns = [col[1] for col in cursor.fetchall()]
    print(" | ".join([f"{col:<15}" for col in columns]))
    print("-" * 75)
    
    cursor.execute(f"SELECT * FROM {table_name};")
    rows = cursor.fetchall()
    if not rows:
        print(" (Tabla vacía)")
    for row in rows:
        print(" | ".join([f"{str(val):<15}" for val in row]))
    print(f"Total registros: {len(rows)}")

def main():
    if not os.path.exists(db_path):
        print(f"Archivo de base de datos no encontrado en: {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [t[0] for t in cursor.fetchall() if not t[0].startswith("sqlite")]

    print("\nRESUMEN DE BASE DE DATOS LOCAL (ecopuntos.db)")
    print(f"Ubicación: {db_path}\n")

    for table in tables:
        print_table(cursor, table)

    conn.close()

if __name__ == "__main__":
    main()
