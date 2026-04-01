import sqlite3

test_db = r'd:\工作梳理\售后工单\202511\pear-admin-flask-test-1117\pear-admin-flask-test01\pear-admin-flask\pear01.db'
conn = sqlite3.connect(test_db)
cursor = conn.cursor()

print('=== ticket_flow 表结构 ===')
cursor.execute('PRAGMA table_info(ticket_flow)')
for col in cursor.fetchall():
    print(f'  {col[1]}: {col[2]}')

print('\n=== ticket_flow 全部数据 ===')
cursor.execute('SELECT * FROM ticket_flow')
rows = cursor.fetchall()

cursor.execute('PRAGMA table_info(ticket_flow)')
columns = [col[1] for col in cursor.fetchall()]

for row in rows:
    print('\n--- 记录 ---')
    for i, col in enumerate(columns):
        print(f'  {col}: {row[i]}')

conn.close()
