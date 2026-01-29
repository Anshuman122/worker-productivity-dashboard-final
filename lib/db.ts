import { neon } from "@neondatabase/serverless"

export const sql = neon(process.env.DATABASE_URL!)

export type Worker = {
  id: number
  worker_id: string
  name: string
  created_at: string
}

export type Workstation = {
  id: number
  station_id: string
  name: string
  type: string
  created_at: string
}

export type Event = {
  id: number
  timestamp: string
  worker_id: string
  workstation_id: string
  event_type: "working" | "idle" | "absent" | "product_count"
  confidence: number
  count: number
  created_at: string
}

export type WorkerMetrics = {
  worker_id: string
  name: string
  total_active_time_minutes: number
  total_idle_time_minutes: number
  total_absent_time_minutes: number
  utilization_percentage: number
  total_units_produced: number
  units_per_hour: number
}

export type WorkstationMetrics = {
  station_id: string
  name: string
  type: string
  occupancy_time_minutes: number
  utilization_percentage: number
  total_units_produced: number
  throughput_rate: number
}

export type FactoryMetrics = {
  total_productive_time_minutes: number
  total_production_count: number
  average_production_rate: number
  average_utilization: number
  total_workers: number
  total_workstations: number
  total_events: number
}
