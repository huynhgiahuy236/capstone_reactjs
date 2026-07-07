import { useContext } from 'react'
import { AdminFeedbackContext } from '../contexts/AdminFeedbackContext'

export const useAdminFeedback = () => {
  const context = useContext(AdminFeedbackContext)

  if (!context) {
    throw new Error('useAdminFeedback must be used inside AdminFeedbackProvider')
  }

  return context
}
