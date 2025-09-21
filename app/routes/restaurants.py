from flask import Blueprint, request, jsonify
from app.db import get_db_connection

restaurants_bp = Blueprint("restaurants", __name__)


# GET /restaurants?tab=rating
@restaurants_bp.route("/restaurants", methods=["GET"])
def get_restaurants():
    tab = request.args.get("tab", "rating")
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 12))
    offset = (page - 1) * limit

    order_clause = ""
    where_clause = ""
    if tab == "rating":
        where_clause = "JSON_CONTAINS(tags, '\"rating\"')"
        order_clause = "ORDER BY rating DESC"
    elif tab == "fast_delivery":
        where_clause = "JSON_CONTAINS(tags, '\"fast_delivery\"')"
        order_clause = "ORDER BY delivery_time_min ASC"
    elif tab == "pure_veg":
        where_clause = "JSON_CONTAINS(tags, '\"pure_veg\"')"
        order_clause = "ORDER BY rating DESC"
    elif tab == "cost":
        where_clause = "JSON_CONTAINS(tags, '\"cost\"')"
        order_clause = "ORDER BY (SELECT AVG(price) FROM products p WHERE p.restaurant_id = r.id) ASC"
    else:
        where_clause = "1"

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # tổng số restaurants
    cursor.execute(f"SELECT COUNT(*) as total FROM restaurants r WHERE {where_clause}")
    total = cursor.fetchone()["total"]

    # phân trang
    cursor.execute(
        f"""
        SELECT *
        FROM restaurants r
        WHERE {where_clause}
        {order_clause}
        LIMIT %s OFFSET %s
    """,
        (limit, offset),
    )
    restaurants = cursor.fetchall()

    # Lấy top 2–3 sản phẩm cho mỗi nhà hàng
    for r in restaurants:
        cursor.execute(
            """
            SELECT id, name, image_url, price
            FROM products
            WHERE restaurant_id=%s
            ORDER BY id ASC
            LIMIT 3
            """,
            (r["id"],),
        )
        r["products"] = cursor.fetchall()

        # badges nếu là JSON string thì parse
        if isinstance(r.get("badges"), str):
            import json

            try:
                r["badges"] = json.loads(r["badges"])
            except Exception:
                r["badges"] = []

    cursor.close()
    conn.close()

    return jsonify(
        {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": (total + limit - 1) // limit,
            "restaurants": restaurants,
        }
    )


# GET /api/restaurants/popular
@restaurants_bp.route("/api/restaurants/popular", methods=["GET"])
def get_popular_restaurants():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT * FROM restaurants
        ORDER BY rating DESC
        LIMIT 10
        """
    )
    restaurants = cursor.fetchall()

    for r in restaurants:
        cursor.execute(
            """
            SELECT id, name, image_url, price
            FROM products
            WHERE restaurant_id=%s
            ORDER BY id ASC
            LIMIT 3
            """,
            (r["id"],),
        )
        r["products"] = cursor.fetchall()
        r["badges"] = r["badges"]

    cursor.close()
    conn.close()
    return jsonify(restaurants)


# GET /restaurants/<id>
@restaurants_bp.route("/restaurants/<int:restaurant_id>", methods=["GET"])
def get_restaurant_by_id(restaurant_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM restaurants WHERE id=%s", (restaurant_id,))
    restaurant = cursor.fetchone()

    if not restaurant:
        return jsonify({"error": "Restaurant not found"}), 404

    cursor.execute("SELECT * FROM products WHERE restaurant_id=%s", (restaurant_id,))
    products = cursor.fetchall()

    cursor.close()
    conn.close()

    restaurant["products"] = products
    return jsonify(restaurant)
