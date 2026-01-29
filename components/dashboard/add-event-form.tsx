
import React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, PlusCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AddEventFormProps {
  onEventAdded: () => void
}

export function AddEventForm({ onEventAdded }: AddEventFormProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("add")
  const [formData, setFormData] = useState({
    timestamp: new Date().toISOString().slice(0, 16),
    worker_id: "",
    workstation_id: "",
    event_type: "working",
    confidence: "0.95",
    count: "0",
  })

  const workers = ["W1", "W2", "W3", "W4", "W5", "W6"]
  const workstations = ["S1", "S2", "S3", "S4", "S5", "S6"]
  const eventTypes = ["working", "idle", "absent", "product_count"]

  const resetForm = () => {
    setFormData({
      timestamp: new Date().toISOString().slice(0, 16),
      worker_id: "",
      workstation_id: "",
      event_type: "working",
      confidence: "0.95",
      count: "0",
    })
  }

  const handleAddToExisting = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timestamp: new Date(formData.timestamp).toISOString(),
          worker_id: formData.worker_id,
          workstation_id: formData.workstation_id,
          event_type: formData.event_type,
          confidence: parseFloat(formData.confidence),
          count: parseInt(formData.count),
        }),
      })

      if (response.ok) {
        toast({
          title: "Event Added",
          description: "The event has been added to existing data.",
        })
        setOpen(false)
        onEventAdded()
        resetForm()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to add event")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add event",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClearAndAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // First, clear all existing events
      const deleteResponse = await fetch("/api/seed", {
        method: "DELETE",
      })

      if (!deleteResponse.ok) {
        throw new Error("Failed to clear existing data")
      }

      // Then add the new event
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timestamp: new Date(formData.timestamp).toISOString(),
          worker_id: formData.worker_id,
          workstation_id: formData.workstation_id,
          event_type: formData.event_type,
          confidence: parseFloat(formData.confidence),
          count: parseInt(formData.count),
        }),
      })

      if (response.ok) {
        toast({
          title: "Data Replaced",
          description: "All previous data cleared. New event added successfully.",
        })
        setOpen(false)
        onEventAdded()
        resetForm()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to add event")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process request",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const EventForm = ({ onSubmit, submitLabel, submitIcon }: { 
    onSubmit: (e: React.FormEvent) => Promise<void>
    submitLabel: string
    submitIcon: React.ReactNode
  }) => (
    <form onSubmit={onSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="timestamp">Timestamp</Label>
          <Input
            id="timestamp"
            type="datetime-local"
            value={formData.timestamp}
            onChange={(e) =>
              setFormData({ ...formData, timestamp: e.target.value })
            }
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="worker_id">Worker ID</Label>
          <Select
            value={formData.worker_id}
            onValueChange={(value) =>
              setFormData({ ...formData, worker_id: value })
            }
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select worker" />
            </SelectTrigger>
            <SelectContent>
              {workers.map((w) => (
                <SelectItem key={w} value={w}>
                  {w}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="workstation_id">Workstation ID</Label>
          <Select
            value={formData.workstation_id}
            onValueChange={(value) =>
              setFormData({ ...formData, workstation_id: value })
            }
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select workstation" />
            </SelectTrigger>
            <SelectContent>
              {workstations.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="event_type">Event Type</Label>
          <Select
            value={formData.event_type}
            onValueChange={(value) =>
              setFormData({ ...formData, event_type: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {eventTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="confidence">Confidence (0-1)</Label>
            <Input
              id="confidence"
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={formData.confidence}
              onChange={(e) =>
                setFormData({ ...formData, confidence: e.target.value })
              }
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="count">Count</Label>
            <Input
              id="count"
              type="number"
              min="0"
              value={formData.count}
              onChange={(e) =>
                setFormData({ ...formData, count: e.target.value })
              }
              disabled={formData.event_type !== "product_count"}
            />
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => setOpen(false)} className="bg-transparent">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !formData.worker_id || !formData.workstation_id} className="gap-2">
          {submitIcon}
          {isSubmitting ? "Processing..." : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 bg-transparent">
          <Plus className="h-4 w-4" />
          Add Event
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Custom Event</DialogTitle>
          <DialogDescription>
            Choose how to add your event: append to existing data or start fresh.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="add" className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Add to Existing
            </TabsTrigger>
            <TabsTrigger value="clear" className="gap-2">
              <Trash2 className="h-4 w-4" />
              Clear and Add
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="add" className="mt-4">
            <p className="text-sm text-muted-foreground mb-4">
              This will add a new event to the existing database without affecting other records.
            </p>
            <EventForm 
              onSubmit={handleAddToExisting}
              submitLabel="Add Event"
              submitIcon={<PlusCircle className="h-4 w-4" />}
            />
          </TabsContent>
          
          <TabsContent value="clear" className="mt-4">
            <p className="text-sm text-muted-foreground mb-4 text-amber-600">
              Warning: This will DELETE all existing events and add only this new event. Use this to start with clean data for evaluation.
            </p>
            <EventForm 
              onSubmit={handleClearAndAdd}
              submitLabel="Clear All and Add"
              submitIcon={<Trash2 className="h-4 w-4" />}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
