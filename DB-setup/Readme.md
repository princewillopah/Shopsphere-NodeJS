The backend config template is at .env.example. There is no real .env file there yet, so you should copy that template to a new .env file.

Database to set up:
- The app is built for MySQL.
- The default values in the template are:
  - DB_NAME = shopsphere
  - DB_USER = shopsphere
  - DB_PASSWORD = change-me

Step-by-step setup

1. Install MySQL
If you are using Ubuntu locally:
```bash
sudo apt update
sudo apt install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
sudo systemctl status mysql
```

2. Create the database and user
```bash
sudo mysql
```

Inside MySQL- Create db and user with password:
```sql
CREATE DATABASE shopsphere CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'shopsphere'@'localhost' IDENTIFIED BY 'StrongPassword123!';
GRANT ALL PRIVILEGES ON shopsphere.* TO 'shopsphere'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Test DB auth with credentials
```
mysql -u shopsphere -p -h localhost
# when prompted for password, enter 'StrongPassword123!' withou the quote
```


3. Create the backend env file
From the backend folder:
```bash
cd /home/princewillopah/DevOps/🛡️mystuff/Apps-to-move/Shopsphere/NodeJS/backend
cp .env.example .env
```

4. Fill in the DB values in the new .env
Use values like:
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=shopsphere
DB_USER=shopsphere
DB_PASSWORD=StrongPassword123!
```

Also set a JWT secret, for example:
```env
JWT_SECRET=replace-with-a-long-random-string
```

5. Install backend dependencies
```bash
npm install
```

6. Run the database migrations
```bash
npm run migrate
```

7. Optional: seed the app with initial data
```bash
npm run seed
```

8. Start the backend
```bash
npm start
```

If you are using RDS instead of local MySQL:
- set DB_HOST to your RDS endpoint
- make sure the security group allows access on port 3306
- use the RDS database name, username, and password

The project docs in README.md confirm this MySQL-based setup.
---
---
---



## Quick way

1. Connect to MySQL
```bash
mysql -u shopsphere -p
```

2. When prompted, enter the password you set for the user.

3. Inside MySQL, list the database contents:
```sql
SHOW DATABASES;
USE shopsphere;
SHOW TABLES;
```

## See what’s inside the app tables

```sql
SELECT * FROM products;
SELECT * FROM users;
SELECT * FROM orders;
```

## See the full schema
```sql
SHOW CREATE TABLE products;
```

## If you want a quick summary of rows
```sql
SELECT COUNT(*) AS total_products FROM products;
SELECT COUNT(*) AS total_users FROM users;
```

## If you want to inspect from the shell without entering MySQL
```bash
mysql -u shopsphere -p -e "USE shopsphere; SHOW TABLES;"
```

In your current setup, I verified that the database named shopsphere exists locally.
