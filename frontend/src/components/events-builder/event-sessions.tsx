import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { PlusCircle, Trash2, Calendar, Clock, MapPin, Link } from "lucide-react"
import { Session, SessionLocation } from "@/types/event-types"
import { format } from "date-fns"

interface EventSessionsProps {
  sessions: Session[];
  onChange: (sessions: Session[]) => void;
}

export default function EventSessions({ sessions, onChange }: EventSessionsProps) {
  // Pre-populate one session if none exists
  useEffect(() => {
    if (sessions.length === 0) {
      const defaultSession: Session = {
        _id: `temp-${Date.now()}`,
        title: "",
        date: new Date(),
        startTime: "",
        endTime: "",
        location: {
          venue: "",
        },
      };
      onChange([defaultSession]);
    }
  }, []);

  const addSession = () => {
    const newSession: Session = {
      _id: `temp-${Date.now()}`,
      title: "",
      date: new Date(),
      startTime: "",
      endTime: "",
      location: {
        venue: "",
      },
    };
    onChange([...sessions, newSession]);
  };

  const removeSession = (index: number) => {
    // Don't allow removing the last session
    if (sessions.length <= 1) {
      return;
    }
    const newSessions = [...sessions];
    newSessions.splice(index, 1);
    onChange(newSessions);
  };

  const updateSession = (index: number, field: keyof Session, value: any) => {
    const newSessions = [...sessions];
    newSessions[index] = {
      ...newSessions[index],
      [field]: value,
    };
    onChange(newSessions);
  };

  const updateSessionLocation = (index: number, field: keyof SessionLocation, value: string | undefined) => {
    const newSessions = [...sessions];
    newSessions[index] = {
      ...newSessions[index],
      location: {
        ...newSessions[index].location,
        [field]: value,
      },
    };
    onChange(newSessions);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Event Sessions</h3>
        <Button onClick={addSession} variant="outline" size="sm">
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Session
        </Button>
      </div>

      {sessions.map((session, index) => (
        <Card key={session._id} className="relative">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-base">Session {index + 1}</CardTitle>
              {sessions.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSession(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`session-title-${index}`} className="flex items-center">
                Session Title <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id={`session-title-${index}`}
                value={session.title}
                onChange={(e) => updateSession(index, "title", e.target.value)}
                placeholder="Enter session title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`session-description-${index}`}>Description (Optional)</Label>
              <Textarea
                id={`session-description-${index}`}
                value={session.description || ""}
                onChange={(e) => updateSession(index, "description", e.target.value)}
                placeholder="Enter session description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`session-date-${index}`} className="flex items-center">
                  Date <span className="text-red-500 ml-1">*</span>
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id={`session-date-${index}`}
                    type="date"
                    value={format(session.date, "yyyy-MM-dd")}
                    onChange={(e) => updateSession(index, "date", new Date(e.target.value))}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`session-start-${index}`} className="flex items-center">
                  Start Time <span className="text-red-500 ml-1">*</span>
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id={`session-start-${index}`}
                    type="time"
                    value={session.startTime}
                    onChange={(e) => updateSession(index, "startTime", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`session-end-${index}`} className="flex items-center">
                  End Time <span className="text-red-500 ml-1">*</span>
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id={`session-end-${index}`}
                    type="time"
                    value={session.endTime}
                    onChange={(e) => updateSession(index, "endTime", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id={`session-online-${index}`}
                  checked={!!session.location?.meetingLink}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      updateSessionLocation(index, "meetingLink", "");
                    } else {
                      updateSessionLocation(index, "meetingLink", undefined);
                    }
                  }}
                />
                <Label htmlFor={`session-online-${index}`}>Online Session</Label>
              </div>

              {session.location?.meetingLink ? (
                <div className="space-y-2">
                  <Label htmlFor={`session-link-${index}`}>Meeting Link</Label>
                  <div className="relative">
                    <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id={`session-link-${index}`}
                      value={session.location.meetingLink}
                      onChange={(e) => updateSessionLocation(index, "meetingLink", e.target.value)}
                      placeholder="Enter meeting link"
                      className="pl-10"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor={`session-venue-${index}`}>Venue</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id={`session-venue-${index}`}
                      value={session.location?.venue || ""}
                      onChange={(e) => updateSessionLocation(index, "venue", e.target.value)}
                      placeholder="Enter venue"
                      className="pl-10"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`session-capacity-${index}`}>Capacity (Optional)</Label>
              <Input
                id={`session-capacity-${index}`}
                type="number"
                value={session.capacity || ""}
                onChange={(e) => updateSession(index, "capacity", e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Enter maximum number of participants"
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 