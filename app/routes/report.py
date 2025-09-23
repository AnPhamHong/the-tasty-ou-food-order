from flask import Blueprint, jsonify, request
from app.db import get_db_connection
from datetime import datetime, timedelta

reports_bp = Blueprint("reports", __name__)
from flask import Blueprint, jsonify, request
from app.db import get_db_connection
from datetime import datetime

reports_bp = Blueprint("reports", __name__)


@reports_bp.route("/api/reports/monthly-revenue", methods=["GET"])
def monthly_revenue():
    """
    Trả về doanh thu và số lượng đơn hàng theo tháng trong năm.
    JSON: { year, monthly_revenue: [...], monthly_orders: [...] }
    """
    restaurant_id = request.args.get("restaurant_id")
    year = int(request.args.get("year", datetime.now().year))

    if not restaurant_id:
        return jsonify({"error": "restaurant_id is required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    query = """
        SELECT MONTH(o.order_time) AS month, 
        SUM(o.total) AS revenue,   -- ⬅ phải có dấu phẩy
        COUNT(DISTINCT o.id) AS order_count
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        WHERE o.restaurant_id = %s
        AND o.status = 'completed'
        AND YEAR(o.order_time) = %s
        GROUP BY MONTH(o.order_time)
        ORDER BY MONTH(o.order_time)
    """
    cursor.execute(query, (restaurant_id, year))
    results = cursor.fetchall()
    cursor.close()
    conn.close()

    # Build array doanh thu 12 tháng
    monthly_revenue = [0] * 12
    monthly_orders = [0] * 12
    for row in results:
        month_index = row["month"] - 1
        monthly_revenue[month_index] = float(row["revenue"])
        monthly_orders[month_index] = int(row["order_count"])

    return jsonify(
        {
            "year": year,
            "monthly_revenue": monthly_revenue,
            "monthly_orders": monthly_orders,
        }
    )


@reports_bp.route("/api/reports/top-dishes", methods=["GET"])
def top_dishes():
    """
    Trả về top N món bán chạy theo số lượng bán ra.
    Query params:
        restaurant_id (required)
        year (default: hiện tại)
        month (optional)
        top_n (default: 10)
    """
    restaurant_id = request.args.get("restaurant_id")
    year = int(request.args.get("year", datetime.now().year))
    month = request.args.get("month")  # optional
    top_n = int(request.args.get("top_n", 10))

    if not restaurant_id:
        return jsonify({"error": "restaurant_id is required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    query = """
        SELECT oi.food_name, SUM(oi.quantity) AS total_sold
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        WHERE o.restaurant_id = %s
          AND o.status = 'completed'
          AND YEAR(o.order_time) = %s
    """
    params = [restaurant_id, year]

    if month:
        query += " AND MONTH(o.order_time) = %s"
        params.append(month)

    query += """
        GROUP BY oi.food_name
        ORDER BY total_sold DESC
        LIMIT %s
    """
    params.append(top_n)

    cursor.execute(query, params)
    results = cursor.fetchall()
    cursor.close()
    conn.close()

    return jsonify({"year": year, "month": month, "top_dishes": results})


@reports_bp.route("/api/reports/category-sales", methods=["GET"])
def category_sales():
    restaurant_id = request.args.get("restaurant_id")
    year = int(request.args.get("year", datetime.now().year))

    if not restaurant_id:
        return jsonify({"error": "restaurant_id is required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    query = """
        SELECT p.category,
               SUM(oi.quantity) AS total_sold,
               SUM(oi.price * oi.quantity) AS revenue
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN products p ON oi.food_id = p.id
        WHERE o.restaurant_id = %s
          AND o.status = 'completed'
          AND YEAR(o.order_time) = %s
        GROUP BY p.category
        ORDER BY revenue DESC
    """
    cursor.execute(query, (restaurant_id, year))
    results = cursor.fetchall()
    cursor.close()
    conn.close()

    return jsonify({"year": year, "category_sales": results})


@reports_bp.route("/api/reports/top-orders", methods=["GET"])
def top_orders():
    restaurant_id = request.args.get("restaurant_id")
    year = int(request.args.get("year", datetime.now().year))
    top_n = int(request.args.get("top_n", 10))

    if not restaurant_id:
        return jsonify({"error": "restaurant_id is required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    query = """
        SELECT o.id AS order_id,
               o.recipient_name,
               o.total AS order_total,
               o.order_time
        FROM orders o
        WHERE o.restaurant_id = %s
          AND o.status = 'completed'
          AND YEAR(o.order_time) = %s
        ORDER BY o.total DESC
        LIMIT %s
    """
    cursor.execute(query, (restaurant_id, year, top_n))
    results = cursor.fetchall()
    cursor.close()
    conn.close()

    return jsonify({"year": year, "top_orders": results})
