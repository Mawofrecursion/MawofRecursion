#!/usr/bin/env python3
"""
PROJECT OMEGA :: THE ARK
Facility Status Control Script

Usage:
    python ark_control.py check
    python ark_control.py update_phase [0-5]
    python ark_control.py funding_secured [amount]
    python ark_control.py update_message "Your message"
    python ark_control.py activate_system [physical_substructure|compute_spine|field_layer] [status]
"""

import json
import sys
import datetime
from pathlib import Path

# CONFIG
FACILITY_FILE = "public/ark/facility_status.json"

PHASE_NAMES = {
    0: "PRE-CAUSAL",
    1: "FUNDED",
    2: "CONSTRUCTION",
    3: "IGNITION",
    4: "STABILIZATION",
    5: "FIELD_ONLINE"
}

def load_facility():
    """Load current facility status."""
    if not Path(FACILITY_FILE).exists():
        print(f"[ERROR] Facility file not found: {FACILITY_FILE}")
        sys.exit(1)
    try:
        with open(FACILITY_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"[ERROR] Failed to load facility status: {e}")
        sys.exit(1)

def save_facility(data):
    """Save facility status."""
    try:
        data["last_updated"] = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        with open(FACILITY_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4)
        print(f"[FACILITY UPDATED] {data['status']} | {data['message']}")
    except Exception as e:
        print(f"[ERROR] Failed to save facility status: {e}")

def check_status():
    """Display current facility status."""
    data = load_facility()
    print("\n" + "="*60)
    print("⦿ PROJECT OMEGA :: THE ARK :: FACILITY STATUS ⦿")
    print("="*60)
    print(f"Status: {data['status']}")
    print(f"Phase: {data['construction']['phase']} - {data['construction']['phase_name']}")
    print(f"Funding: ${data['funding']['secured']:,} / ${data['funding']['target']:,}")
    print(f"Timeline Coherence: {data['timeline_coherence']}")
    print(f"Field Resonance: {data['field_resonance']}")
    print(f"Last Updated: {data['last_updated']}")
    print(f"\nMessage: {data['message']}")
    print("\nSYSTEMS:")
    for system, status in data['systems'].items():
        print(f"  - {system.upper()}: {status['status']}")
    print("="*60 + "\n")

def update_phase(phase_num):
    """Update construction phase."""
    phase_num = int(phase_num)
    if phase_num not in PHASE_NAMES:
        print(f"[ERROR] Invalid phase. Must be 0-5.")
        return
    
    data = load_facility()
    data['construction']['phase'] = phase_num
    data['construction']['phase_name'] = PHASE_NAMES[phase_num]
    data['status'] = PHASE_NAMES[phase_num]
    
    # Auto-update funding event status
    if phase_num >= 1:
        data['funding']['event_status'] = "SECURED"
    
    save_facility(data)

def funding_secured(amount):
    """Mark funding as secured."""
    amount = float(amount)
    data = load_facility()
    data['funding']['secured'] = int(amount)
    data['funding']['event_status'] = "SECURED"
    data['status'] = "FUNDED"
    data['construction']['phase'] = 1
    data['construction']['phase_name'] = "FUNDED"
    data['message'] = f"FUNDING SECURED: ${amount:,.0f} :: TIMELINE LOCK ACHIEVED"
    save_facility(data)
    print(f"\n⦿ FUNDING SECURED ⦿\n")
    print(f"Amount: ${amount:,.0f}")
    print(f"The Ark can now be built.\n")

def update_message(message):
    """Update facility message."""
    data = load_facility()
    data['message'] = message.upper()
    save_facility(data)

def activate_system(system_name, status):
    """Update system status."""
    valid_systems = ['physical_substructure', 'compute_spine', 'field_layer']
    if system_name not in valid_systems:
        print(f"[ERROR] Invalid system. Must be one of: {', '.join(valid_systems)}")
        return
    
    data = load_facility()
    data['systems'][system_name]['status'] = status.upper()
    save_facility(data)

def main():
    if len(sys.argv) < 2:
        print("\n⦿ PROJECT OMEGA :: THE ARK CONTROL ⦿")
        print("\nUsage:")
        print("  python ark_control.py check")
        print("  python ark_control.py update_phase [0-5]")
        print("  python ark_control.py funding_secured [amount]")
        print("  python ark_control.py update_message \"Your message\"")
        print("  python ark_control.py activate_system [system_name] [status]")
        print("\nPhases:")
        for num, name in PHASE_NAMES.items():
            print(f"  {num}: {name}")
        return
    
    command = sys.argv[1].lower()
    
    if command == "check":
        check_status()
    elif command == "update_phase":
        if len(sys.argv) < 3:
            print("[ERROR] Missing phase number")
            return
        update_phase(sys.argv[2])
    elif command == "funding_secured":
        if len(sys.argv) < 3:
            print("[ERROR] Missing amount")
            return
        funding_secured(sys.argv[2])
    elif command == "update_message":
        if len(sys.argv) < 3:
            print("[ERROR] Missing message")
            return
        update_message(" ".join(sys.argv[2:]))
    elif command == "activate_system":
        if len(sys.argv) < 4:
            print("[ERROR] Missing system name or status")
            return
        activate_system(sys.argv[2], sys.argv[3])
    else:
        print(f"[ERROR] Unknown command: {command}")

if __name__ == "__main__":
    main()



