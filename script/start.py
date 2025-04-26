#!/usr/bin/env python3
"""
S.O.F.I.A. Unified Startup Script
This script starts all necessary components for the SOFIA project including:
- MCP Service
- Agent Service
- UI (CLI or Web)
"""

import argparse
import asyncio
import os
import signal
import subprocess
import sys
import time
import threading

# Import MCP server configurations
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from common.mcp_config import MCP_SERVERS

# Process handles
processes = []

def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description="Start SOFIA services")
    parser.add_argument("--ui", choices=["cli", "web"], default="cli", 
                      help="UI mode to use (cli or web)")
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

def start_process(cmd, name, cwd=None, shell=False):
    """Start a subprocess and add it to the global processes list"""
    env = os.environ.copy()
    # Set PYTHONPATH to include the current directory
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    if "PYTHONPATH" in env:
        env["PYTHONPATH"] = f"{project_root}:{env['PYTHONPATH']}"
    else:
        env["PYTHONPATH"] = project_root
    
    print(f"Starting {name}...")
    try:
        process = subprocess.Popen(
            cmd,
            cwd=cwd,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
            shell=shell
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

async def start_mcp_service():
    """Start the MCP service components"""
    # Set path to MCP service directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, ".."))
    mcp_service_dir = os.path.join(project_root, "services", "mcp-service")
    
    # Start all MCP servers based on MCP_SERVERS configuration
    mcp_processes = {}
    for server_name, config in MCP_SERVERS.items():
        if config["transport"] == "stdio":
            # Create full path for command args if needed
            args = [config["command"]]
            for arg in config["args"]:
                # Check if arg is a file path and make it absolute if it's relative
                if arg.endswith(".py") and not os.path.isabs(arg):
                    arg = os.path.join(project_root, arg)
                args.append(arg)
            
            # Start the server process
            process = start_process(
                args,
                f"{server_name.capitalize()} MCP Server",
                cwd=project_root
            )
            mcp_processes[server_name] = process
    
    # Wait for tools to start
    print("Waiting for MCP tools to start...")
    await asyncio.sleep(2)
    
    # Start output logging threads for each MCP server
    for server_name, process in mcp_processes.items():
        start_output_thread(process, server_name.upper())

async def start_agent_service():
    """Start the agent service components"""
    # Set path to agent service directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, ".."))
    agent_service_dir = os.path.join(project_root, "services", "agent-service")
    
    # Start agent - using project_root as cwd instead of agent_service_dir
    agent_process = start_process(
        ["python", os.path.join(agent_service_dir, "agent/src/main.py")],
        "Agent",
        cwd=project_root
    )
    
    # Wait for agent to start
    print("Waiting for agent to start...")
    await asyncio.sleep(2)
    
    # Start output logging thread
    start_output_thread(agent_process, "AGENT")

async def start_cli_ui():
    """Start the CLI UI"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, ".."))
    cli_dir = os.path.join(project_root, "ui", "cli")
    
    # Start CLI client
    cli_process = start_process(
        ["python", os.path.join(cli_dir, "src/client.py")],
        "CLI UI",
        cwd=cli_dir
    )
    
    # Start output logging thread
    start_output_thread(cli_process, "CLI")

async def start_web_ui():
    """Start the Web UI"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, ".."))
    web_dir = os.path.join(project_root, "ui", "web")
    
    # Start Next.js web UI
    web_process = start_process(
        ["npm", "run", "dev"],
        "Web UI",
        cwd=web_dir
    )
    
    # Start output logging thread
    start_output_thread(web_process, "WEB")

async def amain():
    """Async main entry point"""
    args = parse_args()
    
    try:
        # Start MCP service
        await start_mcp_service()
        
        # Start agent service
        await start_agent_service()
        
        # Start UI based on argument
        if args.ui == "cli":
            await start_cli_ui()
        else:  # web
            await start_web_ui()
        
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