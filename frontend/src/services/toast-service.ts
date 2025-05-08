import type { ToastActionElement } from "@/components/ui/toast"

type ToastProps = {
  title?: string
  description?: string
  action?: ToastActionElement
  duration?: number
}

export type ToastType = "success" | "error" | "warning" | "info" | "default"

export interface ToastService {
  showToast: (type: ToastType, props: ToastProps) => void
}

export const createEventToasts = {
  success: (title: string, details?: string) => ({
    variant: "success" as ToastType,
    title: title || "Event Created Successfully",
    description: details || "Your event has been created and is now available.",
    duration: 5000,
  }),

  updateSuccess: (title: string, details?: string) => ({
    variant: "success" as ToastType,
    title: title || "Event Updated Successfully",
    description: details || "Your event has been updated with the new information.",
    duration: 5000,
  }),

  error: (error: string, details?: string) => ({
    variant: "error" as ToastType,
    title: "Error Saving Event",
    description: details || error || "There was a problem saving your event. Please try again.",
    duration: 7000,
  }),

  warning: (title: string, details: string) => ({
    variant: "warning" as ToastType,
    title: title,
    description: details,
    duration: 6000,
  }),

  info: (title: string, details: string) => ({
    variant: "info" as ToastType,
    title: title,
    description: details,
    duration: 5000,
  }),

  validationError: (fields: string[]) => ({
    variant: "error" as ToastType,
    title: "Validation Error",
    description: `Please check the following fields: ${fields.join(", ")}`,
    duration: 7000,
  }),

  networkError: () => ({
    variant: "error" as ToastType,
    title: "Network Error",
    description: "Unable to connect to the server. Please check your internet connection and try again.",
    duration: 7000,
  }),

  serverError: (status?: number) => ({
    variant: "error" as ToastType,
    title: "Server Error",
    description: status
      ? `The server returned an error (${status}). Please try again later.`
      : "An unexpected server error occurred. Please try again later.",
    duration: 7000,
  }),
}
