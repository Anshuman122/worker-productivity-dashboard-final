# Worker Productivity Dashboard

A full-stack web application that ingests events from CCTV computer vision systems and displays productivity metrics for a manufacturing factory setup.

## Live Demo

[View Live Application](https://worker-productivity-dashboard.vercel.app/)

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    CV System    │───>│   Backend API   │───>│    Dashboard    │
│  (CCTV Events)  │    │   (Next.js)     │    │    (React)      │
└─────────────────┘    └────────┬────────┘    └─────────────────┘
                                │
                       ┌────────▼────────┐
                       │    PostgreSQL   │
                       │     (Neon)      │
                       └─────────────────┘
```

### Edge to Backend to Dashboard Flow

1. **Edge (CV System)**: Computer vision cameras detect worker activity and generate structured JSON events with timestamp, worker_id, workstation_id, event_type, and confidence score.

2. **Backend (Next.js API Routes)**: 
   - `POST /api/events` - Ingests events from the CV system
   - `GET /api/metrics` - Computes and returns productivity metrics
   - `GET /api/events` - Retrieves event history with filtering
   - `POST /api/seed` - Regenerates dummy data for testing
   - `DELETE /api/seed` - Clears all events

3. **Dashboard (React)**: Real-time visualization of metrics with auto-refresh every 30 seconds.

## Database Schema

### Workers Table
```sql
CREATE TABLE workers (
  id SERIAL PRIMARY KEY,
  worker_id VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Workstations Table
```sql
CREATE TABLE workstations (
  id SERIAL PRIMARY KEY,
  station_id VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Events Table
```sql
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  worker_id VARCHAR(10) NOT NULL REFERENCES workers(worker_id),
  workstation_id VARCHAR(10) NOT NULL REFERENCES workstations(station_id),
  event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('working', 'idle', 'absent', 'product_count')),
  confidence DECIMAL(4, 3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_event UNIQUE (timestamp, worker_id, workstation_id, event_type)
);
```

## Metric Definitions

### Worker-Level Metrics
| Metric | Definition | Calculation |
|--------|------------|-------------|
| Total Active Time | Time spent working | Count of 'working' events × 15 minutes |
| Total Idle Time | Time spent idle | Count of 'idle' events × 15 minutes |
| Utilization % | Productive time ratio | (Working Events / (Working + Idle Events)) × 100 |
| Total Units Produced | Products completed | Sum of 'count' from 'product_count' events |
| Units per Hour | Production rate | Total Units / (Active Time in hours) |

### Workstation-Level Metrics
| Metric | Definition | Calculation |
|--------|------------|-------------|
| Occupancy Time | Time station was in use | Count of (working + product_count) events × 15 minutes |
| Utilization % | Station usage ratio | Occupied Events / Total Events × 100 |
| Total Units Produced | Products at this station | Sum of 'count' from 'product_count' events |
| Throughput Rate | Station output rate | Total Units / (Occupancy Time in hours) |

### Factory-Level Metrics
| Metric | Definition | Calculation |
|--------|------------|-------------|
| Total Productive Time | Combined active time | Sum of all 'working' events × 15 minutes |
| Total Production Count | Total units produced | Sum of all 'product_count' counts |
| Avg Production Rate | Factory-wide output rate | Total Production / (Total Productive Time in hours) |
| Avg Utilization | Factory efficiency | Working Events / (Working + Idle Events) × 100 |

## Assumptions and Tradeoffs

### Time Interval Assumption
- **Each event represents a 15-minute interval**. This is based on typical CCTV monitoring where status is captured at regular intervals.
- A shift is assumed to be 8 hours (8:00 AM to 4:00 PM with 1-hour lunch break).

### Production Event Aggregation
- `product_count` events are separate from `working` events
- A worker can have both a `working` event and a `product_count` event at the same timestamp
- Production counts are aggregated per worker/workstation regardless of accompanying status events

### Tradeoffs Made
1. **Simplicity vs Accuracy**: Using fixed 15-minute intervals simplifies calculations but may miss granular activity changes
2. **Single Station Assignment**: Each worker is assumed to work at one primary station per shift
3. **Real-time vs Historical**: Dashboard shows current/recent data; historical trend analysis would require additional queries

---

## Handling Edge Cases

### 1. Intermittent Connectivity

**Problem**: Network issues between edge cameras and backend may cause events to arrive late or fail.

**Solutions Implemented**:
- **Idempotent Event Ingestion**: Using `ON CONFLICT DO UPDATE` ensures duplicate events don't create data inconsistencies
- **Timestamp-based Processing**: Events are stored with their original timestamp, not server receipt time

**Recommended Enhancements**:
- Implement a local buffer/queue on edge devices using Redis or SQLite
- Add retry logic with exponential backoff
- Use message queues (AWS SQS, RabbitMQ) for guaranteed delivery
- Implement webhook confirmations for critical events

### 2. Duplicate Events

**Problem**: Network retries or system errors may send the same event multiple times.

**Solution Implemented**:
```sql
CONSTRAINT unique_event UNIQUE (timestamp, worker_id, workstation_id, event_type)
```

The unique constraint on `(timestamp, worker_id, workstation_id, event_type)` prevents duplicate entries. The API uses `ON CONFLICT DO UPDATE` to handle duplicates gracefully by updating confidence/count if re-sent.

### 3. Out-of-Order Timestamps

**Problem**: Events may arrive at the backend in a different order than they occurred.

**Solutions Implemented**:
- Events are stored with their original timestamp from the CV system
- Queries always `ORDER BY timestamp` to ensure correct chronological display
- Metrics aggregation uses timestamp ranges, not insertion order

**Recommended Enhancements**:
- Add a sequence number field for strict ordering
- Implement event buffering window (e.g., wait 30 seconds before processing)
- Use timestamp + event_id for deterministic ordering

---

## Scaling Considerations

### From 5 Cameras to 100+ Cameras

**Current Architecture (5 cameras)**:
- Direct API calls from each camera
- Single database instance
- Synchronous processing

**Scaling to 100+ Cameras**:

1. **Message Queue Introduction**
   - Add AWS SQS, Kafka, or RabbitMQ between cameras and backend
   - Enables buffering during traffic spikes
   - Allows parallel consumer workers

2. **Database Optimization**
   - Implement table partitioning by timestamp (monthly/weekly)
   - Add read replicas for dashboard queries
   - Consider time-series database (TimescaleDB) for event data

3. **API Layer**
   - Deploy as serverless functions (Vercel Edge Functions)
   - Add rate limiting per camera/site
   - Implement batch event ingestion endpoint

### Multi-Site Deployment

**Architecture for Multi-Site**:

```
Site A Cameras ─┐
                ├──> Regional Edge Server ─┐
Site B Cameras ─┘                          │
                                           ├──> Central Cloud Backend
Site C Cameras ─┐                          │
                ├──> Regional Edge Server ─┘
Site D Cameras ─┘
```

**Key Changes**:
1. **Regional Edge Servers**: Local processing and buffering at each site
2. **Hierarchical Data Model**: Add `site_id` to all entities
3. **Data Replication**: Use PostgreSQL logical replication or event streaming
4. **Multi-tenant Dashboard**: Site-level filtering and aggregation

---

## Model Versioning and Drift Detection

### Adding Model Versioning

**Schema Enhancement**:
```sql
ALTER TABLE events ADD COLUMN model_version VARCHAR(20);
ALTER TABLE events ADD COLUMN model_id VARCHAR(50);

CREATE TABLE ml_models (
  id SERIAL PRIMARY KEY,
  model_id VARCHAR(50) UNIQUE NOT NULL,
  version VARCHAR(20) NOT NULL,
  deployed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metrics JSONB,
  status VARCHAR(20) DEFAULT 'active'
);
```

**Event Payload Enhancement**:
```json
{
  "timestamp": "2026-01-15T10:15:00Z",
  "worker_id": "W1",
  "workstation_id": "S3",
  "event_type": "working",
  "confidence": 0.93,
  "model_version": "v2.3.1",
  "model_id": "worker-detection-cnn"
}
```

### Detecting Model Drift

**Drift Detection Strategies**:

1. **Confidence Score Monitoring**
   - Track average confidence per model version
   - Alert if confidence drops below threshold (e.g., < 0.85)
   - Compare confidence distributions across time windows

2. **Statistical Process Control**
   ```sql
   -- Monitor confidence drift
   SELECT 
     DATE_TRUNC('hour', timestamp) as hour,
     model_version,
     AVG(confidence) as avg_confidence,
     STDDEV(confidence) as std_confidence
   FROM events
   WHERE timestamp > NOW() - INTERVAL '24 hours'
   GROUP BY hour, model_version
   ORDER BY hour;
   ```

3. **Event Type Distribution Monitoring**
   - Compare event type ratios (working:idle:absent) over time
   - Detect anomalies in production count patterns

4. **Ground Truth Sampling**
   - Periodically sample events for human verification
   - Track accuracy degradation over time

### Triggering Retraining

**Automated Retraining Pipeline**:

```
Monitoring ──> Drift Alert ──> Data Collection ──> Retraining ──> Validation ──> Deployment
```

**Trigger Conditions**:
1. Average confidence drops below 0.85 for > 1 hour
2. Event type distribution shifts > 20% from baseline
3. Manual ground truth accuracy drops below 90%
4. New workstation type or worker added
5. Scheduled monthly retraining

**Implementation**:
```typescript
// Example drift detection job
async function checkModelDrift() {
  const metrics = await sql`
    SELECT 
      model_version,
      AVG(confidence) as avg_conf,
      COUNT(*) as event_count
    FROM events 
    WHERE timestamp > NOW() - INTERVAL '1 hour'
    GROUP BY model_version
  `;
  
  for (const metric of metrics) {
    if (metric.avg_conf < 0.85) {
      await triggerRetrainingPipeline({
        model_version: metric.model_version,
        reason: 'confidence_drift',
        current_confidence: metric.avg_conf
      });
    }
  }
}
```

---

## API Documentation

### POST /api/events - Ingest Event

Ingests a single event into the system. Evaluators can use this endpoint to add custom test data.

**Request**:
```json
{
  "timestamp": "2026-01-15T10:15:00Z",
  "worker_id": "W1",
  "workstation_id": "S3",
  "event_type": "working",
  "confidence": 0.93,
  "count": 0
}
```

**Response** (201 Created):
```json
{
  "id": 123,
  "timestamp": "2026-01-15T10:15:00Z",
  "worker_id": "W1",
  "workstation_id": "S3",
  "event_type": "working",
  "confidence": 0.93,
  "count": 0,
  "created_at": "2026-01-15T10:15:05Z"
}
```

**cURL Example**:
```bash
curl -X POST https://worker-productivity-dashboard.vercel.app/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2026-01-28T10:15:00Z",
    "worker_id": "W1",
    "workstation_id": "S1",
    "event_type": "working",
    "confidence": 0.95,
    "count": 0
  }'
```

### GET /api/events - Query Events

**Query Parameters**:
- `worker_id` (optional): Filter by worker
- `workstation_id` (optional): Filter by workstation
- `event_type` (optional): Filter by type (working, idle, absent, product_count, all)
- `limit` (optional): Max results (default: 100)

**Example**:
```bash
curl "https://worker-productivity-dashboard.vercel.app/api/events?worker_id=W1&limit=10"
```

### GET /api/metrics - Get Productivity Metrics

**Response**:
```json
{
  "workers": [...],
  "workstations": [...],
  "factory": {
    "total_productive_time_minutes": 1440,
    "total_production_count": 523,
    "average_production_rate": 21.8,
    "average_utilization": 78.5
  },
  "assumptions": {
    "interval_minutes": 15,
    "shift_hours": 8,
    "notes": [...]
  }
}
```

### POST /api/seed - Refresh Dummy Data

Regenerates sample events for testing. No request body required.

**Example**:
```bash
curl -X POST https://worker-productivity-dashboard.vercel.app/api/seed
```

### DELETE /api/seed - Clear All Events

Removes all events from the database.

**Example**:
```bash
curl -X DELETE https://worker-productivity-dashboard.vercel.app/api/seed
```

---

## Evaluator Guide

### Testing Custom Data

Evaluators can add custom data in two ways:

1. **Via Dashboard UI**: Click the "Add Event" button in the dashboard header to open a form for adding individual events.

2. **Via API**: Use the `POST /api/events` endpoint to programmatically add events.

### Testing Scenarios

**Scenario 1: High Production Worker**
```bash
# Add multiple product_count events for W1
for i in {1..10}; do
  curl -X POST https://worker-productivity-dashboard.vercel.app/api/events \
    -H "Content-Type: application/json" \
    -d "{
      \"timestamp\": \"2026-01-28T0${i}:00:00Z\",
      \"worker_id\": \"W1\",
      \"workstation_id\": \"S1\",
      \"event_type\": \"product_count\",
      \"confidence\": 0.95,
      \"count\": 15
    }"
done
```

**Scenario 2: Idle Worker**
```bash
curl -X POST https://worker-productivity-dashboard.vercel.app/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2026-01-28T14:00:00Z",
    "worker_id": "W3",
    "workstation_id": "S3",
    "event_type": "idle",
    "confidence": 0.88,
    "count": 0
  }'
```

**Scenario 3: Reset and Fresh Data**
```bash
# Clear all events
curl -X DELETE https://worker-productivity-dashboard.vercel.app/api/seed

# Generate fresh dummy data
curl -X POST https://worker-productivity-dashboard.vercel.app/api/seed
```

---

## Local Development

### Prerequisites
- Node.js 18+ (tested with v22.13.1)
- npm or pnpm
- Neon PostgreSQL account (free tier available at https://neon.tech)

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd worker-productivity-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create Neon Database**
   - Go to https://console.neon.tech
   - Create a new project
   - Copy the connection string from the dashboard

4. **Configure environment variables**
   ```bash
   # Copy the example env file
   cp .env.example .env.local
   
   # Edit .env.local and add your Neon connection string
   # DATABASE_URL=postgres://user:password@host.neon.tech/dbname?sslmode=require
   ```

5. **Initialize the database**
   - Option A: Run via Neon SQL Editor
     - Go to Neon Console > SQL Editor
     - Copy contents of `scripts/setup-database.sql`
     - Execute the SQL
   
   - Option B: Use psql
     ```bash
     psql $DATABASE_URL -f scripts/setup-database.sql
     ```

6. **Start development server**
   ```bash
   npm run dev
   ```

7. **Open in browser**
   - Navigate to http://localhost:3000

### Troubleshooting

**Error: No database connection string was provided to neon()**
- Make sure `.env.local` file exists in project root
- Verify DATABASE_URL is set correctly
- Restart the dev server after adding env variables

**Multiple lockfile warning**
- Delete `pnpm-lock.yaml` if you're using npm, or delete `package-lock.json` if using pnpm
- Or add to next.config.mjs: `turbopack: { root: process.cwd() }`

### Docker Setup

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - db
  
  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=productivity
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    volumes:
      - ./scripts/setup-database.sql:/docker-entrypoint-initdb.d/init.sql
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

**Run with Docker**:
```bash
docker-compose up --build
```

---

## Tech Stack

- **Frontend**: Next.js 16, React, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Neon Serverless)
- **State Management**: SWR for data fetching
- **Charts**: Recharts (planned for extended analytics)

---

## Real-Time Camera Ingestion

This project includes a Python script (`scripts/camera_ingest.py`) that demonstrates how to ingest events from a camera/ML pipeline in real-time.

### Installation

```bash
pip install requests opencv-python numpy
```

### Usage

**Simulation Mode (no camera required)**:
```bash
# Point to your deployed app or localhost
python scripts/camera_ingest.py --api-url https://worker-productivity-dashboard.vercel.app --simulate

# Run for specific duration
python scripts/camera_ingest.py --api-url http://localhost:3000 --simulate --duration 300

# Custom interval (default 15 seconds)
python scripts/camera_ingest.py --api-url http://localhost:3000 --simulate --interval 5
```

**Real Camera Integration**:
```bash
# USB camera (index 0)
python scripts/camera_ingest.py --api-url https://worker-productivity-dashboard.vercel.app--camera 0

# RTSP stream
python scripts/camera_ingest.py --api-url https://worker-productivity-dashboard.vercel.app --camera "rtsp://user:pass@ip:port/stream"
```

### Integrating Your ML Model

The script includes a `MockMLModel` class that simulates predictions. Replace this with your actual model:

```python
class YourMLModel:
    def __init__(self):
        # Load your trained model here
        self.model = load_model("path/to/model.h5")
    
    def predict(self, frame):
        # Preprocess frame
        preprocessed = preprocess(frame)
        
        # Run inference
        prediction = self.model.predict(preprocessed)
        
        # Return structured result
        return {
            "worker_id": extract_worker_id(prediction),
            "workstation_id": extract_station_id(prediction),
            "event_type": classify_activity(prediction),
            "confidence": prediction.confidence,
            "count": count_products(prediction) if is_production_event else 0
        }
```

### Architecture for Production

```
Camera ──> Edge Device ──> ML Model ──> Event Queue ──> API ──> Dashboard
           (Jetson/Pi)     (YOLO/etc)   (Redis/SQS)
```

For production deployments:
1. Run the ML model on edge devices (NVIDIA Jetson, Raspberry Pi with Coral)
2. Buffer events locally during network outages
3. Use a message queue for reliable delivery
4. Implement batch uploads for efficiency

---

## Future Enhancements

1. Historical trend visualization with charts
2. Real-time WebSocket updates
3. Alerting system for low utilization
4. Shift comparison analytics
5. Export to CSV/PDF reports
6. Mobile-responsive PWA
