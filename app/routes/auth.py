import re
from flask import (
    Blueprint,
    render_template,
    request,
    jsonify,
    session,
    redirect,
    url_for,
)
from app.db import get_db_connection

auth_bp = Blueprint("auth", __name__)

# -------------------------------
# LOGIN PAGE
# -------------------------------


@auth_bp.route("/login", methods=["GET"])
def login_page():
    return render_template("auth/login.html")


@auth_bp.route("/login", methods=["POST"])
def login_post():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "No JSON data received!"})

    email = data.get("email", "").strip()
    password = data.get("password", "").strip()
    is_seller_admin = data.get("is_seller_admin", False)

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    role = "seller_admin" if is_seller_admin else "customer"

    cursor.execute(
        "SELECT * FROM accounts WHERE email=%s AND password=%s AND role=%s",
        (email, password, role),
    )

    account = cursor.fetchone()
    cursor.close()
    conn.close()

    if account:
        session["loggedin"] = True
        session["id"] = account["id"]
        session["email"] = account["email"]

        return jsonify(
            {
                "success": True,
                "message": "Logged in successfully!",
                "user": {
                    "username": account.get("username", ""),
                    "userid": account.get("id"),
                    "email": account.get("email"),
                    "role": account.get("role"),
                    "restaurant_id": account.get("restaurant_id"),
                    "is_seller_admin": is_seller_admin,
                },
            }
        )

    return jsonify({"success": False, "message": "Incorrect email or password!"})


# -------------------------------
# LOGOUT
# -------------------------------
@auth_bp.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("auth_bp.login_page"))


# -------------------------------
# REGISTER
# -------------------------------
@auth_bp.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        data = request.get_json()
        username = data.get("username", "").strip()
        password = data.get("password", "").strip()
        email = data.get("email", "").strip()
        address = data.get("address", "").strip()

        # Validate input
        if not username or not password or not email or not address:
            return {"success": False, "message": "Please fill out all required fields!"}
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            return {"success": False, "message": "Invalid email address!"}

        # DB connection
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Check username exists
        cursor.execute("SELECT * FROM accounts WHERE username=%s", (username,))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return {"success": False, "message": "Username already exists!"}

        # Insert new account (thêm cột address)
        cursor.execute(
            (
                "INSERT INTO accounts "
                "(username, password, email, address) "
                "VALUES (%s, %s, %s, %s)"
            ),
            (username, password, email, address),
        )
        conn.commit()
        cursor.close()
        conn.close()
        return {"success": True, "message": "You have successfully registered!"}

    return render_template("auth/register.html")


# -------------------------------
# INDEX PAGE (requires login)
# -------------------------------
@auth_bp.route("/")
def index():
    if "loggedin" in session:
        return render_template("pages/index.html")
    return redirect(url_for("auth.login_page"))


# -------------------------------
# DISPLAY ACCOUNT INFO
# -------------------------------
@auth_bp.route("/display")
def display():
    if "loggedin" in session:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM accounts WHERE id=%s", (session["id"],))
        account = cursor.fetchone()
        cursor.close()
        conn.close()
        return render_template("auth/display.html", account=account)
    return redirect(url_for("auth.login_page"))


# -------------------------------
# UPDATE ACCOUNT INFO
# -------------------------------
@auth_bp.route("/update", methods=["GET", "POST"])
def update():
    msg = ""
    if "loggedin" in session:
        if request.method == "POST":
            form = request.form
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                (
                    "UPDATE accounts SET username=%s, password=%s, email=%s, "
                    "organisation=%s, address=%s, city=%s, state=%s, country=%s, "
                    "postalcode=%s WHERE id=%s"
                ),
                (
                    form.get("username"),
                    form.get("password"),
                    form.get("email"),
                    form.get("organisation"),
                    form.get("address"),
                    form.get("city"),
                    form.get("state"),
                    form.get("country"),
                    form.get("postalcode"),
                    session["id"],
                ),
            )
            conn.commit()
            cursor.close()
            conn.close()
            msg = "You have successfully updated!"
        return render_template("auth/update.html", msg=msg)
    return redirect(url_for("auth.login_page"))
