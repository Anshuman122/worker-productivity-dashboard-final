"use client"
import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import type { WorkerMetrics } from "@/lib/db"

interface WorkersMetricsProps {
  metrics: WorkerMetrics[]
  onWorkerSelect?: (workerId: string | null) => void
  selectedWorker?: string | null
}

export function WorkersMetrics({ metrics, onWorkerSelect, selectedWorker }: WorkersMetricsProps) {
  const [sortBy, setSortBy] = useState<keyof WorkerMetrics>("worker_id")

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const sortedMetrics = [...metrics].sort((a, b) => {
    const aVal = a[sortBy]
    const bVal = b[sortBy]
    if (typeof aVal === "number" && typeof bVal === "number") {
      return bVal - aVal
    }
    return String(aVal).localeCompare(String(bVal))
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Worker Metrics</CardTitle>
          <div className="flex gap-2">
            <Select value={selectedWorker || "all"} onValueChange={(v) => onWorkerSelect?.(v === "all" ? null : v)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter worker" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Workers</SelectItem>
                {metrics.map((m) => (
                  <SelectItem key={m.worker_id} value={m.worker_id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as keyof WorkerMetrics)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="worker_id">Worker ID</SelectItem>
                <SelectItem value="utilization_percentage">Utilization</SelectItem>
                <SelectItem value="total_units_produced">Units Produced</SelectItem>
                <SelectItem value="units_per_hour">Units/Hour</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Worker</TableHead>
                <TableHead>Active Time</TableHead>
                <TableHead>Idle Time</TableHead>
                <TableHead>Utilization</TableHead>
                <TableHead>Units Produced</TableHead>
                <TableHead>Units/Hour</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedMetrics
                .filter((m) => !selectedWorker || m.worker_id === selectedWorker)
                .map((worker) => (
                  <TableRow 
                    key={worker.worker_id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onWorkerSelect?.(selectedWorker === worker.worker_id ? null : worker.worker_id)}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium">{worker.name}</div>
                        <div className="text-xs text-muted-foreground">{worker.worker_id}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-green-600">
                      {formatTime(Number(worker.total_active_time_minutes))}
                    </TableCell>
                    <TableCell className="text-yellow-600">
                      {formatTime(Number(worker.total_idle_time_minutes))}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={Number(worker.utilization_percentage)} 
                          className="w-16 h-2"
                        />
                        <span className="text-sm font-medium">
                          {Number(worker.utilization_percentage).toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {Number(worker.total_units_produced).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {Number(worker.units_per_hour).toFixed(1)}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
