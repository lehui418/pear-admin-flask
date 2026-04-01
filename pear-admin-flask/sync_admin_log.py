import sqlite3
from datetime import datetime

prod_db = r'd:\工作梳理\售后工单\202511\pear-admin-flask-test-1117\pear-admin-flask-test01\pear.db'
test_db = r'd:\工作梳理\售后工单\202511\pear-admin-flask-test-1117\pear-admin-flask-test01\pear-admin-flask\pear01.db'

print('=== 开始同步 admin_log 数据 ===')

conn_prod = sqlite3.connect(prod_db)
conn_test = sqlite3.connect(test_db)
cursor_prod = conn_prod.cursor()
cursor_test = conn_test.cursor()

cursor_test.execute('SELECT COUNT(*) FROM admin_log')
before_count = cursor_test.fetchone()[0]
print(f'\n1. 测试环境当前 admin_log 数量: {before_count}')

print('\n2. 删除测试环境 admin_log 数据...')
cursor_test.execute('DELETE FROM admin_log')
conn_test.commit()
print('   删除完成')

cursor_prod.execute('SELECT COUNT(*) FROM admin_log')
prod_count = cursor_prod.fetchone()[0]
print(f'\n3. 生产环境 admin_log 数量: {prod_count}')

print('\n4. 获取生产环境 admin_log 表结构...')
cursor_prod.execute('PRAGMA table_info(admin_log)')
columns_info = cursor_prod.fetchall()
columns = [col[1] for col in columns_info]
print(f'   字段: {columns}')

print('\n5. 复制数据...')
cursor_prod.execute('SELECT * FROM admin_log')
rows = cursor_prod.fetchall()

placeholders = ', '.join(['?' for _ in columns])
insert_sql = f'INSERT INTO admin_log ({", ".join(columns)}) VALUES ({placeholders})'

cursor_test.executemany(insert_sql, rows)
conn_test.commit()

cursor_test.execute('SELECT COUNT(*) FROM admin_log')
after_count = cursor_test.fetchone()[0]
print(f'   复制完成，测试环境 admin_log 数量: {after_count}')

conn_prod.close()
conn_test.close()

print('\n=== 同步完成 ===')
print(f'  - 原数量: {before_count}')
print(f'  - 新数量: {after_count}')
print(f'  - 差异: {after_count - before_count:+d}')
