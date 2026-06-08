SET @database_name = DATABASE();

SET @add_customer_name_sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE product_suggestion ADD COLUMN customer_name VARCHAR(255) NULL AFTER title',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @database_name
      AND TABLE_NAME = 'product_suggestion'
      AND COLUMN_NAME = 'customer_name'
);

PREPARE add_customer_name_stmt FROM @add_customer_name_sql;
EXECUTE add_customer_name_stmt;
DEALLOCATE PREPARE add_customer_name_stmt;
