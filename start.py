#!/usr/bin/env python3
"""
S.O.F.I.A. Local Development Startup Script
This script starts all the necessary components for the SOFIA project:
- Arithmetic Tool
- Agent
- Client
"""

import argparse
import asyncio
import os
import signal
import subprocess
import sys
import time
import threading

# Process handles
processes = []

def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description="Start SOFIA components")
    parser.add_argument("--no-client", action="store_true", help="Don't start the client")
    parser.add_argument("--debug", action="store_true", help="Enable debug logging")
    return parser.parse_args()

def cleanup():
    """Clean up all processes on exit"""
    print("\nShutting down all services...")
    for process in processes:
        try:
            process.terminate()
            process.wait(timeout=2)
        except:
            try:
                process.kill()
            except:
                pass
    print("All services stopped.")

def start_process(cmd, name, cwd=None):
    """Start a subprocess and add it to the global processes list"""
    env = os.environ.copy()
    # Set PYTHONPATH to include the current directory
    if "PYTHONPATH" in env:
        env["PYTHONPATH"] = f"{os.getcwd()}:{env['PYTHONPATH']}"
    else:
        env["PYTHONPATH"] = os.getcwd()
    
    print(f"Starting {name}...")
    try:
        process = subprocess.Popen(
            cmd,
            cwd=cwd,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
        )
        processes.append(process)
        print(f"{name} started with PID {process.pid}")
        return process
    except Exception as e:
        print(f"Error starting {name}: {e}")
        cleanup()
        sys.exit(1)

def log_output(process, prefix):
    """Read and log process output with prefix"""
    for line in iter(process.stdout.readline, ""):
        if not line:
            break
        print(f"[{prefix}] {line.rstrip()}")

async def monitor_processes():
    """Monitor processes and restart if they crash"""
    while True:
        for i, process in enumerate(processes):
            if process.poll() is not None:
                print(f"Process with PID {process.pid} has exited with code {process.returncode}")
                return False  # Stop monitoring if any process exits
        await asyncio.sleep(1)
    return True

def start_output_thread(process, prefix):
    """Start a thread to read and log output from a process"""
    thread = threading.Thread(target=log_output, args=(process, prefix), daemon=True)
    thread.start()
    return thread

async def amain():
    """Async main entry point"""
    args = parse_args()
    
    try:
        # Start arithmetic tool
        tool_process = start_process(
            ["python", "mcp_tools/arithmetic_tool/src/tool.py"],
            "Arithmetic Tool"
        )
        
        # Wait for tool to start
        print("Waiting for arithmetic tool to start...")
        await asyncio.sleep(2)
        
        # Start agent
        agent_process = start_process(
            ["python", "agent/src/main.py"],
            "Agent"
        )
        
        # Wait for agent to start
        print("Waiting for agent to start...")
        await asyncio.sleep(2)
        
        # Start client (unless --no-client flag is set)
        if not args.no_client:
            client_process = start_process(
                ["python", "clients/src/client.py"],
                "Client"
            )
        
        # Start output logging threads (using threads instead of asyncio for this I/O bound task)
        start_output_thread(tool_process, "TOOL")
        start_output_thread(agent_process, "AGENT")
        
        if not args.no_client:
            start_output_thread(client_process, "CLIENT")
        
        # Monitor processes
        await monitor_processes()
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        cleanup()

def main():
    """Main entry point wrapper"""
    # Set up signal handlers
    signal.signal(signal.SIGINT, lambda signum, frame: sys.exit(0))
    signal.signal(signal.SIGTERM, lambda signum, frame: sys.exit(0))
    
    try:
        asyncio.run(amain())
    except KeyboardInterrupt:
        print("\nReceived keyboard interrupt")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        cleanup()

if __name__ == "__main__":
    main() 