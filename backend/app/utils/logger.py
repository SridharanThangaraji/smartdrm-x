import datetime

def log_event(event: str):
    print(f"[{datetime.datetime.utcnow()}] {event}")
