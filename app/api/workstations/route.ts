import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const workstations = await sql`
      SELECT * FROM workstations ORDER BY station_id
    `
    return NextResponse.json(workstations)
  } catch (error) {
    console.error("Error fetching workstations:", error)
    return NextResponse.json({ error: "Failed to fetch workstations" }, { status: 500 })
  }
}
