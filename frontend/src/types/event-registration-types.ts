export interface EventRegistration {
    _id: string;
    eventId: string;
    userId?: string; // If user is registered in the system
    attendee: {
        firstName: string;
        lastName: string;
        phone: string;
        email?: string;
    };
    sessions: string[]; // Session IDs
    formResponses: {
        sectionId: string;
        fieldId: string;
        response: any;
    }[];
    status: 'pending' | 'confirmed' | 'attended' | 'cancelled' | 'waitlisted';
    registeredAt: Date;
    cancelledAt?: Date;
    notes?: string;
}
