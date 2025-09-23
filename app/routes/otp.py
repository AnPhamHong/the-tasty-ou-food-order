import random
from flask import Blueprint, request, session, jsonify
from flask_mail import Message
from app import mail  # import global mail đã khởi tạo

otp_bp = Blueprint("otp", __name__)


def generate_otp():
    return str(random.randint(100000, 999999))


@otp_bp.route("/verify/email/send", methods=["POST"])
def send_email_otp():
    data = request.json
    email = data.get("email")
    if not email:
        return jsonify({"error": "Email is required"}), 400

    otp = generate_otp()
    session[f"email_otp_{email}"] = otp

    try:
        msg = Message("Your OTP Code", recipients=[email])
        msg.body = f"Your OTP code is: {otp}. It will expire in 5 minutes."
        mail.send(msg)  # sử dụng mail global
        return jsonify({"message": "OTP sent to email"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@otp_bp.route("/verify/email/confirm", methods=["POST"])
def confirm_email_otp():
    data = request.json
    email = data.get("email")
    otp = data.get("otp")

    expected = session.get(f"email_otp_{email}")
    if expected and expected == otp:
        session[f"email_verified_{email}"] = True
        return jsonify({"message": "Email verified"}), 200

    return jsonify({"error": "Invalid OTP"}), 400
