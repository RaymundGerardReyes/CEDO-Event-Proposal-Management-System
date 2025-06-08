/**
 * Admin Routes - Proposal Management System
 *
 * This module handles all administrative routes for the CEDO proposal management system,
 * including proposal viewing, approval, denial, and file management.
 *
 * @module routes/admin
 * @requires express
 * @requires mysql2/promise
 * @requires mongoose
 * @requires multer
 * @requires path
 * @requires fs/promises
 */

const express = require("express")
const router = express.Router()
const { pool } = require("../config/db")
const { mongoose } = require("../config/mongodb")
const { ObjectId } = mongoose.Types
const multer = require("multer")
const path = require("path")
const fs = require("fs/promises")
const { validateAdmin, validateToken, validateApiKey } = require("../middleware/auth")
const logger = require("../utils/logger")

// Configure file storage for proposal attachments
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, "../uploads/proposals")
        cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
        const ext = path.extname(file.originalname)
        cb(null, `proposal-${uniqueSuffix}${ext}`)
    },
})

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = [".pdf", ".doc", ".docx", ".xls", ".xlsx"]
        const ext = path.extname(file.originalname).toLowerCase()

        if (allowedTypes.includes(ext)) {
            cb(null, true)
        } else {
            cb(new Error("Invalid file type. Only PDF, DOC, DOCX, XLS, and XLSX files are allowed."))
        }
    },
})

/**
 * Error handler middleware for admin routes
 */
const handleErrors = (err, req, res, next) => {
    logger.error(`Admin API Error: ${err.message}`, { stack: err.stack })

    if (err.name === "ValidationError") {
        return res.status(400).json({ success: false, error: err.message })
    }

    if (err.name === "UnauthorizedError") {
        return res.status(401).json({ success: false, error: "Unauthorized access" })
    }

    res.status(500).json({
        success: false,
        error: "An unexpected error occurred",
        message: process.env.NODE_ENV === "development" ? err.message : undefined,
    })
}

// ===============================================
// PUBLIC ADMIN DASHBOARD (No Auth Required)
// ===============================================

/**
 * @route GET /api/admin
 * @desc Admin Dashboard - Web Interface
 * @access Public (Browser Access Allowed)
 */
router.get("/", async (req, res) => {
    try {
        // Get comprehensive database status and data for dashboard
        let mysqlStatus = "Disconnected";
        let mongoStatus = "Disconnected";
        let mysqlTableCount = 0;
        let mongoCollectionCount = 0;
        let mysqlTables = [];
        let mongoCollections = [];

        // Check MySQL connection and get table info
        try {
            await pool.query("SELECT 1");
            const [tables] = await pool.query("SHOW TABLES");
            mysqlTableCount = tables.length;
            mysqlStatus = "Connected";

            // Get table details with row counts
            for (const tableRow of tables) {
                const tableName = Object.values(tableRow)[0];
                try {
                    const [countResult] = await pool.query(`SELECT COUNT(*) as count FROM ??`, [tableName]);
                    mysqlTables.push({
                        name: tableName,
                        count: countResult[0].count
                    });
                } catch (error) {
                    mysqlTables.push({
                        name: tableName,
                        count: 0,
                        error: error.message
                    });
                }
            }
        } catch (error) {
            console.warn("MySQL connection check failed:", error.message);
        }

        // Check MongoDB connection and get collection info
        try {
            if (mongoose.connection.readyState === 1) {
                const db = mongoose.connection.db;
                const collections = await db.listCollections().toArray();
                mongoCollectionCount = collections.length;
                mongoStatus = "Connected";

                // Get collection details with document counts
                for (const collection of collections) {
                    try {
                        const count = await db.collection(collection.name).countDocuments();
                        mongoCollections.push({
                            name: collection.name,
                            count: count
                        });
                    } catch (error) {
                        mongoCollections.push({
                            name: collection.name,
                            count: 0,
                            error: error.message
                        });
                    }
                }
            }
        } catch (error) {
            console.warn("MongoDB connection check failed:", error.message);
        }

        // Serve HTML dashboard
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CEDO Database Admin Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="bg-gray-100 min-h-screen">
    <div class="container mx-auto px-4 py-8" x-data="adminDashboard()">
        <!-- Header -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-8">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold text-gray-800">
                        <i class="fas fa-database text-blue-600 mr-3"></i>
                        CEDO Database Admin Dashboard
                    </h1>
                    <p class="text-gray-600 mt-2">Manage your MySQL and MongoDB databases</p>
                    <div class="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p class="text-sm text-blue-800">
                            <i class="fas fa-info-circle mr-2"></i>
                            <strong>Dashboard Access:</strong> You're viewing the dashboard directly. 
                            Data operations require API key authentication via headers or use the proxy server at 
                            <a href="http://localhost:3333" target="_blank" class="underline hover:no-underline">http://localhost:3333</a>
                        </p>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-sm text-gray-500">Last Updated</div>
                    <div class="text-lg font-semibold" x-text="new Date().toLocaleString()"></div>
                </div>
            </div>
        </div>

        <!-- Status Overview -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow-md p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-blue-100 text-blue-600">
                        <i class="fas fa-server text-xl"></i>
                    </div>
                    <div class="ml-4">
                        <h3 class="text-lg font-semibold text-gray-800">MySQL Status</h3>
                        <p class="text-2xl font-bold ${mysqlStatus === 'Connected' ? 'text-green-600' : 'text-red-600'}">${mysqlStatus}</p>
                        <p class="text-sm text-gray-500">${mysqlTableCount} tables</p>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-md p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-green-100 text-green-600">
                        <i class="fas fa-leaf text-xl"></i>
                    </div>
                    <div class="ml-4">
                        <h3 class="text-lg font-semibold text-gray-800">MongoDB Status</h3>
                        <p class="text-2xl font-bold ${mongoStatus === 'Connected' ? 'text-green-600' : 'text-red-600'}">${mongoStatus}</p>
                        <p class="text-sm text-gray-500">${mongoCollectionCount} collections</p>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-md p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-purple-100 text-purple-600">
                        <i class="fas fa-users text-xl"></i>
                    </div>
                    <div class="ml-4">
                        <h3 class="text-lg font-semibold text-gray-800">API Endpoints</h3>
                        <p class="text-2xl font-bold text-purple-600" x-text="apiEndpoints.length"></p>
                        <p class="text-sm text-gray-500">Available APIs</p>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-md p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-yellow-100 text-yellow-600">
                        <i class="fas fa-clock text-xl"></i>
                    </div>
                    <div class="ml-4">
                        <h3 class="text-lg font-semibold text-gray-800">Server Uptime</h3>
                        <p class="text-2xl font-bold text-yellow-600" x-text="serverUptime"></p>
                        <p class="text-sm text-gray-500">Since start</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="bg-white rounded-lg shadow-md mb-8">
            <div class="border-b border-gray-200">
                <nav class="flex">
                    <button @click="activeTab = 'overview'" 
                            :class="{'border-blue-500 text-blue-600': activeTab === 'overview', 'border-transparent text-gray-500 hover:text-gray-700': activeTab !== 'overview'}"
                            class="py-4 px-6 border-b-2 font-medium text-sm transition-colors duration-200">
                        <i class="fas fa-chart-line mr-2"></i>Overview
                    </button>
                    <button @click="activeTab = 'mysql'" 
                            :class="{'border-blue-500 text-blue-600': activeTab === 'mysql', 'border-transparent text-gray-500 hover:text-gray-700': activeTab !== 'mysql'}"
                            class="py-4 px-6 border-b-2 font-medium text-sm transition-colors duration-200">
                        <i class="fas fa-database mr-2"></i>MySQL Tables
                    </button>
                    <button @click="activeTab = 'mongodb'" 
                            :class="{'border-blue-500 text-blue-600': activeTab === 'mongodb', 'border-transparent text-gray-500 hover:text-gray-700': activeTab !== 'mongodb'}"
                            class="py-4 px-6 border-b-2 font-medium text-sm transition-colors duration-200">
                        <i class="fas fa-leaf mr-2"></i>MongoDB Collections
                    </button>
                    <button @click="activeTab = 'api'" 
                            :class="{'border-blue-500 text-blue-600': activeTab === 'api', 'border-transparent text-gray-500 hover:text-gray-700': activeTab !== 'api'}"
                            class="py-4 px-6 border-b-2 font-medium text-sm transition-colors duration-200">
                        <i class="fas fa-code mr-2"></i>API Testing
                    </button>
                </nav>
            </div>

            <!-- Tab Content -->
            <div class="p-6">
                <!-- Overview Tab -->
                <div x-show="activeTab === 'overview'" class="space-y-6">
                    <h2 class="text-2xl font-bold text-gray-800 mb-4">Database Overview</h2>
                    
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <!-- Quick Stats -->
                        <div class="bg-gray-50 rounded-lg p-6">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">
                                <i class="fas fa-chart-bar text-blue-600 mr-2"></i>Quick Statistics
                            </h3>
                            <div class="space-y-3">
                                <div class="flex justify-between">
                                    <span class="text-gray-600">MySQL Tables:</span>
                                    <span class="font-semibold">${mysqlTableCount}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">MongoDB Collections:</span>
                                    <span class="font-semibold">${mongoCollectionCount}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Total Endpoints:</span>
                                    <span class="font-semibold" x-text="apiEndpoints.length"></span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Server Status:</span>
                                    <span class="font-semibold text-green-600">
                                        <i class="fas fa-circle text-xs mr-1"></i>Online
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- Available Features -->
                        <div class="bg-gray-50 rounded-lg p-6">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">
                                <i class="fas fa-tools text-green-600 mr-2"></i>Available Features
                            </h3>
                            <div class="space-y-3">
                                <div class="flex items-center">
                                    <i class="fas fa-check-circle text-green-500 mr-3"></i>
                                    <span>MySQL Database Management</span>
                                </div>
                                <div class="flex items-center">
                                    <i class="fas fa-check-circle text-green-500 mr-3"></i>
                                    <span>MongoDB Collection Management</span>
                                </div>
                                <div class="flex items-center">
                                    <i class="fas fa-check-circle text-green-500 mr-3"></i>
                                    <span>RESTful API Endpoints</span>
                                </div>
                                <div class="flex items-center">
                                    <i class="fas fa-check-circle text-green-500 mr-3"></i>
                                    <span>Real-time Database Monitoring</span>
                                </div>
                                <div class="flex items-center">
                                    <i class="fas fa-check-circle text-green-500 mr-3"></i>
                                    <span>Data Pagination & Search</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- MySQL Tab -->
                <div x-show="activeTab === 'mysql'" class="space-y-6">
                    <div class="flex justify-between items-center">
                        <h2 class="text-2xl font-bold text-gray-800">MySQL Tables</h2>
                        <button @click="loadMySQLTables()" 
                                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200">
                            <i class="fas fa-sync-alt mr-2"></i>Refresh
                        </button>
                    </div>
                    
                    <div class="bg-gray-50 rounded-lg p-4" x-show="mysqlTables.length === 0">
                        <p class="text-center text-gray-600">Loading MySQL tables...</p>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" x-show="mysqlTables.length > 0">
                        <template x-for="table in mysqlTables" :key="table.name">
                            <div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                                <h3 class="font-semibold text-gray-800 text-lg mb-2" x-text="table.name"></h3>
                                <p class="text-gray-600 text-sm mb-3" x-text="'Records: ' + table.count"></p>
                                <div class="flex space-x-2">
                                    <button @click="viewTableData(table.name, 'mysql')" 
                                            class="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded text-sm transition-colors duration-200">
                                        <i class="fas fa-eye mr-1"></i>View Data
                                    </button>
                                    <button @click="viewTableSchema(table.name, 'mysql')" 
                                            class="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded text-sm transition-colors duration-200">
                                        <i class="fas fa-table mr-1"></i>Schema
                                    </button>
                                </div>
                            </div>
                        </template>
                    </div>
                </div>

                <!-- MongoDB Tab -->
                <div x-show="activeTab === 'mongodb'" class="space-y-6">
                    <div class="flex justify-between items-center">
                        <h2 class="text-2xl font-bold text-gray-800">MongoDB Collections</h2>
                        <button @click="loadMongoCollections()" 
                                class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200">
                            <i class="fas fa-sync-alt mr-2"></i>Refresh
                        </button>
                    </div>
                    
                    <div class="bg-gray-50 rounded-lg p-4" x-show="mongoCollections.length === 0">
                        <p class="text-center text-gray-600">Loading MongoDB collections...</p>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" x-show="mongoCollections.length > 0">
                        <template x-for="collection in mongoCollections" :key="collection.name">
                            <div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                                <h3 class="font-semibold text-gray-800 text-lg mb-2" x-text="collection.name"></h3>
                                <p class="text-gray-600 text-sm mb-3" x-text="'Documents: ' + collection.count"></p>
                                <div class="flex space-x-2">
                                    <button @click="viewTableData(collection.name, 'mongodb')" 
                                            class="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded text-sm transition-colors duration-200">
                                        <i class="fas fa-eye mr-1"></i>View Data
                                    </button>
                                    <button @click="viewTableSchema(collection.name, 'mongodb')" 
                                            class="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded text-sm transition-colors duration-200">
                                        <i class="fas fa-file-code mr-1"></i>Schema
                                    </button>
                                </div>
                            </div>
                        </template>
                    </div>
                </div>

                <!-- API Testing Tab -->
                <div x-show="activeTab === 'api'" class="space-y-6">
                    <h2 class="text-2xl font-bold text-gray-800">API Endpoint Testing</h2>
                    
                    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h3 class="font-semibold text-yellow-800 mb-2">
                            <i class="fas fa-info-circle mr-2"></i>Available Endpoints
                        </h3>
                        <div class="space-y-2">
                            <template x-for="endpoint in apiEndpoints" :key="endpoint.url">
                                <div class="flex items-center justify-between bg-white p-3 rounded border">
                                    <div>
                                        <span class="font-mono text-sm" :class="'text-' + endpoint.color + '-600'" x-text="endpoint.method"></span>
                                        <span class="ml-3 font-mono text-sm" x-text="endpoint.url"></span>
                                    </div>
                                    <div class="flex space-x-2">
                                        <a :href="endpoint.url" target="_blank" 
                                           class="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded text-sm transition-colors duration-200">
                                            <i class="fas fa-external-link-alt mr-1"></i>Test
                                        </a>
                                        <button @click="copyToClipboard(endpoint.url)" 
                                                class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm transition-colors duration-200">
                                            <i class="fas fa-copy mr-1"></i>Copy
                                        </button>
                                    </div>
                                </div>
                            </template>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Data Viewer Modal -->
        <div x-show="showDataModal" 
             x-transition:enter="transition ease-out duration-300" 
             x-transition:enter-start="opacity-0" 
             x-transition:enter-end="opacity-100"
             x-transition:leave="transition ease-in duration-200"
             x-transition:leave-start="opacity-100" 
             x-transition:leave-end="opacity-0"
             class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" 
             style="display: none;">
            
            <div class="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
                <!-- Modal Header -->
                <div class="flex items-center justify-between border-b pb-3 mb-4">
                    <h3 class="text-2xl font-bold text-gray-900" x-text="modalTitle"></h3>
                    <button @click="closeDataModal()" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <!-- Modal Content -->
                <div class="max-h-96 overflow-y-auto">
                    <!-- Loading State -->
                    <div x-show="modalLoading" class="text-center py-8">
                        <i class="fas fa-spinner fa-spin text-3xl text-blue-600 mb-4"></i>
                        <p class="text-gray-600">Loading data...</p>
                    </div>
                    
                    <!-- Error State -->
                    <div x-show="modalError && !modalLoading" class="text-center py-8">
                        <i class="fas fa-exclamation-triangle text-3xl text-red-600 mb-4"></i>
                        <p class="text-red-600" x-text="modalError"></p>
                    </div>
                    
                    <!-- Data Table -->
                    <div x-show="modalData.length > 0 && !modalLoading && !modalError">
                        <div class="mb-4 flex justify-between items-center">
                            <p class="text-sm text-gray-600" x-text="'Showing ' + modalData.length + ' records'"></p>
                            <div class="flex space-x-2">
                                <button @click="exportModalData('json')" 
                                        class="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded text-sm">
                                    <i class="fas fa-download mr-1"></i>JSON
                                </button>
                                <button @click="exportModalData('csv')" 
                                        class="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded text-sm">
                                    <i class="fas fa-file-csv mr-1"></i>CSV
                                </button>
                            </div>
                        </div>
                        
                        <div class="overflow-x-auto">
                            <table class="min-w-full bg-white border border-gray-200">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <template x-for="(value, key) in modalData[0]" :key="key">
                                            <th class="px-3 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider" x-text="key"></th>
                                        </template>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-200">
                                    <template x-for="(row, index) in modalData" :key="index">
                                        <tr class="hover:bg-gray-50">
                                            <template x-for="(value, key) in row" :key="key">
                                                <td class="px-3 py-2 border-b text-sm text-gray-900 break-words max-w-xs" 
                                                    x-text="typeof value === 'object' ? JSON.stringify(value) : value"></td>
                                            </template>
                                        </tr>
                                    </template>
                                </tbody>
                            </table>
                        </div>
                        
                        <!-- Pagination -->
                        <div x-show="modalPagination" class="mt-4 flex justify-between items-center">
                            <div class="text-sm text-gray-600">
                                <span x-text="'Page ' + modalPagination.page + ' of ' + modalPagination.pages"></span>
                                <span x-text="' (Total: ' + modalPagination.total + ' records)'"></span>
                            </div>
                            <div class="flex space-x-2">
                                <button @click="loadModalData(modalCurrentTable, modalCurrentType, modalPagination.page - 1)" 
                                        :disabled="modalPagination.page <= 1"
                                        :class="modalPagination.page <= 1 ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 hover:bg-blue-200 text-blue-700'"
                                        class="px-3 py-1 rounded text-sm">
                                    <i class="fas fa-chevron-left mr-1"></i>Previous
                                </button>
                                <button @click="loadModalData(modalCurrentTable, modalCurrentType, modalPagination.page + 1)" 
                                        :disabled="modalPagination.page >= modalPagination.pages"
                                        :class="modalPagination.page >= modalPagination.pages ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 hover:bg-blue-200 text-blue-700'"
                                        class="px-3 py-1 rounded text-sm">
                                    Next<i class="fas fa-chevron-right ml-1"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Schema View -->
                    <div x-show="modalSchema && !modalLoading && !modalError">
                        <div class="bg-gray-50 rounded-lg p-4">
                            <pre class="text-sm text-gray-800 whitespace-pre-wrap" x-text="modalSchema"></pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-gray-600">CEDO Database Admin Dashboard</p>
                    <p class="text-sm text-gray-500">Django Admin-like interface for Express.js & MySQL/MongoDB</p>
                </div>
                <div class="text-sm text-gray-500">
                    <i class="fas fa-server mr-1"></i>Server: ${process.env.NODE_ENV || 'development'}
                </div>
            </div>
        </div>
    </div>

    <script>
        // Pre-load dashboard data from server
        window.dashboardData = {
            mysqlTables: ${JSON.stringify(mysqlTables)},
            mongoCollections: ${JSON.stringify(mongoCollections)},
            mysqlStatus: "${mysqlStatus}",
            mongoStatus: "${mongoStatus}",
            mysqlTableCount: ${mysqlTableCount},
            mongoCollectionCount: ${mongoCollectionCount}
        };
    </script>
    <script>
        function adminDashboard() {
            return {
                activeTab: 'overview',
                mysqlTables: window.dashboardData.mysqlTables || [],
                mongoCollections: window.dashboardData.mongoCollections || [],
                serverUptime: 'Calculating...',
                
                // Modal data
                showDataModal: false,
                modalTitle: '',
                modalLoading: false,
                modalError: null,
                modalData: [],
                modalSchema: null,
                modalPagination: null,
                modalCurrentTable: '',
                modalCurrentType: '',
                
                apiEndpoints: [
                    { method: 'GET', url: '/api/db/mysql/users', color: 'green' },
                    { method: 'GET', url: '/api/db/mysql/users?limit=5', color: 'green' },
                    { method: 'GET', url: '/api/db/mongodb/proposal_files', color: 'green' },
                    { method: 'GET', url: '/api/db/mongodb/proposals', color: 'green' },
                    { method: 'GET', url: '/health', color: 'blue' },
                    { method: 'GET', url: '/api/admin/mysql/status', color: 'blue' },
                    { method: 'GET', url: '/api/admin/mongodb/status', color: 'blue' }
                ],

                init() {
                    // Use pre-loaded data from server
                    this.mysqlTables = window.dashboardData.mysqlTables;
                    this.mongoCollections = window.dashboardData.mongoCollections;
                    this.updateServerUptime();
                    setInterval(() => this.updateServerUptime(), 1000);
                },

                async loadMySQLTables() {
                    // Use pre-loaded data, but allow refresh if needed
                    this.mysqlTables = window.dashboardData.mysqlTables;
                },

                async loadMongoCollections() {
                    // Use pre-loaded data, but allow refresh if needed
                    this.mongoCollections = window.dashboardData.mongoCollections;
                },

                updateServerUptime() {
                    const uptime = new Date().toLocaleTimeString();
                    this.serverUptime = uptime;
                },

                // Modal Methods
                async viewTableData(tableName, type, page = 1) {
                    this.modalCurrentTable = tableName;
                    this.modalCurrentType = type;
                    this.modalTitle = \`\${type.toUpperCase()}: \${tableName} - Data\`;
                    this.showDataModal = true;
                    this.modalSchema = null;
                    
                    await this.loadModalData(tableName, type, page);
                },

                async viewTableSchema(tableName, type) {
                    this.modalCurrentTable = tableName;
                    this.modalCurrentType = type;
                    this.modalTitle = \`\${type.toUpperCase()}: \${tableName} - Schema\`;
                    this.showDataModal = true;
                    this.modalData = [];
                    this.modalPagination = null;
                    
                    await this.loadModalSchema(tableName, type);
                },

                async loadModalData(tableName, type, page = 1) {
                    this.modalLoading = true;
                    this.modalError = null;
                    
                    try {
                        const url = type === 'mysql' ? 
                            \`/api/db/mysql/\${tableName}?page=\${page}&limit=10\` : 
                            \`/api/db/mongodb/\${tableName}?page=\${page}&limit=10\`;
                            
                        console.log('Loading data from:', url);
                        const response = await fetch(url);
                        
                        if (!response.ok) {
                            const errorText = await response.text();
                            console.error('Error response:', response.status, errorText);
                            throw new Error(\`Server returned \${response.status}: \${errorText}\`);
                        }
                        
                        const data = await response.json();
                        console.log('Data loaded successfully:', data);
                        this.modalData = data.data || [];
                        this.modalPagination = data.pagination || null;
                    } catch (error) {
                        console.error('Error loading data:', error);
                        this.modalError = 'Error loading data: ' + error.message;
                        this.modalData = [];
                        this.modalPagination = null;
                    } finally {
                        this.modalLoading = false;
                    }
                },

                async loadModalSchema(tableName, type) {
                    this.modalLoading = true;
                    this.modalError = null;
                    
                    try {
                        const url = \`/api/db/schema/\${type}\`;
                        console.log('Loading schema from:', url);
                        const response = await fetch(url);
                        
                        if (!response.ok) {
                            const errorText = await response.text();
                            console.error('Schema error response:', response.status, errorText);
                            throw new Error(\`Server returned \${response.status}: \${errorText}\`);
                        }
                        
                        const data = await response.json();
                        console.log('Schema loaded successfully:', data);
                        
                        // Extract schema for specific table/collection
                        const specificSchema = data.schema[tableName];
                        if (specificSchema) {
                            this.modalSchema = JSON.stringify(specificSchema, null, 2);
                        } else {
                            this.modalSchema = JSON.stringify(data.schema, null, 2);
                        }
                    } catch (error) {
                        console.error('Error loading schema:', error);
                        this.modalError = 'Error loading schema: ' + error.message;
                        this.modalSchema = null;
                    } finally {
                        this.modalLoading = false;
                    }
                },

                closeDataModal() {
                    this.showDataModal = false;
                    this.modalData = [];
                    this.modalSchema = null;
                    this.modalError = null;
                    this.modalPagination = null;
                    this.modalCurrentTable = '';
                    this.modalCurrentType = '';
                },

                exportModalData(format) {
                    if (this.modalData.length === 0) {
                        alert('No data to export');
                        return;
                    }
                    
                    let content, fileName, mimeType;
                    
                    if (format === 'json') {
                        content = JSON.stringify(this.modalData, null, 2);
                        fileName = \`\${this.modalCurrentTable}_data.json\`;
                        mimeType = 'application/json';
                    } else if (format === 'csv') {
                        const headers = Object.keys(this.modalData[0] || {});
                        const csvRows = [headers.join(',')];
                        
                        this.modalData.forEach(row => {
                            const values = headers.map(header => {
                                const value = row[header];
                                if (value === null || value === undefined) return '';
                                if (typeof value === 'object') return JSON.stringify(value);
                                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                                    return '"' + value.replace(/"/g, '""') + '"';
                                }
                                return value;
                            });
                            csvRows.push(values.join(','));
                        });
                        
                        content = csvRows.join('\\n');
                        fileName = \`\${this.modalCurrentTable}_data.csv\`;
                        mimeType = 'text/csv';
                    }
                    
                    const blob = new Blob([content], { type: mimeType });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                },

                copyToClipboard(text) {
                    navigator.clipboard.writeText(window.location.origin + text).then(() => {
                        alert('URL copied to clipboard!');
                    });
                }
            }
        }
    </script>
</body>
</html>`;

        res.send(html);
    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load admin dashboard'
        });
    }
});

// =============================================== 
// PROTECTED ADMIN API ENDPOINTS (Auth Required)
// ===============================================

// Apply authentication middleware to API routes only
router.use('/mysql', validateToken, validateAdmin)
router.use('/mongodb', validateToken, validateAdmin)
router.use('/proposals', validateToken, validateAdmin)
router.use('/dashboard', validateToken, validateAdmin)
router.use('/reports', validateToken, validateAdmin)

// ===============================================
// MYSQL STATUS AND DATA ENDPOINTS  
// ===============================================

/**
 * @route GET /api/admin/mysql/status
 * @desc Get MySQL connection status and basic info
 * @access Private (Admin)
 */
router.get('/mysql/status', async (req, res) => {
    try {
        const [userCount] = await pool.query('SELECT COUNT(*) as count FROM users');
        const [proposalCount] = await pool.query('SELECT COUNT(*) as count FROM proposals WHERE 1=1');

        res.json({
            status: 'Connected',
            totalUsers: userCount[0].count,
            totalProposals: proposalCount[0].count,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'Error',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @route GET /api/admin/mysql/tables
 * @desc Get list of MySQL tables with record counts
 * @access Private (Admin)
 */
router.get('/mysql/tables', async (req, res) => {
    try {
        const [tables] = await pool.query('SHOW TABLES');
        const tableList = [];

        for (const tableRow of tables) {
            const tableName = Object.values(tableRow)[0];
            try {
                const [countResult] = await pool.query(`SELECT COUNT(*) as count FROM ??`, [tableName]);
                tableList.push({
                    name: tableName,
                    count: countResult[0].count
                });
            } catch (error) {
                tableList.push({
                    name: tableName,
                    count: 0,
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            tables: tableList
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route GET /api/admin/mysql/table/:name
 * @desc Get data from specific MySQL table
 * @access Private (Admin)
 */
router.get('/mysql/table/:name', async (req, res) => {
    try {
        const { name } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const [rows] = await pool.query(`SELECT * FROM ?? LIMIT ? OFFSET ?`, [name, limit, offset]);
        const [countResult] = await pool.query(`SELECT COUNT(*) as total FROM ??`, [name]);

        res.json({
            success: true,
            data: rows,
            pagination: {
                page,
                limit,
                total: countResult[0].total,
                pages: Math.ceil(countResult[0].total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===============================================
// MONGODB STATUS AND DATA ENDPOINTS
// ===============================================

/**
 * @route GET /api/admin/mongodb/status  
 * @desc Get MongoDB connection status and basic info
 * @access Private (Admin)
 */
router.get('/mongodb/status', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(500).json({
                status: 'Disconnected',
                error: 'MongoDB connection not ready',
                timestamp: new Date().toISOString()
            });
        }

        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();

        res.json({
            status: 'Connected',
            totalCollections: collections.length,
            collections: collections.map(c => c.name),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'Error',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @route GET /api/admin/mongodb/collections
 * @desc Get list of MongoDB collections with document counts
 * @access Private (Admin)
 */
router.get('/mongodb/collections', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(500).json({
                success: false,
                error: 'MongoDB connection not ready'
            });
        }

        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        const collectionList = [];

        for (const collection of collections) {
            try {
                const count = await db.collection(collection.name).countDocuments();
                collectionList.push({
                    name: collection.name,
                    count: count
                });
            } catch (error) {
                collectionList.push({
                    name: collection.name,
                    count: 0,
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            collections: collectionList
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route GET /api/admin/mongodb/collection/:name
 * @desc Get data from specific MongoDB collection
 * @access Private (Admin)
 */
router.get('/mongodb/collection/:name', async (req, res) => {
    try {
        const { name } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        if (mongoose.connection.readyState !== 1) {
            return res.status(500).json({
                success: false,
                error: 'MongoDB connection not ready'
            });
        }

        const db = mongoose.connection.db;
        const collection = db.collection(name);

        const documents = await collection.find({}).skip(skip).limit(limit).toArray();
        const total = await collection.countDocuments();

        res.json({
            success: true,
            data: documents,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===============================================
// PROPOSAL MANAGEMENT ENDPOINTS
// ===============================================

/**
 * @route GET /api/admin/proposals
 * @desc Get all proposals with pagination, filtering and search
 * @access Private (Admin)
 */
router.get("/proposals", async (req, res, next) => {
    try {
        const page = Number.parseInt(req.query.page) || 1
        const limit = Number.parseInt(req.query.limit) || 10
        const offset = (page - 1) * limit
        const status = req.query.status
        const search = req.query.search

        // Build the base query
        let query = "SELECT * FROM proposals"
        let countQuery = "SELECT COUNT(*) as total FROM proposals"
        const queryParams = []
        const countParams = []

        // Add filters
        if (status && status !== "all") {
            query += " WHERE status = ?"
            countQuery += " WHERE status = ?"
            queryParams.push(status)
            countParams.push(status)
        }

        // Add search
        if (search) {
            const searchClause = status && status !== "all" ? " AND" : " WHERE"
            const searchPattern = `% ${search} % `

            query += `${searchClause}(eventName LIKE ? OR contactPerson LIKE ? OR venue LIKE ?)`
            countQuery += `${searchClause}(eventName LIKE ? OR contactPerson LIKE ? OR venue LIKE ?)`

            queryParams.push(searchPattern, searchPattern, searchPattern)
            countParams.push(searchPattern, searchPattern, searchPattern)
        }

        // Add sorting
        query += " ORDER BY submittedAt DESC"

        // Add pagination
        query += " LIMIT ? OFFSET ?"
        queryParams.push(limit, offset)

        // Execute queries with connection pooling
        const [proposals] = await pool.query(query, queryParams)
        const [countResult] = await pool.query(countQuery, countParams)
        const total = countResult[0].total

        // Calculate pagination metadata
        const pages = Math.ceil(total / limit)
        const pagination = {
            page,
            limit,
            total,
            pages,
            hasPrev: page > 1,
            hasNext: page < pages,
        }

        // Process proposals to include file information
        const processedProposals = await Promise.all(
            proposals.map(async (proposal) => {
                try {
                    // Get file information if available
                    const [files] = await pool.query(
                        "SELECT fileType, fileName, filePath FROM proposal_files WHERE proposalId = ?",
                        [proposal.id],
                    )

                    const fileMap = {}
                    if (files.length > 0) {
                        files.forEach((file) => {
                            fileMap[file.fileType] = {
                                name: file.fileName,
                                path: file.filePath,
                            }
                        })
                    }

                    return {
                        ...proposal,
                        files: fileMap,
                    }
                } catch (error) {
                    logger.error(`Error processing proposal files for ID ${proposal.id}: `, error)
                    return {
                        ...proposal,
                        files: {},
                    }
                }
            }),
        )

        res.json({
            success: true,
            proposals: processedProposals,
            pagination,
        })
    } catch (error) {
        next(error)
    }
})

/**
 * @route GET /api/admin/proposals/:id
 * @desc Get a single proposal by ID
 * @access Private (Admin)
 */
router.get("/proposals/:id", async (req, res, next) => {
    try {
        const { id } = req.params

        // Get proposal details
        const [proposals] = await pool.query("SELECT * FROM proposals WHERE id = ?", [id])

        if (proposals.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Proposal not found",
            })
        }

        const proposal = proposals[0]

        // Get associated files
        const [files] = await pool.query("SELECT fileType, fileName, filePath FROM proposal_files WHERE proposalId = ?", [
            id,
        ])

        const fileMap = {}
        if (files.length > 0) {
            files.forEach((file) => {
                fileMap[file.fileType] = {
                    name: file.fileName,
                    path: file.filePath,
                }
            })
        }

        // Get approval history
        const [history] = await pool.query(
            "SELECT * FROM proposal_status_history WHERE proposalId = ? ORDER BY timestamp DESC",
            [id],
        )

        res.json({
            success: true,
            proposal: {
                ...proposal,
                files: fileMap,
                history,
            },
        })
    } catch (error) {
        next(error)
    }
})

/**
 * @route PATCH /api/admin/proposals/:id/status
 * @desc Update proposal status (approve/deny)
 * @access Private (Admin)
 */
router.patch("/proposals/:id/status", async (req, res, next) => {
    const connection = await pool.getConnection()

    try {
        await connection.beginTransaction()

        const { id } = req.params
        const { status, adminComments } = req.body
        const adminId = req.user.id // From auth middleware

        if (!["approved", "denied", "pending", "rejected"].includes(status)) {
            return res.status(400).json({
                success: false,
                error: "Invalid status value",
            })
        }

        // Update proposal status
        const [updateResult] = await connection.query(
            "UPDATE proposals SET status = ?, adminComments = ?, updatedAt = NOW() WHERE id = ?",
            [status, adminComments || null, id],
        )

        if (updateResult.affectedRows === 0) {
            await connection.rollback()
            return res.status(404).json({
                success: false,
                error: "Proposal not found",
            })
        }

        // Record status change in history
        await connection.query(
            "INSERT INTO proposal_status_history (proposalId, status, adminId, comments, timestamp) VALUES (?, ?, ?, ?, NOW())",
            [id, status, adminId, adminComments || null],
        )

        // If approved, update user credits if applicable
        if (status === "approved") {
            const [proposals] = await connection.query("SELECT userId, eventType, creditValue FROM proposals WHERE id = ?", [
                id,
            ])

            if (proposals.length > 0 && proposals[0].userId && proposals[0].creditValue) {
                await connection.query("UPDATE users SET sdpCredits = sdpCredits + ? WHERE id = ?", [
                    proposals[0].creditValue,
                    proposals[0].userId,
                ])

                // Log credit award
                await connection.query(
                    "INSERT INTO credit_logs (userId, proposalId, credits, reason, timestamp) VALUES (?, ?, ?, ?, NOW())",
                    [proposals[0].userId, id, proposals[0].creditValue, `Proposal approved: ${proposals[0].eventType} `],
                )
            }
        }

        await connection.commit()

        // Send notification to user (implementation depends on your notification system)
        // This could be a database entry, email, or push notification

        res.json({
            success: true,
            message: `Proposal ${status} successfully`,
            proposalId: id,
            status,
        })
    } catch (error) {
        await connection.rollback()
        next(error)
    } finally {
        connection.release()
    }
})

/**
 * @route POST /api/admin/proposals/:id/comment
 * @desc Add admin comment to a proposal
 * @access Private (Admin)
 */
router.post("/proposals/:id/comment", async (req, res, next) => {
    try {
        const { id } = req.params
        const { comment } = req.body
        const adminId = req.user.id // From auth middleware

        if (!comment || comment.trim() === "") {
            return res.status(400).json({
                success: false,
                error: "Comment cannot be empty",
            })
        }

        // Add comment to proposal
        const [updateResult] = await pool.query(
            'UPDATE proposals SET adminComments = CONCAT(IFNULL(adminComments, ""), ?, "\n"), updatedAt = NOW() WHERE id = ?',
            [`[${new Date().toISOString()}] ${comment} `, id],
        )

        if (updateResult.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: "Proposal not found",
            })
        }

        // Record comment in history
        await pool.query(
            "INSERT INTO proposal_comments (proposalId, adminId, comment, timestamp) VALUES (?, ?, ?, NOW())",
            [id, adminId, comment],
        )

        res.json({
            success: true,
            message: "Comment added successfully",
            proposalId: id,
        })
    } catch (error) {
        next(error)
    }
})

/**
 * @route GET /api/admin/proposals/:id/download/:fileType
 * @desc Download a proposal file
 * @access Private (Admin)
 */
router.get("/proposals/:id/download/:fileType", async (req, res, next) => {
    try {
        const { id, fileType } = req.params

        // Get file information
        const [files] = await pool.query(
            "SELECT fileName, filePath FROM proposal_files WHERE proposalId = ? AND fileType = ?",
            [id, fileType],
        )

        if (files.length === 0) {
            return res.status(404).json({
                success: false,
                error: "File not found",
            })
        }

        const file = files[0]
        const filePath = path.resolve(file.filePath)

        // Check if file exists
        try {
            await fs.access(filePath)
        } catch (error) {
            return res.status(404).json({
                success: false,
                error: "File not found on server",
            })
        }

        // Log download
        await pool.query(
            "INSERT INTO file_download_logs (proposalId, fileType, adminId, timestamp) VALUES (?, ?, ?, NOW())",
            [id, fileType, req.user.id],
        )

        // Send file
        res.download(filePath, file.fileName)
    } catch (error) {
        next(error)
    }
})

/**
 * @route POST /api/admin/proposals/:id/files
 * @desc Upload files for a proposal
 * @access Private (Admin)
 */
router.post("/proposals/:id/files", upload.array("files", 5), async (req, res, next) => {
    try {
        const { id } = req.params
        const { fileTypes } = req.body

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: "No files uploaded",
            })
        }

        if (!fileTypes || typeof fileTypes !== "string") {
            return res.status(400).json({
                success: false,
                error: "File types must be provided",
            })
        }

        const fileTypeArray = fileTypes.split(",")

        if (fileTypeArray.length !== req.files.length) {
            return res.status(400).json({
                success: false,
                error: "File types count must match uploaded files count",
            })
        }

        // Check if proposal exists
        const [proposals] = await pool.query("SELECT id FROM proposals WHERE id = ?", [id])

        if (proposals.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Proposal not found",
            })
        }

        // Save file information to database
        const fileInserts = req.files.map((file, index) => {
            return pool.query(
                "INSERT INTO proposal_files (proposalId, fileType, fileName, filePath, uploadedBy, uploadedAt) VALUES (?, ?, ?, ?, ?, NOW())",
                [id, fileTypeArray[index], file.originalname, file.path, req.user.id],
            )
        })

        await Promise.all(fileInserts)

        res.json({
            success: true,
            message: "Files uploaded successfully",
            files: req.files.map((file, index) => ({
                name: file.originalname,
                type: fileTypeArray[index],
                size: file.size,
            })),
        })
    } catch (error) {
        // Clean up uploaded files if there was an error
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                try {
                    await fs.unlink(file.path)
                } catch (unlinkError) {
                    logger.error(`Failed to delete file ${file.path}: `, unlinkError)
                }
            }
        }
        next(error)
    }
})

/**
 * @route DELETE /api/admin/proposals/:id/files/:fileType
 * @desc Delete a proposal file
 * @access Private (Admin)
 */
router.delete("/proposals/:id/files/:fileType", async (req, res, next) => {
    try {
        const { id, fileType } = req.params

        // Get file information
        const [files] = await pool.query(
            "SELECT fileName, filePath FROM proposal_files WHERE proposalId = ? AND fileType = ?",
            [id, fileType],
        )

        if (files.length === 0) {
            return res.status(404).json({
                success: false,
                error: "File not found",
            })
        }

        const file = files[0]

        // Delete file from storage
        try {
            await fs.unlink(file.filePath)
        } catch (error) {
            logger.error(`Failed to delete file ${file.filePath}: `, error)
            // Continue with database deletion even if file deletion fails
        }

        // Delete file record from database
        await pool.query("DELETE FROM proposal_files WHERE proposalId = ? AND fileType = ?", [id, fileType])

        res.json({
            success: true,
            message: "File deleted successfully",
        })
    } catch (error) {
        next(error)
    }
})

/**
 * @route GET /api/admin/dashboard/stats
 * @desc Get dashboard statistics
 * @access Private (Admin)
 */
router.get("/dashboard/stats", async (req, res, next) => {
    try {
        // Get proposal statistics
        const [proposalStats] = await pool.query(`
        SELECT
        COUNT(*) as total,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
            SUM(CASE WHEN status = 'denied' THEN 1 ELSE 0 END) as denied,
            SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM proposals
            `)

        // Get user statistics
        const [userStats] = await pool.query(`
        SELECT
        COUNT(*) as total,
            SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) as students,
            SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
            SUM(CASE WHEN role = 'faculty' THEN 1 ELSE 0 END) as faculty
      FROM users
            `)

        // Get recent proposals
        const [recentProposals] = await pool.query(`
      SELECT id, eventName, status, submittedAt, contactPerson
      FROM proposals
      ORDER BY submittedAt DESC
      LIMIT 5
            `)

        // Get event type distribution
        const [eventTypes] = await pool.query(`
      SELECT eventType, COUNT(*) as count
      FROM proposals
      GROUP BY eventType
      ORDER BY count DESC
    `)

        res.json({
            success: true,
            stats: {
                proposals: proposalStats[0],
                users: userStats[0],
                recentProposals,
                eventTypes,
            },
        })
    } catch (error) {
        next(error)
    }
})

/**
 * @route GET /api/admin/reports/proposals
 * @desc Generate proposal report with filters
 * @access Private (Admin)
 */
router.get("/reports/proposals", async (req, res, next) => {
    try {
        const { startDate, endDate, status, eventType, format = "json" } = req.query

        // Build query with filters
        let query = "SELECT * FROM proposals WHERE 1=1"
        const queryParams = []

        if (startDate) {
            query += " AND submittedAt >= ?"
            queryParams.push(new Date(startDate))
        }

        if (endDate) {
            query += " AND submittedAt <= ?"
            queryParams.push(new Date(endDate))
        }

        if (status && status !== "all") {
            query += " AND status = ?"
            queryParams.push(status)
        }

        if (eventType && eventType !== "all") {
            query += " AND eventType = ?"
            queryParams.push(eventType)
        }

        // Execute query
        const [proposals] = await pool.query(query, queryParams)

        // Format response based on requested format
        if (format === "csv") {
            // Convert to CSV
            const fields = Object.keys(proposals[0] || {})
            let csv = fields.join(",") + "\n"

            proposals.forEach((proposal) => {
                const row = fields.map((field) => {
                    const value = proposal[field]
                    // Handle values that need escaping
                    if (value === null || value === undefined) return ""
                    if (typeof value === "string" && (value.includes(',') || value.includes('"') || value.includes("\n"))) {
                        return `"${value.replace(/"/g, '""')}"`
                    }
                    return value
                })
            })

            res.setHeader("Content-Type", "text/csv")
            res.setHeader("Content-Disposition", 'attachment; filename="proposal-report.csv"')
            return res.send(csv)
        }

        // Default JSON response
        res.json({
            success: true,
            count: proposals.length,
            proposals,
        })
    } catch (error) {
        next(error)
    }
})

// Apply error handler to all routes
router.use(handleErrors)

module.exports = router
