import { buildRegistrationExportSheetData } from "@/lib/registration-export";
import { describe, expect, it } from "vitest";

describe("buildRegistrationExportSheetData", () => {
  it("builds metadata rows and ordered form columns", () => {
    const sheetData = buildRegistrationExportSheetData({
      event: {
        _id: "event-1",
        title: "Community Workshop",
        description: "desc",
        category: "Community Building",
        targetGroup: "All Hong Kong Residents",
        location: {
          venue: "Hall A",
          address: "123 Street",
          district: "Wan Chai",
          onlineEvent: false
        },
        startDate: new Date("2026-04-01T00:00:00.000Z"),
        endDate: new Date("2026-04-01T00:00:00.000Z"),
        isPrivate: false,
        status: "Published",
        registrationFormId: "form-1",
        sessions: [
          {
            _id: "session-1",
            title: "Morning Session",
            date: new Date("2026-04-01T00:00:00.000Z"),
            startTime: "10:00",
            endTime: "12:00"
          }
        ],
        createdBy: {
          _id: "user-1",
          firstName: "Admin",
          lastName: "User",
          email: "admin@example.com"
        },
        createdAt: new Date("2026-03-01T00:00:00.000Z")
      },
      form: {
        _id: "form-1",
        title: "Registration Form",
        sections: [
          {
            _id: "section-2",
            title: "Second Section",
            order: 2,
            fields: [
              {
                _id: "field-2",
                label: "Dietary Preference",
                type: "text",
                required: false,
                order: 2
              }
            ]
          },
          {
            _id: "section-1",
            title: "First Section",
            order: 1,
            fields: [
              {
                _id: "field-1",
                label: "Age",
                type: "number",
                required: false,
                order: 1
              }
            ]
          }
        ],
        isActive: true,
        createdBy: "user-1",
        createdAt: new Date("2026-03-01T00:00:00.000Z")
      },
      registrations: [
        {
          _id: "registration-1",
          eventId: "event-1",
          attendee: {
            firstName: "Alex",
            lastName: "Chan",
            phone: "+85212345678",
            email: "alex@example.com"
          },
          sessions: ["session-1"],
          formResponses: [
            {
              sectionId: "section-2",
              fieldId: "field-2",
              response: "Vegetarian"
            },
            {
              sectionId: "",
              fieldId: "field-1",
              response: 32
            }
          ],
          status: "registered",
          registeredAt: "2026-03-15T10:00:00.000Z"
        }
      ]
    });

    expect(sheetData.rows[0]).toEqual(["The Zubin Foundation"]);
    expect(sheetData.rows[2]).toEqual(["Event Name", "Community Workshop"]);
    expect(sheetData.rows[3]).toEqual(["Session", "Morning Session"]);
    expect(sheetData.rows[7]).toEqual([
      "Participant First Name",
      "Participant Last Name",
      "Mobile Number",
      "Email",
      "Sessions Registered",
      "Registration Status",
      "Registered At",
      "Age",
      "Dietary Preference"
    ]);
    expect(sheetData.rows[8]).toEqual([
      "Alex",
      "Chan",
      "+85212345678",
      "alex@example.com",
      "Morning Session",
      "registered",
      "15 Mar 2026",
      "32",
      "Vegetarian"
    ]);
  });
});
