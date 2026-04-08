import urllib.request
import json
import sys
import time

BASE = "http://localhost:8080"
FASTAPI = "http://localhost:8001"

def post_json(url, data):
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = resp.read().decode()
            return resp.status, json.loads(body)
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        return e.code, body
    except Exception as e:
        return 0, str(e)

def get_json(url):
    try:
        with urllib.request.urlopen(url, timeout=10) as resp:
            body = resp.read().decode()
            return resp.status, json.loads(body)
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        return e.code, body
    except Exception as e:
        return 0, str(e)

print("=" * 60)
print("  HobbyBuddy API Test")
print("=" * 60)

# 0) Check services
print("\n[0] Checking services...")
status, data = get_json(f"{FASTAPI}/docs")
print(f"    FastAPI (8001): {'OK' if status == 200 else 'FAIL - ' + str(data)}")
status, data = get_json(f"{BASE}/api/users")
print(f"    Spring Boot (8080): {status} -> {data}")

# 1) Add Alice
print("\n[1] Adding Alice...")
status, data = post_json(f"{BASE}/api/users", {
    "name": "Alice", "password": "pwd", "email": "alice@test.com",
    "openness": 80, "conscientiousness": 70, "extraversion": 90,
    "agreeableness": 80, "neuroticism": 20
})
print(f"    Status: {status} | Response: {data}")

# 2) Add Bob
print("\n[2] Adding Bob...")
status, data = post_json(f"{BASE}/api/users", {
    "name": "Bob", "password": "pwd", "email": "bob@test.com",
    "openness": 30, "conscientiousness": 40, "extraversion": 20,
    "agreeableness": 50, "neuroticism": 80
})
print(f"    Status: {status} | Response: {data}")

# 3) Add Charlie
print("\n[3] Adding Charlie...")
status, data = post_json(f"{BASE}/api/users", {
    "name": "Charlie", "password": "pwd", "email": "charlie@test.com",
    "openness": 85, "conscientiousness": 65, "extraversion": 95,
    "agreeableness": 75, "neuroticism": 25
})
print(f"    Status: {status} | Response: {data}")

# 4) List all users
print("\n[4] Listing all users...")
status, data = get_json(f"{BASE}/api/users")
print(f"    Status: {status} | Users: {data}")

# 5) Find buddy for user 1
print("\n[5] Finding buddy for Alice (user 1)...")
status, data = get_json(f"{BASE}/api/users/1/find-buddy")
print(f"    Status: {status} | Match: {data}")

print("\n" + "=" * 60)
if isinstance(data, dict) and "name" in data:
    print(f"  SUCCESS! Alice's best buddy is: {data['name']}")
else:
    print("  TEST INCOMPLETE - check errors above")
print("=" * 60)
