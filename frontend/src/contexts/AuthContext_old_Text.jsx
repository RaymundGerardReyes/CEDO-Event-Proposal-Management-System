"use client"

import api from "@/lib/api"; // Ensure this path is correct for your project
import { useRouter } from "next/navigation"; // Import useRouter from next/navigation
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        // This error is good, it helps identify if AuthProvider is missing
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true); // True until initial auth check is complete
    const [error, setError] = useState(null);
    const router = useRouter(); // Use the useRouter hook from Next.js

    // Check if user is already logged in (e.g., token in localStorage or cookie)
    useEffect(() => {
        const checkLoggedIn = async () => {
            setLoading(true); // Start loading
            setError(null);   // Clear previous errors
            try {
                // In Next.js, it's common to store tokens in HttpOnly cookies managed by the backend.
                // If you are storing the token in localStorage (less secure for web):
                const token = localStorage.getItem("cedo_token"); // Assuming your token key is 'cedo_token'

                if (token) {
                    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
                    // Attempt to fetch user data with the token
                    // Replace "/auth/me" with your actual endpoint to get current user data
                    const response = await api.get("/auth/me");
                    if (response.data && response.data.user) { // Assuming backend returns { user: {...} }
                        setCurrentUser(response.data.user);
                        console.log("AuthContext: User restored from session/token.", response.data.user);
                    } else {
                        // Token might be invalid or expired if no user data is returned
                        throw new Error("Invalid session or no user data returned.");
                    }
                } else {
                    setCurrentUser(null); // No token found
                }
            } catch (err) {
                console.error("AuthContext: Authentication check error:", err.message);
                localStorage.removeItem("cedo_token"); // Clear invalid token
                delete api.defaults.headers.common["Authorization"];
                setCurrentUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkLoggedIn();
    }, []); // Run once on mount

    // Login function
    const login = async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            // Replace "/auth/login" with your actual login endpoint
            const response = await api.post("/auth/login", { email, password });
            const { token, user } = response.data; // Assuming backend returns token and user object

            if (token && user) {
                localStorage.setItem("cedo_token", token); // Store token
                api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
                setCurrentUser(user);
                setLoading(false);

                // Determine redirect path based on user role (example)
                // This logic should align with your middleware and app/(main)/page.jsx redirector
                let targetPath = "/"; // Default redirect
                if (user.dashboard) {
                    targetPath = user.dashboard;
                } else if (user.role === "Head Admin" || user.role === "Manager") {
                    targetPath = "/admin-dashboard";
                } else if (user.role === "Student" || user.role === "Partner") {
                    targetPath = "/student-dashboard";
                }
                router.replace(targetPath); // Use router.replace for navigation
                return user;
            } else {
                throw new Error("Login failed: No token or user data received.");
            }
        } catch (err) {
            console.error("AuthContext: Login error:", err.response?.data?.message || err.message);
            setError(err.response?.data?.message || "Invalid email or password");
            setLoading(false);
            throw err; // Re-throw for the login page to handle
        }
    };

    // Logout function
    const logout = () => {
        setLoading(true);
        localStorage.removeItem("cedo_token");
        delete api.defaults.headers.common["Authorization"];
        setCurrentUser(null);
        setLoading(false);
        router.replace("/sign-in"); // Redirect to sign-in page using Next.js router
        console.log("AuthContext: User logged out.");
    };

    // Register function (for creating new users)
    const register = async (userData) => {
        setLoading(true);
        setError(null);
        try {
            // Replace "/auth/register" with your actual registration endpoint
            const response = await api.post("/auth/register", userData);
            setLoading(false);
            // Typically, after registration, you might redirect to login or show a success message.
            // The response might contain the new user or a confirmation.
            return response.data;
        } catch (err) {
            console.error("AuthContext: Registration error:", err.response?.data?.message || err.message);
            setError(err.response?.data?.message || "Registration failed");
            setLoading(false);
            throw err;
        }
    };

    // Update user profile
    const updateProfile = async (userData) => {
        if (!currentUser) {
            setError("Cannot update profile: No user logged in.");
            throw new Error("User not authenticated");
        }
        setLoading(true);
        setError(null);
        try {
            // Replace `/users/${currentUser.id}` with your actual update profile endpoint
            const response = await api.put(`/users/${currentUser.id}`, userData);
            setCurrentUser({ ...currentUser, ...response.data }); // Assuming response.data is the updated user partial or full object
            setLoading(false);
            return response.data;
        } catch (err) {
            console.error("AuthContext: Profile update error:", err.response?.data?.message || err.message);
            setError(err.response?.data?.message || "Profile update failed");
            setLoading(false);
            throw err;
        }
    };

    // Value provided by the context
    const value = {
        // Renamed user to currentUser to match state variable, or rename state to 'user'
        user: currentUser,
        loading,
        error,
        signIn: login, // Changed to signIn to match usage in SignInPage
        signOut: logout, // Changed to signOut
        register,
        updateProfile,
        // Expose ROLES if needed by other components, ensure it's defined or imported
        // ROLES: { HEAD_ADMIN: "Head Admin", STUDENT: "Student", ... },
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
