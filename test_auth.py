import sys
import requests

try:
    session = requests.Session()
    # 1. Register a user
    reg_url = "http://localhost:8080/api/users"
    print(f"Registering at {reg_url}")
    res = session.post(reg_url, json={"email": "py_tester2@example.com", "password":"Password123!", "name":"PyTester"})
    print("Registration response:", res.status_code, res.text)
    print("Cookies after registration:", session.cookies.get_dict())
    
    # 2. Login
    login_url = "http://localhost:8080/api/users/login"
    print(f"\nLogging in at {login_url}")
    res = session.post(login_url, json={"email": "py_tester2@example.com", "password":"Password123!"})
    print("Login response:", res.status_code, res.text)
    print("Cookies after login:", session.cookies.get_dict())
    
    # 3. Access Dashboard
    dashboard_url = "http://localhost:8080/dashboard"
    print(f"\nAccessing {dashboard_url}")
    res = session.get(dashboard_url, allow_redirects=False)
    print("Dashboard response:", res.status_code)
    print("Redirects to:", res.headers.get("Location", "None"))
    
except Exception as e:
    print("Error:", e)
