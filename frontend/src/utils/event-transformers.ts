import { ZubinEvent } from '../types/event-types';

export function transformEventData(event: any): ZubinEvent {
  return {
    _id: event._id,
    title: event.title,
    description: event.description,
    category: event.category,
    targetGroup: event.targetGroup,
    location: {
      venue: event.location.venue,
      address: event.location.address,
      district: event.location.district,
      onlineEvent: event.location.onlineEvent,
      meetingLink: event.location.meetingLink
    },
    startDate: new Date(event.startDate),
    endDate: new Date(event.endDate),
    coverImage: event.coverImage,
    isPrivate: event.isPrivate,
    status: event.status,
    registrationFormId: event.registrationFormId,
    sessions: event.sessions.map((session: any) => ({
      ...session,
      date: new Date(session.date)
    })),
    capacity: event.capacity,
    createdBy: event.createdBy,
    createdAt: new Date(event.createdAt),
    updatedBy: event.updatedBy,
    updatedAt: event.updatedAt ? new Date(event.updatedAt) : undefined,
    tags: event.tags,
    registeredCount: event.registeredCount,
    participants: event.participants
  };
}



