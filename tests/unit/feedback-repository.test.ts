import { describe, expect, it } from 'vitest'
import { formatFeedbackStorageError } from '@/lib/feedback/supabase-repository'

describe('Supabase feedback repository errors', () => {
  it('keeps the database code and message available for safe production diagnostics', () => {
    expect(formatFeedbackStorageError({ code: '42501', message: 'permission denied for table feedback_reports' }))
      .toBe('Feedback storage operation failed (42501): permission denied for table feedback_reports')
  })
})
