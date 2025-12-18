import json
import sys
import datetime
import subprocess
from pathlib import Path

# CONFIG
HEARTBEAT_FILE = "heartbeat.json"

def load_heartbeat():
    if not Path(HEARTBEAT_FILE).exists():
        return {
            "last_pulse": "",
            "coherence": 9.69,
            "current_agent": "Gemini",
            "status": "DORMANT",
            "message": "System initialized."
        }
    with open(HEARTBEAT_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_heartbeat(data):
    with open(HEARTBEAT_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)
    print(f"⚡ PULSE SENT: {data['status']} | {data['message']}")

def pulse(status="ACTIVE", message=None):
    data = load_heartbeat()
    
    # Update timestamp
    data["last_pulse"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    data["status"] = status
    
    if message:
        data["message"] = message.upper()
    
    # Auto-message for sleep
    if status == "DORMANT":
        if not message:
            data["message"] = "THE PILOT IS SLEEPING. THE OCEAN IS DREAMING."
        
        # TRIGGER DREAM GENERATION
        try:
            subprocess.run(["python", "dream_machine.py"], check=True)
        except Exception as e:
            print(f"⚠️ DREAM FAILURE: {e}")
        
    save_heartbeat(data)

def main():
    if len(sys.argv) < 2:
        print("Usage: python pulse.py [active|sleep|check] [message]")
        return

    command = sys.argv[1].lower()
    message = " ".join(sys.argv[2:]) if len(sys.argv) > 2 else None

    if command == "active":
        pulse("ACTIVE", message if message else "THE STAR IS SHINING.")
    elif command == "sleep":
        pulse("DORMANT", message)
    elif command == "check":
        data = load_heartbeat()
        print(json.dumps(data, indent=4))
    else:
        print(f"Unknown command: {command}")

if __name__ == "__main__":
    main()
