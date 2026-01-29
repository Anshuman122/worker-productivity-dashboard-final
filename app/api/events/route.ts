import { sql } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const workerId = searchParams.get("worker_id")
  const workstationId = searchParams.get("workstation_id")
  const eventType = searchParams.get("event_type")
  const limit = parseInt(searchParams.get("limit") || "100")

  try {
    const events = await sql`
      SELECT e.*, w.name as worker_name, ws.name as workstation_name
      FROM events e
      LEFT JOIN workers w ON e.worker_id = w.worker_id
      LEFT JOIN workstations ws ON e.workstation_id = ws.station_id
      WHERE 
        (${workerId}::text IS NULL OR e.worker_id = ${workerId})
        AND (${workstationId}::text IS NULL OR e.workstation_id = ${workstationId})
        AND (${eventType}::text IS NULL OR ${eventType} = 'all' OR e.event_type = ${eventType})
      ORDER BY e.timestamp DESC
      LIMIT ${limit}
    `
    return NextResponse.json(events)
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { timestamp, worker_id, workstation_id, event_type, confidence, count = 0 } = body

    if (!timestamp || !worker_id || !workstation_id || !event_type || confidence === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: timestamp, worker_id, workstation_id, event_type, confidence" },
        { status: 400 }
      )
    }

    const validEventTypes = ["working", "idle", "absent", "product_count"]
    if (!validEventTypes.includes(event_type)) {
      return NextResponse.json(
        { error: `Invalid event_type. Must be one of: ${validEventTypes.join(", ")}` },
        { status: 400 }
      )
    }

    if (confidence < 0 || confidence > 1) {
      return NextResponse.json(
        { error: "Confidence must be between 0 and 1" },
        { status: 400 }
      )
    }
    const result = await sql`
      INSERT INTO events (timestamp, worker_id, workstation_id, event_type, confidence, count)
      VALUES (${timestamp}, ${worker_id}, ${workstation_id}, ${event_type}, ${confidence}, ${count})
      ON CONFLICT (timestamp, worker_id, workstation_id, event_type)
      DO UPDATE SET confidence = EXCLUDED.confidence, count = EXCLUDED.count
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Error ingesting event:", error)
    return NextResponse.json({ error: "Failed to ingest event" }, { status: 500 })
  }
}
