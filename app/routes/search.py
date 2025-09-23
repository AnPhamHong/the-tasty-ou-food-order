from flask import Blueprint, request, jsonify
from app.db import get_db_connection

search_bp = Blueprint("search", __name__)


@search_bp.route("/api/search", methods=["GET"])
def search():
    keyword = request.args.get("keyword", "").strip()
    limit = request.args.get("limit", 20, type=int)  # default 20

    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)

    results = []

    if not keyword:
        # Nếu không có keyword => lấy danh sách restaurants kèm món ăn (giới hạn)
        cur.execute(
            """
            SELECT id, name, location, image_url, rating
            FROM restaurants
            LIMIT %s
        """,
            (limit,),
        )
        restaurants = cur.fetchall()

        for res in restaurants:
            cur.execute(
                """
                SELECT id, name, image_url, price
                FROM products
                WHERE restaurant_id = %s
                LIMIT 5
            """,
                (res["id"],),
            )
            foods = cur.fetchall()
            res["lst_food"] = foods
            results.append(res)

        cur.close()
        conn.close()
        return jsonify({"results": results})
    # --- Nếu có keyword thì giữ logic cũ ---
    # Tìm nhà hàng match tên
    cur.execute(
        """
        SELECT id, name, location, image_url, rating
        FROM restaurants
        WHERE name LIKE %s
        LIMIT 10
    """,
        (f"%{keyword}%",),
    )
    restaurants = cur.fetchall()

    results = []

    # Với mỗi nhà hàng, tìm thêm món ăn match keyword
    for res in restaurants:
        cur.execute(
            """
            SELECT id, name, image_url, price
            FROM products
            WHERE restaurant_id = %s AND name LIKE %s
            LIMIT 5
        """,
            (res["id"], f"%{keyword}%"),
        )
        foods = cur.fetchall()
        res["lst_food"] = foods
        results.append(res)

    # Nếu chưa có nhà hàng nào, tìm thẳng món ăn match keyword rồi group theo restaurant
    if not results:
        cur.execute(
            """
            SELECT f.id AS food_id,
                f.name,
                f.image_url,
                f.price,
                r.id AS restaurant_id,
                r.name AS restaurant_name,
                r.location,
                r.image_url AS restaurant_image,
                r.rating
            FROM products f
            JOIN restaurants r ON f.restaurant_id = r.id
            WHERE f.name LIKE %s
            LIMIT 20
            """,
            (f"%{keyword}%",),
        )
        rows = cur.fetchall()

        grouped = {}
        for row in rows:
            rid = row["restaurant_id"]
            if rid not in grouped:
                grouped[rid] = {
                    "id": rid,
                    "name": row["restaurant_name"],
                    "location": row["location"],
                    "image_url": row["restaurant_image"],
                    "rating": row["rating"],
                    "lst_food": [],
                }
            grouped[rid]["lst_food"].append(
                {
                    "id": row["food_id"],
                    "name": row["name"],
                    "image_url": row["image_url"],
                    "price": row["price"],
                }
            )
        results = list(grouped.values())

    cur.close()
    conn.close()

    return jsonify({"results": results})
