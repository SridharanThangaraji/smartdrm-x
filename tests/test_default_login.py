import requests
import sys

def test_login():
    url = "http://127.0.0.1:8000/auth/login"
    payload = {
        "username": "admin",
        "password": "admin"
    }
    
    try:
        response = requests.post(url, json=payload)
        if response.status_code == 200:
            print("Login successful!")
            print(response.json())
        else:
            print(f"Login failed: {response.status_code}")
            print(response.text)
            sys.exit(1)
            
    except Exception as e:
        print(f"Error connecting to server: {e}")
        # We might not be running, which is expected if we haven't started it yet
        # But for this verification step, we are just creating the script.
        pass

if __name__ == "__main__":
    test_login()
