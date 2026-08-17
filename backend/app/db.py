import os
import jwt
from fastapi import FastAPI, HTTPException, Header, Depends, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from contextlib import asynccontextmanager
import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor, execute_values, execute_batch
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

# --- 1. CONFIGURATION & SECURITY ---
SECRET_KEY = os.getenv("DECKSTERITY_SECRET_KEY") 
if not SECRET_KEY:
    pass #raise ValueError("FATAL: No DECKSTERITY_SECRET_KEY set in the environment!")
ALGORITHM = "HS256"

# --- 2. DYNAMIC DATABASE POOL SETUP ---
connection_pools = {}
ALLOWED_DATABASES = ["mydb"]


def get_pool_for_db(db_name: str):
    """Retrieves an existing pool for a database, or creates one if it doesn't exist."""
    if db_name not in ALLOWED_DATABASES:
        raise HTTPException(status_code=403, detail="Database access not allowed")

    if db_name not in connection_pools:
        try:
            connection_pools[db_name] = psycopg2.pool.SimpleConnectionPool(
                1, 20,
                user="postgres",
                password="12345678", 
                host= "localhost" if "port" in os.environ else "db",
                port= os.environ["port"] if "port" in os.environ else "5432",
                database=db_name
            )
            print(f"Created new connection pool for: {db_name}")
        except Exception as e:
            print(f"Failed to connect to {db_name}: {e}")
            raise HTTPException(status_code=500, detail="Database connection failed")
            
    return connection_pools[db_name]


# --- 3. DEPENDENCIES & HELPERS ---

def lifespan(conn):
    with conn.cursor(cursor_factory=RealDictCursor) as cursor:
        try:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS employees (
                    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                    name TEXT NOT NULL,
                    date_of_join DATE
                );
                CREATE TABLE IF NOT EXISTS items (
                    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                    emp_id INTEGER REFERENCES employees(id),
                    name TEXT NOT NULL,
                    quantity INTEGER,
                    state TEXT NOT NULL,
                    date_of_transfer DATE,
                    transfer_from INTEGER REFERENCES employees(id)
                );
                CREATE TABLE IF NOT EXISTS return_log (
                    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                    item_id INTEGER REFERENCES items(id),
                    quantity INTEGER,
                    return_state TEXT NOT NULL,
                    date_of_return DATE
                );
                """
            )
            print("Tables created successfully")
        except Exception as e:
            print(e)



# hacky way to run db:
intialized = False

def get_db(x_database_name: str = Header("mydb", description="The target database")):
    """Dependency to get a DB connection from the dynamically requested pool."""
    target_pool = get_pool_for_db(x_database_name)
    conn = target_pool.getconn()
    try:
        lifespan(conn)
        yield conn
    finally:
        target_pool.putconn(conn)



app = FastAPI(title="a")


# --- 4. PYDANTIC MODELS ---

class EmployeeAdd(BaseModel):
    name: str
    date_of_join: str

class ItemAdd(BaseModel):
    emp_id: str
    name: str
    quantity: int
    state: str
    date_of_transfer: str
    transfer_from: str

class ItemEdit(BaseModel):
    id: str
    name: str
    quantity: int
    state: str
    date_of_transfer: str
    transfer_from: str

class ItemLogAdd(BaseModel):
    item_id: str
    quantity: int
    return_state: str
    date_of_return: str

# --- 5. REST API ENDPOINTS ---

@app.get("/employees", summary="Get all employees")
def get_all_employees(db = Depends(get_db)):
    with db.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute(
            """
            SELECT id::text, name, date_of_join
            FROM employees;
            """
        )
        res = cursor.fetchall()
        return res



@app.post("/employees/add", summary="Add employee")
def add_employee(emp: EmployeeAdd, db = Depends(get_db)):
    with db.cursor(cursor_factory=RealDictCursor) as cursor:
        try:
            cursor.execute(
                """
                INSERT INTO employees (name, date_of_join)
                VALUES (%s, %s)
                RETURNING id, name, date_of_join;
                """,
                (emp.name, emp.date_of_join)
            )
            new_emp = cursor.fetchone()
            db.commit()
            return new_emp
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=str(e))

@app.get("/employees/search", summary="Retrieve list of matching employee name")
def suggest_employees(q: str, db = Depends(get_db)):
    with db.cursor(cursor_factory=RealDictCursor) as cursor:
        q = q.strip()
        cursor.execute(
            """
            SELECT id::text, name
            FROM employees 
            WHERE LOWER(name) LIKE %s;
            """,
            (f"%{q.lower()}%",)
        )
        res = cursor.fetchmany(size=40)
        
        if res is None:
            raise HTTPException(status_code=404, detail="it broke")
        return res



@app.get("/employees/get/{emp_id}", summary="Get employee")
def get_employee(emp_id: str, db = Depends(get_db)):
    with db.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute(
            """
            SELECT id::text, name, date_of_join
            FROM employees 
            WHERE id = %s;
            """,
            (emp_id,)
        )
        res = cursor.fetchone()
        
        if res is None:
            raise HTTPException(status_code=404, detail="Employee not found")
            
        return res

@app.patch("/employees/get/{emp_id}/edit", summary="Edit employee")
def edit_employee(emp_id: str, emp: EmployeeAdd, db = Depends(get_db)):
    with db.cursor(cursor_factory=RealDictCursor) as cursor:
        try:
            cursor.execute(
                """
                UPDATE employees 
                SET (name, date_of_join) = (%s, %s)
                WHERE id = %s
                RETURNING id, name, date_of_join;
                """,
                (emp.name, emp.date_of_join, emp_id)
            )
            new_emp = cursor.fetchone()
            db.commit()
            return new_emp
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=str(e))

@app.get("/employees/get/{emp_id}/items", summary="Retrieve list of item that is transferred to an employee")
def get_items_from_employee(emp_id: str, db = Depends(get_db)):
    with db.cursor(cursor_factory=RealDictCursor) as cursor:

        cursor.execute(
            """
            SELECT items.id::text, items.name, quantity, state, 
                employees.id::text AS transfer_from_id, employees.name AS transfer_from, date_of_transfer
            FROM items
            JOIN employees ON items.transfer_from = employees.id
            WHERE emp_id = %s;
            """,
            (emp_id,)
        )
        res = cursor.fetchall()
        for r in res:
            cursor.execute(
                """
                SELECT item_id::text, quantity, return_state, date_of_return
                FROM return_log
                WHERE item_id = %s;
                """,
                (r["id"],)
            )
            logs = cursor.fetchall()
            total_remaining = r["quantity"] - sum([log["quantity"] for log in logs])
            return_logs = [
                {
                    "date" : log["date_of_return"],
                    "quantity" : log["quantity"],
                    "state" : log["return_state"]
                }
                for log in logs
            ]
            r["qty_remaining"] = total_remaining
            r["return_logs"] = return_logs
        res = sorted(res, key=lambda r: (0 if r["qty_remaining"] > 0 else 1, r["name"].lower()))
        return res

@app.patch("/employees/get/{emp_id}/items/edit", summary="Edit list of items from an employee")
def get_items_from_employee(emp_id: str, edits: list[ItemEdit], db = Depends(get_db)):
    with db.cursor(cursor_factory=RealDictCursor) as cursor:
        try:
            item_edit_entries = [[e.name, e.quantity, e.state, e.date_of_transfer, e.transfer_from, e.id] for e in edits]

            query = """
                UPDATE items
                SET (name, quantity, state, date_of_transfer, transfer_from) = (%s, %s, %s, %s, %s)
                WHERE id = %s;
                """
            
            execute_batch(cursor, query, item_edit_entries)
            db.commit()
            return { "yo" : "buddy" }
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=str(e))



@app.post("/items/add", summary="Assign new item to employee")
def add_item(item: ItemAdd, db = Depends(get_db), allow_commit: bool = True):
    with db.cursor(cursor_factory=RealDictCursor) as cursor:
        try:
            cursor.execute(
                """
                INSERT INTO items (emp_id, name, quantity, state, date_of_transfer, transfer_from)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id, emp_id, name, quantity, state, date_of_transfer, transfer_from;
                """,
                (item.emp_id, item.name, item.quantity, item.state, item.date_of_transfer, item.transfer_from)
            )
            new_emp = cursor.fetchone()
            if allow_commit:
                db.commit()
            return new_emp
        except Exception as e:
            if allow_commit:
                db.rollback()
            raise HTTPException(status_code=500, detail=str(e))

@app.post("/items/add_multi", summary="Add multiple items")
def add_item_multi(items: list[ItemAdd], db = Depends(get_db)):
    try:
        new_items = []
        for it in items:
            new_items.append(add_item(it, db, False))
        db.commit()
        return new_items
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))



@app.post("/return_log/add_multi", summary="Add return log for multiple items")
def add_log_multi(logs: list[ItemLogAdd], db = Depends(get_db)):
    with db.cursor(cursor_factory=RealDictCursor) as cursor:
        try:
            args = [(l.item_id, l.quantity, l.return_state, l.date_of_return) for l in logs]
            execute_values(
                cursor,
                """
                INSERT INTO return_log (item_id, quantity, return_state, date_of_return)
                VALUES %s
                RETURNING id, item_id, quantity, return_state, date_of_return;
                """,
                args
            )
            new_emp = cursor.fetchall()
            db.commit()
            return new_emp
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=str(e))


# Get items that are currently hold by employee with id=emp_id
# Return: item id, name, quantity
# Logic: for each item, query the number of returned quantity to compute remaining quantity
#     if > 0 then add it to api response
@app.get("/return_log/get/{emp_id}")
def get_emp_items_received(emp_id: str, db = Depends(get_db)):
    with db.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute(
            """
            CREATE OR REPLACE FUNCTION total_remaining(current_item_id INT, initial_qty INT)
            RETURNS INT AS $$
            DECLARE
                r RECORD;
                total INT := 0;
            BEGIN
                FOR r IN SELECT * FROM return_log WHERE item_id = current_item_id LOOP
                    total := total + r.quantity;
                END LOOP;
                RETURN initial_qty - total;
            END;
            $$ LANGUAGE plpgsql;


            WITH item_totals AS (
                SELECT items.id AS item_id, items.name,
                    total_remaining(items.id, items.quantity) AS remaining_quantity,
                    items.emp_id
                FROM items
                JOIN employees ON items.transfer_from = employees.id
            )
            SELECT item_id::text, name, remaining_quantity AS quantity
            FROM item_totals
            WHERE emp_id = %s AND remaining_quantity > 0;
            """,
            (emp_id,)
        )
        res = cursor.fetchall()
        return res
