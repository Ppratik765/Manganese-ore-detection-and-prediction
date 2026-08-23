"""
Standalone Backend Server Runner for MOIL Manganese Space-Tech Platform
Launches Uvicorn ASGI server hosting the FastAPI backend on port 8000.
"""

import os
import sys
import argparse
import uvicorn

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

def main():
    parser = argparse.ArgumentParser(description="MOIL Space-Tech & Shortfall Prevention FastAPI Runner")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="Host address to bind (default: 0.0.0.0)")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind (default: 8000)")
    parser.add_argument("--reload", action="store_true", default=False, help="Enable auto-reloading")
    args = parser.parse_args()

    print("=" * 75)
    print(">>> MOIL LIMITED - AI/ML & SPACE-TECH MANGANESE PLATFORM BACKEND <<<")
    print("=" * 75)
    print(f"Service running at:    http://{args.host if args.host != '0.0.0.0' else '127.0.0.1'}:{args.port}")
    print(f"Interactive Swagger:   http://{args.host if args.host != '0.0.0.0' else '127.0.0.1'}:{args.port}/docs")
    print(f"Health Status Check:   http://{args.host if args.host != '0.0.0.0' else '127.0.0.1'}:{args.port}/api/health")
    print(f"Reserves Exploration: http://{args.host if args.host != '0.0.0.0' else '127.0.0.1'}:{args.port}/api/reserves/grid?sector=balaghat")
    print("=" * 75)

    uvicorn.run(
        "backend.app.main:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        log_level="info"
    )

if __name__ == "__main__":
    main()
