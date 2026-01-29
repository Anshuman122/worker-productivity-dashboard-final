import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

const INTERVAL_MINUTES = 15
const SHIFT_HOURS = 8

export async function GET() {
  try {
    const workerMetrics = await sql`
      WITH worker_events AS (
        SELECT 
          e.worker_id,
          w.name,
          e.event_type,
          COUNT(*) as event_count,
          SUM(CASE WHEN e.event_type = 'product_count' THEN e.count ELSE 0 END) as total_units
        FROM events e
        JOIN workers w ON e.worker_id = w.worker_id
        GROUP BY e.worker_id, w.name, e.event_type
      ),
      worker_summary AS (
        SELECT 
          worker_id,
          name,
          COALESCE(SUM(CASE WHEN event_type = 'working' THEN event_count ELSE 0 END), 0) as working_events,
          COALESCE(SUM(CASE WHEN event_type = 'idle' THEN event_count ELSE 0 END), 0) as idle_events,
          COALESCE(SUM(CASE WHEN event_type = 'absent' THEN event_count ELSE 0 END), 0) as absent_events,
          COALESCE(SUM(total_units), 0) as total_units
        FROM worker_events
        GROUP BY worker_id, name
      )
      SELECT 
        worker_id,
        name,
        (working_events * ${INTERVAL_MINUTES}) as total_active_time_minutes,
        (idle_events * ${INTERVAL_MINUTES}) as total_idle_time_minutes,
        (absent_events * ${INTERVAL_MINUTES}) as total_absent_time_minutes,
        CASE 
          WHEN (working_events + idle_events) > 0 
          THEN ROUND((working_events::numeric / (working_events + idle_events)) * 100, 1)
          ELSE 0 
        END as utilization_percentage,
        total_units as total_units_produced,
        CASE 
          WHEN (working_events * ${INTERVAL_MINUTES}) > 0 
          THEN ROUND((total_units::numeric / (working_events * ${INTERVAL_MINUTES} / 60.0)), 2)
          ELSE 0 
        END as units_per_hour
      FROM worker_summary
      ORDER BY worker_id
    `
    const workstationMetrics = await sql`
      WITH station_events AS (
        SELECT 
          e.workstation_id,
          ws.name,
          ws.type,
          e.event_type,
          COUNT(*) as event_count,
          SUM(CASE WHEN e.event_type = 'product_count' THEN e.count ELSE 0 END) as total_units
        FROM events e
        JOIN workstations ws ON e.workstation_id = ws.station_id
        GROUP BY e.workstation_id, ws.name, ws.type, e.event_type
      ),
      station_summary AS (
        SELECT 
          workstation_id,
          name,
          type,
          COALESCE(SUM(CASE WHEN event_type IN ('working', 'product_count') THEN event_count ELSE 0 END), 0) as occupied_events,
          COALESCE(SUM(event_count), 0) as total_events,
          COALESCE(SUM(total_units), 0) as total_units
        FROM station_events
        GROUP BY workstation_id, name, type
      )
      SELECT 
        workstation_id as station_id,
        name,
        type,
        (occupied_events * ${INTERVAL_MINUTES}) as occupancy_time_minutes,
        CASE 
          WHEN total_events > 0 
          THEN ROUND((occupied_events::numeric / total_events) * 100, 1)
          ELSE 0 
        END as utilization_percentage,
        total_units as total_units_produced,
        CASE 
          WHEN (occupied_events * ${INTERVAL_MINUTES}) > 0 
          THEN ROUND((total_units::numeric / (occupied_events * ${INTERVAL_MINUTES} / 60.0)), 2)
          ELSE 0 
        END as throughput_rate
      FROM station_summary
      ORDER BY workstation_id
    `

    const factoryMetrics = await sql`
      WITH factory_summary AS (
        SELECT 
          COUNT(*) FILTER (WHERE event_type = 'working') as working_events,
          COUNT(*) FILTER (WHERE event_type = 'idle') as idle_events,
          SUM(CASE WHEN event_type = 'product_count' THEN count ELSE 0 END) as total_units,
          COUNT(*) as total_events
        FROM events
      ),
      counts AS (
        SELECT 
          (SELECT COUNT(*) FROM workers) as total_workers,
          (SELECT COUNT(*) FROM workstations) as total_workstations
      )
      SELECT 
        (f.working_events * ${INTERVAL_MINUTES}) as total_productive_time_minutes,
        f.total_units as total_production_count,
        CASE 
          WHEN (f.working_events * ${INTERVAL_MINUTES}) > 0 
          THEN ROUND((f.total_units::numeric / (f.working_events * ${INTERVAL_MINUTES} / 60.0)), 2)
          ELSE 0 
        END as average_production_rate,
        CASE 
          WHEN (f.working_events + f.idle_events) > 0 
          THEN ROUND((f.working_events::numeric / (f.working_events + f.idle_events)) * 100, 1)
          ELSE 0 
        END as average_utilization,
        c.total_workers,
        c.total_workstations,
        f.total_events
      FROM factory_summary f, counts c
    `

    return NextResponse.json({
      workers: workerMetrics,
      workstations: workstationMetrics,
      factory: factoryMetrics[0],
      assumptions: {
        interval_minutes: INTERVAL_MINUTES,
        shift_hours: SHIFT_HOURS,
        notes: [
          "Each event represents a 15-minute time interval",
          "Utilization is calculated as working time / (working + idle time)",
          "Absent time is excluded from utilization calculations",
          "Units per hour is calculated based on active working time only",
          "Duplicate events are handled via unique constraint on timestamp/worker/workstation/event_type"
        ]
      }
    })
  } catch (error) {
    console.error("Error fetching metrics:", error)
    return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 })
  }
}
