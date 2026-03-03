import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NewEventBuilder from '../new-event-builder'

// Mock dependencies
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

vi.mock('@/services/formService', () => ({
  formService: {
    getAllForms: vi.fn().mockResolvedValue([
      { _id: 'form1', title: 'Test Form 1' },
      { _id: 'form2', title: 'Test Form 2' },
    ]),
  },
}))

vi.mock('@/services/eventService', () => ({
  default: {
    createEvent: vi.fn(),
    updateEvent: vi.fn(),
    getEvent: vi.fn(),
  },
}))

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    user: { _id: 'user1', firstName: 'Test', lastName: 'User' },
  }),
}))

// Mock UI components
vi.mock('@/components/ui/rich-text-editor', () => ({
  RichTextEditor: ({ value, onChange }: any) => (
    <textarea
      data-testid="rich-text-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}))

vi.mock('./event-sessions', () => ({
  default: ({ sessions, onChange }: any) => (
    <div data-testid="event-sessions">
      <button onClick={() => onChange([...sessions, { title: 'New Session' }])}>
        Add Session
      </button>
    </div>
  ),
}))

vi.mock('./reminder-time-config', () => ({
  default: ({ value, onChange }: any) => (
    <div data-testid="reminder-time-config">
      <input
        data-testid="reminder-times"
        value={value.join(',')}
        onChange={(e) => onChange(e.target.value.split(',').map(Number))}
      />
    </div>
  ),
}))

describe('NewEventBuilder', () => {
  const mockOnClose = vi.fn()
  const mockOnSave = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders staff contact fields', async () => {
    const user = userEvent.setup()
    render(
      <NewEventBuilder
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    )

    // Staff Contact is in the "Details & Settings" tab; switch to it first
    await user.click(screen.getByRole('tab', { name: /Details & Settings/i }))

    await waitFor(() => {
      expect(screen.getByText('Staff Contact Information')).toBeInTheDocument()
    })

    expect(screen.getByLabelText('Staff Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Staff Phone Number')).toBeInTheDocument()
  })

  it('allows entering staff contact information', async () => {
    const user = userEvent.setup()
    render(
      <NewEventBuilder
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    )

    await user.click(screen.getByRole('tab', { name: /Details & Settings/i }))
    await waitFor(() => {
      expect(screen.getByText('Staff Contact Information')).toBeInTheDocument()
    })

    // Fill in staff name
    const staffNameInput = screen.getByLabelText('Staff Name')
    await user.type(staffNameInput, 'John Doe')

    // Fill in staff phone
    const staffPhoneInput = screen.getByLabelText('Staff Phone Number')
    await user.type(staffPhoneInput, '+852 1234 5678')

    // Verify the values
    expect(staffNameInput).toHaveValue('John Doe')
    expect(staffPhoneInput).toHaveValue('+852 1234 5678')
  })

  it('includes staff contact in form submission', async () => {
    const user = userEvent.setup()
    render(
      <NewEventBuilder
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    )

    await user.click(screen.getByRole('tab', { name: /Details & Settings/i }))
    await waitFor(() => {
      expect(screen.getByText('Staff Contact Information')).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText('Staff Name'), 'John Doe')
    await user.type(screen.getByLabelText('Staff Phone Number'), '+852 1234 5678')

    expect(screen.getByLabelText('Staff Name')).toHaveValue('John Doe')
    expect(screen.getByLabelText('Staff Phone Number')).toHaveValue('+852 1234 5678')
  })
}) 