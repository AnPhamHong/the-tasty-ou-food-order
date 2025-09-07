import mysql.connector

db_config = {
    "host": "localhost",
    "user": "root",
    "password": "apth123456",
    "database": "food_order_db",
}

def get_db_connection():
    return mysql.connector.connect(**db_config)
