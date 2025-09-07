# The Tasty OU Food

A simple online food ordering system that allows customers to browse menus, place orders, and make payments.  
The project includes both frontend and backend modules.

## Features
- User authentication (login, signup)
- Browse food categories & menu
- Add to cart & place order
- Payment integration
- Order management dashboard (admin)

## Tech Stack
- Frontend: HTML, CSS, JavaScript
- Backend: Python, Flask
- Database: MySQL
- Deployment: Local / VPS / Docker (optional)

## Getting Started

### 1. Clone the repository
```bash
git clone <repo-url>
cd <repo-folder>
```
### 2. Set up virtual environment (recommended)
``` python -m venv venv ```
# Windows
``` venv\Scripts\activate ```
# macOS/Linux
``` source venv/bin/activate ```

### 3. Install dependencies
``` pip install -r requirements.txt ```
### 4. Configure database

Create a MySQL database, e.g., ou_food_order

Update database credentials in your Flask config file (config.py or .env):

MYSQL_HOST = 'localhost'
MYSQL_USER = 'root'
MYSQL_PASSWORD = 'your_password'
MYSQL_DB = 'ou_food_order'

### 5. Run the project
# Set Flask app entry point
set FLASK_APP=app.py      # Windows
export FLASK_APP=app.py   # macOS/Linux

# (Optional) Enable debug mode
set FLASK_ENV=development # Windows
export FLASK_ENV=development # macOS/Linux

# Run server
``` python app.py ```

The application should now be accessible at: http://localhost:5000/

### 6. Optional: Database migrations

If you have initial SQL scripts, run them to create tables and seed data.

### 7. Members

Trương Dương Thùy Trang - 2251052123

Trương Tấn Khoa - 2151013041

Vũ Minh Tân - 1951052180

Phạm Thị Hồng Ân - 1851010010