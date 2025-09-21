from flask import Blueprint, render_template, url_for, request

account_bp = Blueprint("account_bp", __name__, url_prefix="/account")

@account_bp.route("/checkout")
def checkout():
    return render_template("checkout.html")

@account_bp.route("/profile", endpoint="profile")
def profile():
    tab = request.args.get("tab", "profile")
    breadcrumb = [
        {"name": "Home", "url": url_for("auth.index")},
        {"name": "Profile", "url": url_for("account_bp.profile", tab="user")},
        {"name": tab.replace("_", " ").title(), "url": None}
    ]
    tabs = [
        {"id": "tab-user", "name": "Detail User"},
        {"id": "tab-orders", "name": "My Orders"},
        {"id": "tab-address", "name": "Saved Address"},
        {"id": "tab-card", "name": "Saved Card"},
        {"id": "tab-help", "name": "Help"}
    ]
    return render_template("pages/profile.html", breadcrumb=breadcrumb, tabs=tabs, active_tab=tab)


@account_bp.route("/settings")
def settings():
    return render_template("settings.html")
