import sqlite3

conn = sqlite3.connect('dashboard_data.db')
c = conn.cursor()
c.execute("SELECT comite_gestion, local_nombre, COUNT(*) as cnt FROM ninos_summary WHERE periodo='202606' AND local_nombre IS NOT NULL AND local_nombre != '' GROUP BY comite_gestion, local_nombre ORDER BY cnt DESC LIMIT 5")
for r in c.fetchall():
    print(r)
