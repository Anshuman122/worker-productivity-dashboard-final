import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const workers = await sql`
      SELECT * FROM workers ORDER BY worker_id
    `
    return NextResponse.json(workers)
  } catch (error) {
    console.error("Error fetching workers:", error)
    return NextResponse.json({ error: "Failed to fetch workers" }, { status: 500 })
  }
}
