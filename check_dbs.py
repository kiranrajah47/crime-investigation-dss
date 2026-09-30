import sqlite3, glob

for db in glob.glob('**/*.db', recursive=True):
    try:
        conn = sqlite3.connect(db)
        tables = [r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
        print(f"DB: {db}, tables: {tables}")
        for t in tables:
            for row in conn.execute(f"SELECT * FROM {t}").fetchall():
                s = str(row)
                if any(k in s for k in ['Victor', 'Petrov', 'DCosta', 'Borkar']):
                    print(f"FOUND in {db} {t}")
    except Exception as e:
        print(f"ERR {db}: {e}")
print("Done search")
