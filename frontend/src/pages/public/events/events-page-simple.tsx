import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { ArrowRight, Calendar, MapPin, Users, Clock } from "lucide-react"
import eventService, { Event } from "@/services/eventService"

export default function EventsPageSimple() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch events from backend
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        const publicEvents = await eventService.getPublicEvents()
        setEvents(publicEvents)
      } catch (err) {
        console.error('Error fetching events:', err)
        setError('Failed to load events')
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Events</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow animate-pulse">
              <div className="h-40 mb-4 bg-gray-200 rounded-md"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Events</h1>
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Events</h1>
        <div className="text-center py-8">
          <p className="text-gray-500">No events available at the moment.</p>
          <p className="text-gray-400 text-sm mt-2">Check back soon for new events!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Events</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <div key={event._id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="h-40 mb-4 overflow-hidden rounded-md bg-gray-100">
              <img
                src={event.coverImageUrl || "/placeholder.svg"}
                alt={event.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  if (e.currentTarget) {
                    e.currentTarget.src = "/placeholder.svg"
                  }
                }}
              />
            </div>
            
            <div className="flex items-center mb-2">
              <span className="text-sm font-medium bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                {event.category}
              </span>
            </div>
            
            <h3 className="text-xl font-bold mb-2">{event.title}</h3>
            <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
            
            <div className="space-y-2 mb-4 text-sm text-gray-500">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                {new Date(event.startDate).toLocaleDateString()}
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                {event.location.venue}
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                {event.targetGroup}
              </div>
              {event.capacity && (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  {event.registeredCount || 0} / {event.capacity} registered
                </div>
              )}
            </div>
            
            <Link to={`/events/${event._id}`}>
              <Button className="w-full bg-yellow-400 hover:bg-yellow-500 text-black">
                View Details <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
} 