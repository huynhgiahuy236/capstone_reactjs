import React from 'react'
import Header from '../components/Header'
import { Outlet } from 'react-router-dom'
import Footer from '../components/Footer'
import { AdminFeedbackProvider } from '../components/AdminFeedback'

const HomeLayout = () => {
  return (
    <AdminFeedbackProvider>
      <Header />

      <Outlet />

      <Footer />
    </AdminFeedbackProvider>
  )
}

export default HomeLayout
