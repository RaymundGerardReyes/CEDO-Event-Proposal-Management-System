import { Toaster } from "react-hot-toast"
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom"
import ProtectedRoute from "./components/ProtectedRoute"
import { AuthProvider } from "./contexts/AuthContext_old_Text"
import { NotificationProvider } from "./contexts/NotificationContext"
import DashboardPage from "./pages/DashboardPage"
import LoginPage from "./pages/LoginPage"
import NotFoundPage from "./pages/NotFoundPage"
import ProfilePage from "./pages/ProfilePage"
import ProposalsPage from "./pages/ProposalsPage"
import ReportsPage from "./pages/ReportsPage"
import UsersPage from "./pages/UsersPage"

function App() {
    return (
        <AuthProvider>
            <NotificationProvider>
                <Router>
                    <Toaster position="top-right" />
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />

                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute allowedRoles={["head_admin", "manager"]}>
                                    <DashboardPage />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/users"
                            element={
                                <ProtectedRoute allowedRoles={["head_admin"]}>
                                    <UsersPage />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/proposals"
                            element={
                                <ProtectedRoute allowedRoles={["head_admin", "manager"]}>
                                    <ProposalsPage />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/reports"
                            element={
                                <ProtectedRoute allowedRoles={["head_admin", "manager"]}>
                                    <ReportsPage />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/profile"
                            element={
                                <ProtectedRoute allowedRoles={["head_admin", "manager", "student"]}>
                                    <ProfilePage />
                                </ProtectedRoute>
                            }
                        />

                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </Router>
            </NotificationProvider>
        </AuthProvider>
    )
}

export default App
