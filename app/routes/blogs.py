from flask import Blueprint, render_template

blogs_bp = Blueprint("blogs", __name__)


@blogs_bp.route("/blogs")
def blogs():
    return render_template("blogs.html")
