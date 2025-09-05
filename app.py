# Format Python code here
import re

import mysql.connector
from flask import Flask, jsonify, redirect, render_template, request, session, url_for

app = Flask(__name__)
app.secret_key = "NHFSJSAU873"

# --- Cấu hình kết nối MySQL ---
db_config = {
    "host": "localhost",
    "user": "root",
    "password": "apth123456",  # thay bằng mật khẩu MySQL của bạn
    "database": "food_order_db",
}


def get_db_connection():
    return mysql.connector.connect(**db_config)


@app.route("/")
@app.route("/login", methods=["GET"])
def login_page():
    return render_template("login.html")


@app.route("/login", methods=["POST"])
def login_post():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "No JSON data received!"})

    email = data.get("email", "")
    password = data.get("password", "")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT * FROM accounts WHERE email=%s AND password=%s", (email, password)
    )
    account = cursor.fetchone()
    cursor.close()
    conn.close()

    if account:
        session["loggedin"] = True
        session["email"] = account["email"]
        return jsonify({"success": True, "message": "Logged in successfully!"})
    else:
        return jsonify({"success": False, "message": "Incorrect email or password!"})


@app.route("/logout")
def logout():
    session.pop("loggedin", None)
    session.pop("id", None)
    session.pop("email", None)
    return redirect(url_for("login_page"))


@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        data = request.get_json()  # lấy JSON từ fetch
        username = data.get("username", "").strip()
        password = data.get("password", "").strip()
        email = data.get("email", "").strip()

        # validate
        if not username or not password or not email:
            return {"success": False, "message": "Please fill out all required fields!"}
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            return {"success": False, "message": "Invalid email address!"}

        # db
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM accounts WHERE username=%s", (username,))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return {"success": False, "message": "Username already exists!"}

        cursor.execute(
            "INSERT INTO accounts (username, password, email) VALUES (%s, %s, %s)",
            (username, password, email),
        )
        conn.commit()
        cursor.close()
        conn.close()

        return {"success": True, "message": "You have successfully registered!"}

    return render_template("register.html")


@app.route("/index")
def index():
    if "loggedin" in session:
        return render_template("index.html")
    return redirect(url_for("login"))


@app.route("/display")
def display():
    if "loggedin" in session:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM accounts WHERE id = %s", (session["id"],))
        account = cursor.fetchone()
        cursor.close()
        conn.close()
        return render_template("display.html", account=account)
    return redirect(url_for("login"))


@app.route("/update", methods=["GET", "POST"])
def update():
    msg = ""
    if "loggedin" in session:
        if request.method == "POST":
            username = request.form["username"]
            password = request.form["password"]
            email = request.form["email"]
            organisation = request.form["organisation"]
            address = request.form["address"]
            city = request.form["city"]
            state = request.form["state"]
            country = request.form["country"]
            postalcode = request.form["postalcode"]

            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                "UPDATE accounts SET username=%s, password=%s, email=%s, organisation=%s, address=%s, city=%s, state=%s, country=%s, postalcode=%s WHERE id=%s",
                (
                    username,
                    password,
                    email,
                    organisation,
                    address,
                    city,
                    state,
                    country,
                    postalcode,
                    session["id"],
                ),
            )
            conn.commit()
            cursor.close()
            conn.close()
            msg = "You have successfully updated !"
        return render_template("update.html", msg=msg)
    return redirect(url_for("login"))


# GET /restaurants?tab=rating
@app.route("/restaurants", methods=["GET"])
def get_restaurants():
    tab = request.args.get("tab", "rating")

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
        # Lọc theo trung bình giá sản phẩm
        order_clause = "ORDER BY (SELECT AVG(price) FROM products p WHERE p.restaurant_id = r.id) ASC"
    else:
        where_clause = "1"

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Lấy restaurants
    cursor.execute(
        f"SELECT * FROM restaurants r WHERE {where_clause} {order_clause} LIMIT 20"
    )
    restaurants = cursor.fetchall()

    # Lấy top 2-3 products mỗi restaurant
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

        # badges từ cột JSON
        r["badges"] = r["badges"]  # JSON string, front-end có thể parse

    cursor.close()
    conn.close()
    return jsonify(restaurants)


if __name__ == "__main__":
    app.run(host="localhost", port=5000, debug=True)