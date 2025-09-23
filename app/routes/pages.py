from flask import Blueprint, render_template

pages_bp = Blueprint("pages", __name__)


# ---------- Company ----------
@pages_bp.route("/about")
def about():
    return render_template("about.html")


@pages_bp.route("/contact")
def contact():
    return render_template("contact.html")


@pages_bp.route("/offers")
def offers():
    return render_template("offers.html")


@pages_bp.route("/faqs")
def faqs():
    return render_template("faqs.html")


@pages_bp.route("/shopping-bag")
def shopping_bag():
    return render_template("pages/shopping_bag.html")


@pages_bp.route("/seller/register")
def register_restaurant():
    return render_template("auth/register_restaurant.html")


@pages_bp.route("/seller-admin")
def seller_admin():
    return render_template("seller_admin.html")
