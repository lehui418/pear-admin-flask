import sqlite3

test_db = r'd:\工作梳理\售后工单\202511\pear-admin-flask-test-1117\pear-admin-flask-test01\pear-admin-flask\pear01.db'
conn = sqlite3.connect(test_db)
cursor = conn.cursor()

cursor.execute('SELECT COUNT(*) FROM ticket_flow')
before_count = cursor.fetchone()[0]
print(f'清空前 ticket_flow 数量: {before_count}')

cursor.execute('DELETE FROM ticket_flow')
conn.commit()

cursor.execute('SELECT COUNT(*) FROM ticket_flow')
after_count = cursor.fetchone()[0]
print(f'清空后 ticket_flow 数量: {after_count}')

conn.close()
print('ticket_flow 表已清空')
