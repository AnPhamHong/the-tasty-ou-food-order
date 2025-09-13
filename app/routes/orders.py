from flask import Blueprint, jsonify
from app.db import get_db_connection  # giả sử dùng mysql-connector
# import mysql.connector  # nếu chưa import

orders_bp = Blueprint("orders", __name__)

@orders_bp.route("/orders/<int:user_id>", methods=["GET"])
def get_orders(user_id):
    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)

    # Lấy orders
    cur.execute("""
        SELECT id AS order_id, restaurant_name, transaction_id, order_time, status, total
        FROM orders
        WHERE user_id = %s
        ORDER BY order_time DESC
    """, (user_id,))
    orders = cur.fetchall()

    # Lấy items và tính tổng quantity + tổng tiền cho mỗi order
    for order in orders:
        cur.execute("""
            SELECT food_name, quantity, price
            FROM order_items
            WHERE order_id = %s
        """, (order['order_id'],))
        items = cur.fetchall()
        order['items'] = items
        order['totalQuantity'] = sum(item['quantity'] for item in items)

    cur.close()
    conn.close()

    if not orders:
        return jsonify({"message": "No orders found for this user"}), 404

    return jsonify({"user_id": user_id, "orders": orders})