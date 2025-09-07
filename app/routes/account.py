from flask import Blueprint, render_template

account_bp = Blueprint("account", __name__)

@account_bp.route("/orders")
def orders():
    return render_template("orders.html")

@account_bp.route("/wishlist")
def wishlist():
    return render_template("wishlist.html")

@account_bp.route("/checkout")
def checkout():
    return render_template("checkout.html")

@account_bp.route("/saved-address")
def saved_address():
    return render_template("saved_address.html")

@account_bp.route("/profile")
def profile():
    return render_template("profile.html")

@account_bp.route("/settings")
def settings():
    return render_template("settings.html")
