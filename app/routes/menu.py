from flask import Blueprint, render_template, abort
from app.db import get_db_connection
from datetime import date
from collections import defaultdict

menu_bp = Blueprint("menu", __name__)

@menu_bp.route("/restaurant/<int:restaurant_id>/menu")
def restaurant_menu(restaurant_id):
    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)

    # Lấy restaurant
    cur.execute("SELECT * FROM restaurants WHERE id = %s", (restaurant_id,))
    restaurant = cur.fetchone()
    if not restaurant:
        abort(404, "Restaurant not found")

    # Lấy products
    cur.execute("SELECT * FROM products WHERE restaurant_id = %s", (restaurant_id,))
    products = cur.fetchall()
    
    # Lấy promotion active
    cur.execute("""
        SELECT p.id AS promotion_id, p.discount_pct, pi.product_id
        FROM promotions p
        JOIN promotion_items pi ON p.id = pi.promotion_id
        WHERE p.restaurant_id = %s
          AND CURDATE() BETWEEN p.start_date AND p.end_date
    """, (restaurant_id,))
    promotions = cur.fetchall()

    # Map product_id -> discount_pct
    promo_map = {promo['product_id']: promo['discount_pct'] for promo in promotions}

    # Áp dụng promotion
    for product in products:
        if product['id'] in promo_map:
            discount = promo_map[product['id']]
            product['discount_pct'] = discount
            product['discount_price'] = round(product['price'] * (1 - discount / 100), 2)
        else:
            product['discount_pct'] = 0
            product['discount_price'] = product['price']

    # Nhóm sản phẩm theo category
    items_by_category = defaultdict(list)
    for product in products:
        cat = product.get('category')
        if not cat or cat.strip() == '':
            cat = 'Others'  # gán mặc định nếu rỗng/null
        items_by_category[cat].append(product)

    # Tính giá min/max
    if products:
        prices = [p.get('discount_price', p['price']) for p in products]
        min_price = min(prices)
        max_price = max(prices)
    else:
        min_price = max_price = None

    menu_data = {
        "items_by_category": dict(items_by_category),  # dict: category -> list of products
        "minPrice": min_price,
        "maxPrice": max_price
    }

    conn.close()

    return render_template(
        "pages/menu.html",
        restaurant=restaurant,
        menu=menu_data,
        promo_map=promo_map
    )