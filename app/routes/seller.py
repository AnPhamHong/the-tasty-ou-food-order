from flask import (
    request,
    jsonify,
    Blueprint,
    render_template,
    session,
    redirect,
    url_for,
    send_from_directory,
)

from app import mail
from flask_mail import Message


from datetime import datetime
from app.db import get_db_connection
import json

seller_bp = Blueprint("seller", __name__)


@seller_bp.route("/api/seller/register", methods=["POST"])
def register_restaurant():
    data = request.json
    if not data:
        return jsonify({"message": "No data provided"}), 400

    restaurant = data.get("restaurant")
    admin = data.get("admin")
    menu = data.get("menu", [])

    if not restaurant or not admin or not menu:
        return jsonify({"message": "Missing required fields"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        now = datetime.utcnow()

        # Lấy thêm dữ liệu nếu có hoặc set mặc định
        rating = restaurant.get("rating", 5)
        distance_km = restaurant.get("distance_km", 1.5)
        delivery_time_min = restaurant.get("delivery_time_min", 50)
        tags = restaurant.get("tags", ["fast_delivery", "cost"])
        badges = restaurant.get("badges", ["newest"])

        # Create restaurant
        cursor.execute(
            """
            INSERT INTO restaurants (
                name,
                image_url,
                location,
                created_at,
                updated_at,
                rating,
                distance_km,
                delivery_time_min,
                tags,
                badges
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                restaurant["name"],
                restaurant.get("image_url", ""),
                restaurant["location"],
                now,
                now,
                rating,
                distance_km,
                delivery_time_min,
                json.dumps(tags),
                json.dumps(badges),
            ),
        )
        restaurant_id = cursor.lastrowid

        # Insert menu items
        for item in menu:
            cursor.execute(
                """
                INSERT INTO products (
                    restaurant_id,
                    name,
                    image_url,
                    price,
                    category,
                    created_at,
                    updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    restaurant_id,
                    item["name"],
                    item.get("image_url", ""),
                    item["price"],
                    item["category"],
                    now,
                    now,
                ),
            )

        # Create admin account
        cursor.execute(
            """
            INSERT INTO accounts (
                username,
                password,
                email,
                organisation,
                role,
                restaurant_id,
                address
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                admin["username"],
                admin["password"],
                admin["email"],
                restaurant["name"],
                "seller_admin",
                restaurant_id,
                restaurant.get("location", ""),
            ),
        )

        conn.commit()

        return jsonify(
            {
                "message": "Restaurant registered successfully",
                "adminEmail": admin["email"],
            }
        )

    except Exception as e:
        conn.rollback()
        return jsonify({"message": str(e)}), 500

    finally:
        cursor.close()
        conn.close()


@seller_bp.route("/api/sample-restaurants")
def sample_restaurants():
    return send_from_directory("static/data", "restaurants_30.json")


@seller_bp.route("/seller-admin")
def seller_admin():
    if "loggedin" not in session:
        return redirect(url_for("auth.login_page"))

    # check role
    if not session.get("is_seller_admin"):
        return redirect(url_for("auth.index"))

    return render_template("seller_admin.html")


@seller_bp.route("/api/menu", methods=["GET"])
def get_menu():
    restaurant_id = request.args.get("restaurant_id", type=int)
    if not restaurant_id:
        return jsonify({"status": "error", "message": "restaurant_id is required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Kiểm tra restaurant_id tồn tại
    cursor.execute("SELECT id FROM restaurants WHERE id=%s", (restaurant_id,))
    restaurant = cursor.fetchone()
    if not restaurant:
        return jsonify({"status": "error", "message": "Restaurant not found"}), 404

    cursor.execute(
        """
        SELECT id, name, description, image_url, price, category
        FROM products
        WHERE restaurant_id=%s
    """,
        (restaurant_id,),
    )
    items = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(items)


# API: Add menu item
@seller_bp.route("/api/menu", methods=["POST"])
def add_menu_item():
    data = request.json
    restaurant_id = data.get("restaurant_id")  # lấy restaurant_id từ payload
    if not restaurant_id:
        return jsonify({"status": "error", "message": "restaurant_id is required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Kiểm tra restaurant có tồn tại
    cursor.execute("SELECT id FROM restaurants WHERE id=%s", (restaurant_id,))
    restaurant = cursor.fetchone()
    if not restaurant:
        cursor.close()
        conn.close()
        return jsonify({"status": "error", "message": "Restaurant not found"}), 400

    cursor.execute(
        """
        INSERT INTO products (
            restaurant_id,
            name,
            description,
            image_url,
            price,
            category
        ) VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (
            restaurant["id"],
            data["name"],
            data["description"],
            data["image_url"],
            data["price"],
            data["category"],
        ),
    )
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"status": "success"})


# API: Edit menu item
@seller_bp.route("/api/menu/<int:item_id>", methods=["PUT"])
def edit_menu_item(item_id):
    data = request.json
    restaurant_id = data.get("restaurant_id")
    if not restaurant_id:
        return jsonify({"status": "error", "message": "restaurant_id missing"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        UPDATE products
        SET name=%s, description=%s, image_url=%s, price=%s, category=%s
        WHERE id=%s AND restaurant_id=%s
    """,
        (
            data["name"],
            data["description"],
            data["image_url"],
            data["price"],
            data["category"],
            item_id,
            restaurant_id,
        ),
    )
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"status": "success", "message": "Updated successfully"})


# API: Delete menu item
@seller_bp.route("/api/menu/<int:item_id>", methods=["DELETE"])
def delete_menu_item(item_id):
    data = request.get_json()
    restaurant_id = data.get("restaurant_id") if data else None
    if not restaurant_id:
        return jsonify({"status": "error", "message": "restaurant_id missing"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "DELETE FROM products WHERE id=%s AND restaurant_id=%s",
        (item_id, restaurant_id),
    )
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"status": "success", "message": "Deleted successfully"})


@seller_bp.route("/api/categories", methods=["GET"])
def get_categories():
    restaurant_id = request.args.get("restaurant_id", type=int)
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT DISTINCT category FROM products WHERE restaurant_id=%s",
        (restaurant_id,),
    )
    categories = [row[0] for row in cursor.fetchall() if row[0]]
    cursor.close()
    conn.close()
    return jsonify(categories)


@seller_bp.route("/api/user", methods=["GET", "PUT"])
def api_user():
    if request.method == "GET":
        user_id = request.args.get("user_id", type=int)
        if not user_id:
            return jsonify({"status": "error", "message": "user_id missing"}), 400
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT username, email FROM accounts WHERE id=%s", (user_id,))
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        if not user:
            return jsonify({"status": "error", "message": "User not found"}), 404
        # get avatar from restaurants table
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.close()
        conn.close()
        return jsonify({"status": "success", "user": user})

    if request.method == "PUT":
        user_id = request.form.get("user_id")
        username = request.form.get("username")
        email = request.form.get("email")
        password = request.form.get("password")

        if not user_id:
            return jsonify({"status": "error", "message": "user_id missing"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        if username:
            cursor.execute(
                "UPDATE accounts SET username=%s WHERE id=%s", (username, user_id)
            )
        if email:
            cursor.execute("UPDATE accounts SET email=%s WHERE id=%s", (email, user_id))
        if password:
            cursor.execute(
                "UPDATE accounts SET password=%s WHERE id=%s", (password, user_id)
            )
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"status": "success", "message": "Updated successfully"})


@seller_bp.route("/orders/restaurant/<int:restaurant_id>", methods=["GET"])
def get_orders_by_restaurant(restaurant_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        """
        SELECT o.*, COUNT(oi.id) AS items_count
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.restaurant_id=%s
        GROUP BY o.id
        ORDER BY o.order_time DESC
    """,
        (restaurant_id,),
    )
    orders = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(orders)


@seller_bp.route("/orders/transaction/<transaction_id>", methods=["GET"])
def get_order_by_transaction(transaction_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Lấy thông tin đơn hàng
    cursor.execute("SELECT * FROM orders WHERE transaction_id=%s", (transaction_id,))
    order = cursor.fetchone()

    if not order:
        cursor.close()
        conn.close()
        return jsonify({"error": "Order not found"}), 404

    # Lấy các item của order
    cursor.execute("SELECT * FROM order_items WHERE order_id=%s", (order["id"],))
    items = cursor.fetchall()

    cursor.close()
    conn.close()

    order["items"] = items
    return jsonify(order)


@seller_bp.route("/orders/<int:order_id>/status", methods=["PUT"])
def update_order_status(order_id):
    data = request.json
    new_status = data.get("status")
    reason = data.get("reason")  # nếu từ chối

    valid_status = [
        "Pending",
        "Preparing",
        "Rejected",
        "Delivering",
        "Completed",
        "Cancelled",
    ]
    if new_status not in valid_status:
        return jsonify({"error": "Invalid status"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Cập nhật trạng thái
        cursor.execute(
            "UPDATE orders SET status=%s WHERE id=%s", (new_status, order_id)
        )
        conn.commit()

        # Lấy email & tên khách
        cursor.execute(
            "SELECT email, recipient_name FROM orders WHERE id=%s", (order_id,)
        )
        row = cursor.fetchone()
        if row:
            email, name = row
            if email:
                subject = f"Order #{order_id} Status Update"
                body = f"Hello {name},\nYour order status has changed to: {new_status}"
                if reason and new_status == "Rejected":
                    body += f"\nReason: {reason}"

                # Gửi email thông báo
                msg = Message(subject, recipients=[email])
                msg.body = body
                mail.send(msg)

        return jsonify(
            {"message": f"Order {order_id} updated to {new_status}", "reason": reason}
        )
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@seller_bp.route("/promotions", methods=["POST"])
def create_promotion():
    data = request.json
    restaurant_id = data.get("restaurant_id")
    name = data.get("name")
    start_date = data.get("start_date")
    end_date = data.get("end_date")
    discount_pct = data.get("discount_pct", 0)
    product_ids = data.get("product_ids", [])

    if not all([restaurant_id, name, start_date, end_date]):
        return jsonify({"error": "Missing required fields"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            INSERT INTO promotions (
                restaurant_id,
                name,
                start_date,
                end_date,
                discount_pct,
                active
            ) VALUES (%s, %s, %s, %s, %s, 1)
            """,
            (restaurant_id, name, start_date, end_date, discount_pct),
        )
        promotion_id = cursor.lastrowid

        for food_id in product_ids:
            cursor.execute(
                """
                INSERT INTO promotion_items (
                    promotion_id,
                    product_id
                ) VALUES (%s, %s)
                """,
                (promotion_id, food_id),
            )
        conn.commit()
        return jsonify(
            {"message": "Promotion created with items", "promotion_id": promotion_id}
        )
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@seller_bp.route("/promotions/<int:promotion_id>/items", methods=["POST"])
def add_items_to_promotion(promotion_id):
    data = request.json
    product_ids = data.get("product_ids", [])  # danh sách food_id

    if not product_ids:
        return jsonify({"error": "No products provided"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        for food_id in product_ids:
            cursor.execute(
                """
                INSERT INTO promotion_items (
                    promotion_id,
                    product_id
                ) VALUES (%s, %s)
                """,
                (promotion_id, food_id),
            )
        conn.commit()
        return jsonify({"message": "Products added to promotion"})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@seller_bp.route("/promotions/restaurant/<int:restaurant_id>", methods=["GET"])
def get_promotions_by_restaurant(restaurant_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Lấy các promotion của nhà hàng
    cursor.execute(
        "SELECT * FROM promotions WHERE restaurant_id=%s AND active=1", (restaurant_id,)
    )
    promos = cursor.fetchall()

    for promo in promos:
        # Lấy danh sách sản phẩm được áp dụng promotion
        cursor.execute(
            """
            SELECT p.id, p.name, p.price, p.image_url
            FROM promotion_items pi
            JOIN products p ON pi.product_id = p.id
            WHERE pi.promotion_id=%s
            """,
            (promo["id"],),
        )
        promo["items"] = cursor.fetchall()

    cursor.close()
    conn.close()
    return jsonify(promos)
