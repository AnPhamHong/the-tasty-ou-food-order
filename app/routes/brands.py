from flask import Blueprint, jsonify, render_template
from app.db import get_db_connection

brands_bp = Blueprint("brands", __name__)


# GET /api/brands
@brands_bp.route("/api/brands", methods=["GET"])
def get_brands():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id, name, image_url, link FROM brands")
    brands = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(brands)


# GET /order/menu-listing/<brand>
@brands_bp.route("/order/menu-listing/<brand>")
def menu_listing(brand):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM brands WHERE link=%s OR name=%s", (brand, brand))
    brand_info = cursor.fetchone()

    if not brand_info:
        cursor.close()
        conn.close()
        return render_template("404.html"), 404

    cursor.execute(
        """
        SELECT p.id, p.name, p.image_url, p.price, r.name AS restaurant_name
        FROM products p
        JOIN restaurants r ON p.restaurant_id = r.id
        WHERE p.brand_id = %s
        ORDER BY p.id ASC
        """,
        (brand_info["id"],),
    )
    products = cursor.fetchall()

    cursor.close()
    conn.close()

    return render_template("menu_listing.html", brand=brand_info, products=products)
