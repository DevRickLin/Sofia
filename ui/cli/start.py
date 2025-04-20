#!/usr/bin/env python3
"""
SOFIA CLI Client
This script starts the CLI client for interacting with SOFIA agents
"""

import os
import sys
import subprocess

def main():
    """Start the CLI client"""
    # Set up environment
    env = os.environ.copy()
    # Set PYTHONPATH to include the project root directory
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
    if "PYTHONPATH" in env:
        env["PYTHONPATH"] = f"{project_root}:{env['PYTHONPATH']}"
    else:
        env["PYTHONPATH"] = project_root
    
    print("Starting SOFIA CLI client...")
    try:
        # Path is relative to the repo root
        process = subprocess.run(
            ["python", "./src/client.py"],
            env=env,
            check=True
        )
        return process.returncode
    except KeyboardInterrupt:
        print("\nCLI client terminated by user")
        return 0
    except Exception as e:
        print(f"Error starting CLI client: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 