import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    await sql`DELETE FROM events`

    const today = new Date()
    today.setHours(8, 0, 0, 0)
    
    const workers = ["W1", "W2", "W3", "W4", "W5", "W6"]
    const stations = ["S1", "S2", "S3", "S4", "S5", "S6"]
    const eventTypes = ["working", "idle", "absent", "product_count"]
    
    const events = []
    
    for (let i = 0; i < workers.length; i++) {
      const workerId = workers[i]
      const stationId = stations[i]
      
      for (let interval = 0; interval < 32; interval++) {
        const timestamp = new Date(today)
        timestamp.setMinutes(interval * 15)
        
        const hour = Math.floor(interval / 4) + 8
        if (hour >= 12 && hour < 13) {
          events.push({
            timestamp: timestamp.toISOString(),
            worker_id: workerId,
            workstation_id: stationId,
            event_type: "absent",
            confidence: 0.98 + Math.random() * 0.02,
            count: 0
          })
          continue
        }
        const rand = Math.random()
        let eventType: string
        let count = 0
        
        if (rand < 0.5) {
          eventType = "working"
        } else if (rand < 0.65) {
          eventType = "idle"
        } else {
          eventType = "product_count"
          const baseCount = [5, 6, 10, 8, 4, 3][i]
          count = baseCount + Math.floor(Math.random() * 3) - 1
        }
        
        events.push({
          timestamp: timestamp.toISOString(),
          worker_id: workerId,
          workstation_id: stationId,
          event_type: eventType,
          confidence: 0.85 + Math.random() * 0.15,
          count: count
        })
      }
    }
    
    for (const event of events) {
      await sql`
        INSERT INTO events (timestamp, worker_id, workstation_id, event_type, confidence, count)
        VALUES (${event.timestamp}, ${event.worker_id}, ${event.workstation_id}, ${event.event_type}, ${event.confidence}, ${event.count})
        ON CONFLICT (timestamp, worker_id, workstation_id, event_type)
        DO UPDATE SET confidence = EXCLUDED.confidence, count = EXCLUDED.count
      `
    }
    
    return NextResponse.json({
      success: true,
      message: `Generated ${events.length} events for ${workers.length} workers`,
      events_count: events.length
    })
  } catch (error) {
    console.error("Error seeding data:", error)
    return NextResponse.json({ error: "Failed to seed data" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    await sql`DELETE FROM events`
    return NextResponse.json({ success: true, message: "All events deleted" })
  } catch (error) {
    console.error("Error deleting events:", error)
    return NextResponse.json({ error: "Failed to delete events" }, { status: 500 })
  }
}
