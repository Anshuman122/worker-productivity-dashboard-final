
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Briefcase, Clock, LogOut, Package } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useState } from "react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface EventsLogProps {
  workerId?: string | null
  workstationId?: string | null
}

type Event = {
  id: number
  timestamp: string
  worker_id: string
  workstation_id: string
  event_type: string
  confidence: number
  count: number
  worker_name?: string
  workstation_name?: string
}

const eventConfig: Record<string, { icon: typeof Briefcase; color: string; bgColor: string }> = {
  working: { icon: Briefcase, color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900" },
  idle: { icon: Clock, color: "text-yellow-600", bgColor: "bg-yellow-100 dark:bg-yellow-900" },
  absent: { icon: LogOut, color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900" },
  product_count: { icon: Package, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900" },
}

export function EventsLog({ workerId, workstationId }: EventsLogProps) {
  const [eventTypeFilter, setEventTypeFilter] = useState("all")
  
  const queryParams = new URLSearchParams()
  if (workerId) queryParams.set("worker_id", workerId)
  if (workstationId) queryParams.set("workstation_id", workstationId)
  if (eventTypeFilter !== "all") queryParams.set("event_type", eventTypeFilter)
  queryParams.set("limit", "100")

  const { data: events, isLoading } = useSWR<Event[]>(
    `/api/events?${queryParams.toString()}`,
    fetcher,
    { refreshInterval: 10000 }
  )

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Event Log</CardTitle>
          <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Event Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="working">Working</SelectItem>
              <SelectItem value="idle">Idle</SelectItem>
              <SelectItem value="absent">Absent</SelectItem>
              <SelectItem value="product_count">Product Count</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading events...
            </div>
          ) : events && events.length > 0 ? (
            <div className="space-y-3">
              {events.map((event) => {
                const config = eventConfig[event.event_type] || eventConfig.working
                const EventIcon = config.icon
                return (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <div className={`p-2 rounded-full ${config.bgColor}`}>
                      <EventIcon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm capitalize">
                          {event.event_type.replace("_", " ")}
                        </span>
                        {event.event_type === "product_count" && (
                          <Badge variant="secondary" className="text-xs">
                            {event.count} units
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {(event.confidence * 100).toFixed(0)}% confidence
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-muted-foreground">
                        <span>{event.worker_name || event.worker_id}</span>
                        <span>at</span>
                        <span>{event.workstation_name || event.workstation_id}</span>
                        <span className="ml-auto">
                          {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No events found
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
