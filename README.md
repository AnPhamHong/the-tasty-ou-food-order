# The Tasty OU Food

A simple online food ordering system that allows customers to browse menus, place orders, and make payments.  
The project includes both frontend and backend modules.

## Features
- User authentication (login, signup)
- Browse food categories & menu
- Search for products
- View product details with ratings
- Add to cart, update quantity, remove items
- Show item price with discount (original price struck-through if discounted)
- Checkout & place orders
- Payment integration
- Display badges (e.g., "newest", "exclusive")
- Order management dashboard (admin)

## Tech Stack
- Frontend: HTML, CSS, JavaScript
- Backend: Python, Flask
- Database: MySQL
- Deployment: Local

## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/AnPhamHong/the-tasty-ou-food-order.git
cd the-tasty-ou-food-order
```
### 2. Set up virtual environment (recommended)
``` python -m venv venv ```
#### Windows
``` venv\Scripts\activate ```
#### macOS/Linux
``` source venv/bin/activate ```
#### Update pip
``` pip install --upgrade pip ``` 
### 3. Install dependencies
``` pip install -r requirements.txt ```
### 4. Configure database
1. Create a MySQL database, e.g., food_order_db
```CREATE DATABASE food_order_db;```

2. Import the backup SQL file (tables + full data):

Using MySQL Workbench:

Server → Data Import

Choose Import from Self-Contained File → sql/backup.sql

Default Schema to be Imported To → select food_order_db database → Start Import

3. Update database credentials in your Flask config file (db.py):

MYSQL_HOST = 'localhost'

MYSQL_USER = 'root'

MYSQL_PASSWORD = 'your_password'

MYSQL_DB = 'food_order_db'

### 5. Run the project
#### Set Flask app entry point
#### Windows
set FLASK_APP=app.py
#### macOS/Linux
export FLASK_APP=app.py

#### (Optional) Enable debug mode
set FLASK_ENV=development # Windows
export FLASK_ENV=development # macOS/Linux

#### Run server
``` python app.py ```

The application should now be accessible at: http://127.0.0.1:5000/

### 6. Optional: Database migrations

If you make changes to models or schema, export the updated SQL and update sql/backup.sql for other members.

### 7. Members

Trương Dương Thùy Trang - 2251052123

Trương Tấn Khoa - 2151013041

Vũ Minh Tân - 1951052180

Phạm Thị Hồng Ân - 1851010010