
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
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { WorkstationMetrics } from "@/lib/db"

interface WorkstationsMetricsProps {
  metrics: WorkstationMetrics[]
  onStationSelect?: (stationId: string | null) => void
  selectedStation?: string | null
}

const typeColors: Record<string, string> = {
  assembly: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  inspection: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  packaging: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  machining: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  welding: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
}

export function WorkstationsMetrics({ metrics, onStationSelect, selectedStation }: WorkstationsMetricsProps) {
  const [sortBy, setSortBy] = useState<keyof WorkstationMetrics>("station_id")

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
          <CardTitle>Workstation Metrics</CardTitle>
          <div className="flex gap-2">
            <Select value={selectedStation || "all"} onValueChange={(v) => onStationSelect?.(v === "all" ? null : v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter station" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Workstations</SelectItem>
                {metrics.map((m) => (
                  <SelectItem key={m.station_id} value={m.station_id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as keyof WorkstationMetrics)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="station_id">Station ID</SelectItem>
                <SelectItem value="utilization_percentage">Utilization</SelectItem>
                <SelectItem value="total_units_produced">Units Produced</SelectItem>
                <SelectItem value="throughput_rate">Throughput</SelectItem>
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
                <TableHead>Workstation</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Occupancy Time</TableHead>
                <TableHead>Utilization</TableHead>
                <TableHead>Units Produced</TableHead>
                <TableHead>Throughput</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedMetrics
                .filter((m) => !selectedStation || m.station_id === selectedStation)
                .map((station) => (
                  <TableRow 
                    key={station.station_id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onStationSelect?.(selectedStation === station.station_id ? null : station.station_id)}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium">{station.name}</div>
                        <div className="text-xs text-muted-foreground">{station.station_id}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={typeColors[station.type] || "bg-gray-100 text-gray-800"}>
                        {station.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatTime(Number(station.occupancy_time_minutes))}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={Number(station.utilization_percentage)} 
                          className="w-16 h-2"
                        />
                        <span className="text-sm font-medium">
                          {Number(station.utilization_percentage).toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {Number(station.total_units_produced).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {Number(station.throughput_rate).toFixed(1)} units/hr
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
