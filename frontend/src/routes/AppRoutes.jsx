import { Route, Routes } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import DashboardPage from '../pages/DashboardPage'
import LandingPage from '../pages/LandingPage'
import LoginPage from '../pages/LoginPage'
import MyArtworkPage from '../pages/MyArtworkPage'
import MyNftsPage from '../pages/MyNftsPage'
import StudioPage from '../pages/StudioPage'
import NotFoundPage from '../pages/NotFoundPage'
import ProfilePage from '../pages/ProfilePage'
import RegisterPage from '../pages/RegisterPage'
import GuestRoute from './GuestRoute'
import ProtectedRoute from './ProtectedRoute'

// AdminRoute is ready for the admin dashboard in Phase 9.
export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<LandingPage />} />

        <Route element={<GuestRoute />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="studio" element={<StudioPage />} />
          <Route path="studio/:id" element={<StudioPage />} />
          <Route path="artwork" element={<MyArtworkPage />} />
          <Route path="nfts" element={<MyNftsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
