
"""
Real-time Camera Event Ingestion Script

This script demonstrates how to ingest events from a camera/ML pipeline 
into the Worker Productivity Dashboard in real-time.

Setup:
    pip install requests opencv-python numpy

Usage:
    # For testing with simulated events:
    python camera_ingest.py --api-url https://worker-productivity-dashboard-final-sage.vercel.app/ --simulate
    
    # For real camera integration:
    python camera_ingest.py --api-url https://worker-productivity-dashboard-final-sage.vercel.app/ --camera 0
    
    # For RTSP stream:
    python camera_ingest.py --api-url https://worker-productivity-dashboard-final-sage.vercel.app/ --camera rtsp://user:pass@ip:port/stream
"""

import argparse
import json
import time
import random
from datetime import datetime
from typing import Optional
import requests

DEFAULT_API_URL = "http://localhost:3000"
INGEST_INTERVAL = 15


class MockMLModel:
    def __init__(self):
        self.event_types = ["working", "idle", "absent", "product_count"]
        self.workers = ["W1", "W2", "W3", "W4", "W5", "W6"]
        self.stations = ["S1", "S2", "S3", "S4", "S5", "S6"]

    def predict(self, frame=None) -> dict:
        rand = random.random()
        if rand < 0.5:
            event_type = "working"
        elif rand < 0.65:
            event_type = "idle"
        elif rand < 0.80:
            event_type = "product_count"
        else:
            event_type = "absent"

        worker_idx = random.randint(0, len(self.workers) - 1)

        return {
            "worker_id": self.workers[worker_idx],
            "workstation_id": self.stations[worker_idx],
            "event_type": event_type,
            "confidence": round(0.85 + random.random() * 0.15, 3),
            "count": random.randint(1, 10) if event_type == "product_count" else 0
        }


class EventIngestor:
    def __init__(self, api_url: str):
        self.api_url = api_url.rstrip("/")
        self.events_endpoint = f"{self.api_url}/api/events"

    def send_event(self, event: dict) -> bool:
        try:
            response = requests.post(
                self.events_endpoint,
                json=event,
                headers={"Content-Type": "application/json"},
                timeout=10
            )

            if response.status_code == 200:
                print(
                    f"[OK] Event sent: {event['event_type']} for {event['worker_id']} at {event['workstation_id']}"
                )
                return True
            else:
                print(
                    f"[ERROR] Failed to send event: {response.status_code} - {response.text}"
                )
                return False

        except requests.exceptions.RequestException as e:
            print(f"[ERROR] Network error: {e}")
            return False

    def send_batch(self, events: list) -> int:
        success_count = 0
        for event in events:
            if self.send_event(event):
                success_count += 1
        return success_count


def run_simulation(api_url: str, duration_seconds: Optional[int] = None):
    print("\n=== Starting Simulated Camera Ingestion ===")
    print(f"API URL: {api_url}")
    print(f"Interval: {INGEST_INTERVAL} seconds")
    print(
        f"Duration: {'Indefinite' if duration_seconds is None else f'{duration_seconds}s'}"
    )
    print("Press Ctrl+C to stop\n")

    model = MockMLModel()
    ingestor = EventIngestor(api_url)

    start_time = time.time()
    events_sent = 0

    try:
        while True:
            if duration_seconds and (time.time() - start_time) >= duration_seconds:
                break

            prediction = model.predict()

            event = {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                **prediction
            }

            if ingestor.send_event(event):
                events_sent += 1

            time.sleep(INGEST_INTERVAL)

    except KeyboardInterrupt:
        print("\n\nStopping...")

    print("\n=== Simulation Complete ===")
    print(f"Total events sent: {events_sent}")
    print(f"Duration: {time.time() - start_time:.1f} seconds")


def run_camera_integration(api_url: str, camera_source):
    try:
        import cv2
    except ImportError:
        print("Error: OpenCV not installed. Run: pip install opencv-python")
        return

    print("\n=== Starting Camera Integration ===")
    print(f"API URL: {api_url}")
    print(f"Camera: {camera_source}")
    print("Press 'q' to quit\n")

    cap = cv2.VideoCapture(
        camera_source if isinstance(camera_source, str) else int(camera_source)
    )

    if not cap.isOpened():
        print(f"Error: Could not open camera {camera_source}")
        return

    model = MockMLModel()
    ingestor = EventIngestor(api_url)

    last_event_time = 0
    events_sent = 0

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                print("Error: Could not read frame")
                break

            cv2.imshow("Camera Feed", frame)

            current_time = time.time()
            if current_time - last_event_time >= INGEST_INTERVAL:
                prediction = model.predict(frame)

                event = {
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                    **prediction
                }

                if ingestor.send_event(event):
                    events_sent += 1

                last_event_time = current_time

            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

    except KeyboardInterrupt:
        print("\n\nStopping...")
    finally:
        cap.release()
        cv2.destroyAllWindows()

    print("\n=== Camera Integration Stopped ===")
    print(f"Total events sent: {events_sent}")


def main():
    parser = argparse.ArgumentParser(
        description="Real-time camera event ingestion for Worker Productivity Dashboard"
    )
    parser.add_argument(
        "--api-url",
        default=DEFAULT_API_URL
    )
    parser.add_argument(
        "--simulate",
        action="store_true"
    )
    parser.add_argument(
        "--camera",
        default="0"
    )
    parser.add_argument(
        "--duration",
        type=int,
        default=None
    )
    parser.add_argument(
        "--interval",
        type=int,
        default=INGEST_INTERVAL
    )

    args = parser.parse_args()

    global INGEST_INTERVAL
    INGEST_INTERVAL = args.interval

    if args.simulate:
        run_simulation(args.api_url, args.duration)
    else:
        run_camera_integration(args.api_url, args.camera)


if __name__ == "__main__":
    main()
