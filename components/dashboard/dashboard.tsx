
import { useState } from "react"
import useSWR from "swr"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FactoryStats } from "./factory-stats"
import { WorkersMetrics } from "./workers-metrics"
import { WorkstationsMetrics } from "./workstations-metrics"
import { EventsLog } from "./events-log"
import { RefreshCw, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { AddEventForm } from "./add-event-form"
import type { WorkerMetrics, WorkstationMetrics, FactoryMetrics } from "@/lib/db"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

type MetricsResponse = {
  workers: WorkerMetrics[]
  workstations: WorkstationMetrics[]
  factory: FactoryMetrics
  assumptions: {
    interval_minutes: number
    shift_hours: number
    notes: string[]
  }
}

export function Dashboard() {
  const { toast } = useToast()
  const [selectedWorker, setSelectedWorker] = useState<string | null>(null)
  const [selectedStation, setSelectedStation] = useState<string | null>(null)
  const [isSeeding, setIsSeeding] = useState(false)

  const { data: metrics, isLoading, mutate } = useSWR<MetricsResponse>(
    "/api/metrics",
    fetcher,
    { refreshInterval: 30000 }
  )

  const handleRefresh = () => {
    mutate()
    toast({
      title: "Dashboard Refreshed",
      description: "Data has been updated.",
    })
  }

  const handleSeedData = async () => {
    setIsSeeding(true)
    try {
      const response = await fetch("/api/seed", { method: "POST" })
      const result = await response.json()
      if (response.ok) {
        toast({
          title: "Data Refreshed",
          description: result.message,
        })
        mutate()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh dummy data",
        variant: "destructive",
      })
    } finally {
      setIsSeeding(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Worker Productivity Dashboard
          </h1>
          <p className="text-muted-foreground">
            Real-time monitoring of worker activity and production metrics
          </p>
        </div>
        <div className="flex gap-2">
          <AddEventForm onEventAdded={() => mutate()} />
          <Button 
            variant="outline" 
            onClick={handleSeedData} 
            disabled={isSeeding}
            className="gap-2 bg-transparent"
          >
            <Database className="h-4 w-4" />
            {isSeeding ? "Generating..." : "Refresh Dummy Data"}
          </Button>
          <Button variant="outline" onClick={handleRefresh} className="gap-2 bg-transparent">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {metrics && (
        <>
          <FactoryStats metrics={metrics.factory} />

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="workers">Workers</TabsTrigger>
              <TabsTrigger value="workstations">Workstations</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <WorkersMetrics 
                  metrics={metrics.workers} 
                  onWorkerSelect={setSelectedWorker}
                  selectedWorker={selectedWorker}
                />
                <WorkstationsMetrics 
                  metrics={metrics.workstations}
                  onStationSelect={setSelectedStation}
                  selectedStation={selectedStation}
                />
              </div>
              <EventsLog 
                workerId={selectedWorker} 
                workstationId={selectedStation}
              />
            </TabsContent>

            <TabsContent value="workers">
              <WorkersMetrics 
                metrics={metrics.workers}
                onWorkerSelect={setSelectedWorker}
                selectedWorker={selectedWorker}
              />
            </TabsContent>

            <TabsContent value="workstations">
              <WorkstationsMetrics 
                metrics={metrics.workstations}
                onStationSelect={setSelectedStation}
                selectedStation={selectedStation}
              />
            </TabsContent>

            <TabsContent value="events">
              <EventsLog 
                workerId={selectedWorker}
                workstationId={selectedStation}
              />
            </TabsContent>
          </Tabs>

          <div className="text-xs text-muted-foreground border-t pt-4">
            <p className="font-medium mb-1">Assumptions:</p>
            <ul className="list-disc list-inside space-y-0.5">
              {metrics.assumptions.notes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
