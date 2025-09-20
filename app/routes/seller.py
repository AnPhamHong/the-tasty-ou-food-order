from flask import Flask, request, jsonify, Blueprint, render_template, session, redirect, url_for
seller_bp = Blueprint('seller_bp', __name__)


from werkzeug.security import generate_password_hash
from datetime import datetime
from app.db import get_db_connection
from flask import send_from_directory
import json

seller_bp = Blueprint("seller", __name__)


@seller_bp.route("/api/seller/register", methods=["POST"])
def register_restaurant():
    data = request.json
    if not data:
        return jsonify({"message": "No data provided"}), 400

    restaurant = data.get("restaurant")
    admin = data.get("admin")
    categories = data.get("categories", [])
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

        # 1️⃣ Create restaurant
        cursor.execute(
            """
            INSERT INTO restaurants 
            (name, image_url, location, created_at, updated_at, rating, distance_km, delivery_time_min, tags, badges)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
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

        # 2️⃣ Insert menu items
        for item in menu:
            cursor.execute(
                """
                INSERT INTO products (restaurant_id, name, image_url, price, category, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
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

        # 3️⃣ Create admin account
        hashed_pw = generate_password_hash(admin["password"])
        cursor.execute(
            """
            INSERT INTO accounts (username, password, email, organisation, role, restaurant_id, address)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """,
            (
                admin["username"],
                hashed_pw,
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

@seller_bp.route('/api/menu', methods=['GET'])
def get_menu():
    restaurant_id = request.args.get('restaurant_id', type=int)
    if not restaurant_id:
        return jsonify({'status':'error','message':'restaurant_id is required'}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Kiểm tra restaurant_id tồn tại
    cursor.execute("SELECT id FROM restaurants WHERE id=%s", (restaurant_id,))
    restaurant = cursor.fetchone()
    if not restaurant:
        return jsonify({'status':'error','message':'Restaurant not found'}), 404

    cursor.execute("""
        SELECT id, name, description, image_url, price, category
        FROM products
        WHERE restaurant_id=%s
    """, (restaurant_id,))
    items = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(items)

# API: Add menu item
@seller_bp.route('/api/menu', methods=['POST'])
def add_menu_item():
    data = request.json
    restaurant_id = data.get('restaurant_id')  # lấy restaurant_id từ payload
    if not restaurant_id:
        return jsonify({'status':'error', 'message':'restaurant_id is required'}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Kiểm tra restaurant có tồn tại
    cursor.execute("SELECT id FROM restaurants WHERE id=%s", (restaurant_id,))
    restaurant = cursor.fetchone()
    if not restaurant:
        cursor.close()
        conn.close()
        return jsonify({'status':'error','message':'Restaurant not found'}), 400

    cursor.execute("""
        INSERT INTO products (restaurant_id, name, description, image_url, price, category)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (restaurant['id'], data['name'], data['description'], data['image_url'], data['price'], data['category']))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'status':'success'})


# API: Edit menu item
@seller_bp.route('/api/menu/<int:item_id>', methods=['PUT'])
def edit_menu_item(item_id):
    data = request.json
    restaurant_id = data.get('restaurant_id')
    if not restaurant_id:
        return jsonify({'status':'error','message':'restaurant_id missing'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE products
        SET name=%s, description=%s, image_url=%s, price=%s, category=%s
        WHERE id=%s AND restaurant_id=%s
    """, (data['name'], data['description'], data['image_url'], data['price'], data['category'], item_id, restaurant_id))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'status':'success','message':'Updated successfully'})


# API: Delete menu item
@seller_bp.route('/api/menu/<int:item_id>', methods=['DELETE'])
def delete_menu_item(item_id):
    data = request.get_json()
    restaurant_id = data.get('restaurant_id') if data else None
    if not restaurant_id:
        return jsonify({'status':'error','message':'restaurant_id missing'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM products WHERE id=%s AND restaurant_id=%s", (item_id, restaurant_id))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'status':'success','message':'Deleted successfully'})

@seller_bp.route('/api/categories', methods=['GET'])
def get_categories():
    restaurant_id = request.args.get('restaurant_id', type=int)
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT category FROM products WHERE restaurant_id=%s", (restaurant_id,))
    categories = [row[0] for row in cursor.fetchall() if row[0]]
    cursor.close()
    conn.close()
    return jsonify(categories)
