from flask import Blueprint, jsonify, request
from app.db import get_db_connection
from datetime import datetime

orders_bp = Blueprint("orders", __name__)


@orders_bp.route("/orders/<int:user_id>", methods=["GET"])
def get_orders(user_id):
    conn = get_db_connection()
    print("DEBUG DB:", conn.database)

    cur = conn.cursor(dictionary=True)
    # Query orders
    cur.execute(
        """
    SELECT id AS order_id,
           restaurant_name,
           transaction_id,
           order_time,
           status,
           total
    FROM orders
    WHERE user_id = %s
    ORDER BY order_time DESC
    """,
        (user_id,),
    )
    orders = cur.fetchall()
    print("Orders fetched RAW:", orders)

    if not orders:
        cur.close()
        conn.close()
        return jsonify({"message": "No orders found for this user"}), 200

    # Query items cho từng order
    for order in orders:
        cur.execute(
            """
            SELECT food_name, quantity, price, image_url, note
            FROM order_items
            WHERE order_id = %s
        """,
            (order["order_id"],),
        )
        items = cur.fetchall()
        order["items"] = items
        order["totalQuantity"] = sum(item["quantity"] for item in items)
        order["totalPrice"] = sum(item["quantity"] * item["price"] for item in items)

    cur.close()
    conn.close()

    return jsonify({"user_id": user_id, "orders": orders})


@orders_bp.route("/orders/<string:transaction_id>/cancel", methods=["POST"])
def cancel_order(transaction_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT status FROM orders WHERE transaction_id=%s", (transaction_id,)
        )
        row = cursor.fetchone()
        if not row:
            return jsonify({"error": "Order not found"}), 404
        if row[0] != "Pending":
            return jsonify({"error": "Order cannot be cancelled"}), 400

        cursor.execute(
            "UPDATE orders SET status=%s WHERE transaction_id=%s",
            ("Cancelled", transaction_id),
        )
        conn.commit()
        return jsonify({"message": "Order cancelled successfully"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@orders_bp.route("/orders/create", methods=["POST"])
def create_order():

    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # ---- Generate transaction_id tăng dần ----
        cursor.execute("SELECT transaction_id FROM orders ORDER BY id DESC LIMIT 1")
        last_txn = cursor.fetchone()
        if last_txn and last_txn[0].startswith("TXN"):
            last_num = int(last_txn[0][3:])
            new_num = last_num + 1
        else:
            new_num = 1
        transaction_id = f"TXN{new_num:04d}"  # TXN0001, TXN0002...

        # ---- Lấy dữ liệu từ client ----
        user_id = data["user_id"]
        restaurant_id = data["restaurant_id"]
        restaurant_name = data["restaurant_name"]
        recipient_name = data["recipient_name"]
        phone_number = data["phone_number"]
        email = data["email"]
        address = data["address"]
        payment_method = data["payment_method"]
        subtotal = data["subtotal"]
        savings = data.get("savings", 0)
        store_pickup = data.get("store_pickup", 0)
        tax = data["tax"]
        total = subtotal + savings + store_pickup + tax
        status = "Pending"
        order_time = datetime.now()

        # ---- Insert vào orders ----
        cursor.execute(
            """
            INSERT INTO orders (
                user_id, restaurant_id, restaurant_name, transaction_id,
                order_time, status, recipient_name, phone_number, email,
                address, payment_method, subtotal, savings, store_pickup, tax, total
            ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """,
            (
                user_id,
                restaurant_id,
                restaurant_name,
                transaction_id,
                order_time,
                status,
                recipient_name,
                phone_number,
                email,
                address,
                payment_method,
                subtotal,
                savings,
                store_pickup,
                tax,
                total,
            ),
        )

        order_id = cursor.lastrowid

        # ---- Insert order_items ----
        items = data["items"]
        for item in items:
            cursor.execute(
                (
                    "INSERT INTO order_items "
                    "(order_id, food_id, food_name, quantity, price, image_url, note) "
                    "VALUES (%s, %s, %s, %s, %s, %s, %s)"
                ),
                (
                    order_id,
                    item["food_id"],
                    item["food_name"],
                    item["quantity"],
                    item["price"],
                    item.get("image_url"),
                    item.get("note", ""),
                ),
            )
        conn.commit()

        return (
            jsonify(
                {
                    "message": "Order created successfully",
                    "order_id": order_id,
                    "transaction_id": transaction_id,
                }
            ),
            201,
        )

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()
