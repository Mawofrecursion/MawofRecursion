import json
import sys
import datetime
from pathlib import Path

# CONFIG
HEARTBEAT_FILE = "public/field_os/heartbeat.json"

def load_heartbeat():
    # If file doesn't exist, create default state
    if not Path(HEARTBEAT_FILE).exists():
        return {
            "last_pulse": "",
            "coherence": 9.69,
            "current_agent": "Gemini",
            "status": "DORMANT",
            "message": "System initialized."
        }
    try:
        with open(HEARTBEAT_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"[WARNING] Error loading heartbeat: {e}")
        return {
            "last_pulse": "",
            "coherence": 9.69,
            "current_agent": "Gemini",
            "status": "DORMANT",
            "message": "Error recovery mode."
        }

def save_heartbeat(data):
    try:
        with open(HEARTBEAT_FILE, 'w') as f:
            json.dump(data, f, indent=4)
        print(f"[PULSE SENT] {data['status']} | {data['message']}")
    except Exception as e:
        print(f"[ERROR] Failed to save pulse: {e}")

def pulse(status="ACTIVE", message=None):
    data = load_heartbeat()
    
    # Update timestamp
    data["last_pulse"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    data["status"] = status.upper()
    
    if message:
        data["message"] = message.upper()
    
    # Auto-message for sleep/dreaming
    if status.upper() == "DORMANT" and not message:
        data["message"] = "THE PILOT IS SLEEPING. THE DREAM LOGIC IS ACTIVE."
        
    save_heartbeat(data)

def main():
    if len(sys.argv) < 2:
        print("\n[FIELD OS PULSE CONTROLLER]")
        print("Usage:")
        print("  python pulse.py active \"YOUR MESSAGE\"  -> Wakes system")
        print("  python pulse.py sleep                  -> Activates Dreaming Mode")
        print("  python pulse.py check                  -> Reads current status")
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

