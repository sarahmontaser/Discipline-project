from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector

from werkzeug.security import generate_password_hash
import re

app = Flask(__name__)
CORS(app)

# 🔵 Database connection
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Sarsora2534@",
    database="discipline_db"
)

cursor = db.cursor(dictionary=True)

# ---------------- HOME ----------------
@app.route('/')
def home():
    return "Flask Running 🚀"


# ---------------- REGISTER ----------------
@app.route('/register', methods=['POST'])
def register():
    data = request.json

    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    # check missing fields بس
    if not username or not email or not password:
        return jsonify({"message": "Missing fields"}), 400

    # check if user exists
    cursor.execute(
        "SELECT * FROM users WHERE email=%s OR username=%s",
        (email, username)
    )

    if cursor.fetchone():
        return jsonify({"message": "User already exists"}), 400

    # insert user
    cursor.execute(
        "INSERT INTO users (username, email, password) VALUES (%s, %s, %s)",
        (username, email, password)
    )
    db.commit()

    return jsonify({"message": "User registered successfully"}), 200





# ---------------- LOGIN ----------------
@app.route('/login', methods=['POST'])


def login():
    data = request.json

    email = data.get("email")
    username = data.get("username")
    password = data.get("password")

    if not email or not username or not password:
        return jsonify({"message": "Missing fields"}), 400

    # 🔥 IMPORTANT: BINARY comparison (case-sensitive)
    cursor.execute("""
        SELECT * FROM users 
        WHERE BINARY email=%s 
        AND BINARY username=%s 
        AND BINARY password=%s
    """, (email, username, password))

    user = cursor.fetchone()

    if user:
        return jsonify({
            "message": "Login successful",
            "email": user["email"],
            "username": user["username"]
        }), 200

    return jsonify({"message": "Invalid credentials"}), 401

 
# ---------------- UPDATE PROFILE ----------------



@app.route('/update-user', methods=['POST'])

def update_user():
    data = request.json

    email = data.get("email")
    new_password = data.get("password")

    if not email:
        return jsonify({"message": "Email is required"}), 400

    if not new_password:
        return jsonify({"message": "Password is required"}), 400

    # password validation
    if not re.match(r"^[A-Za-z0-9]{6,}$", new_password) \
       or not re.search(r"[A-Za-z]", new_password) \
       or not re.search(r"[0-9]", new_password):
        return jsonify({
            "message": "Password must be at least 6 characters and contain letters and numbers only"
        }), 400

    try:
        cursor.execute(
            "UPDATE users SET password=%s WHERE email=%s",
            (new_password, email)
        )

        db.commit()

        return jsonify({"message": "Password updated successfully"}), 200

    except Exception:
        db.rollback()
        return jsonify({"message": "Update failed"}), 500

# ---------------- RUN SERVER ----------------
if __name__ == '__main__':
    app.run(debug=True)