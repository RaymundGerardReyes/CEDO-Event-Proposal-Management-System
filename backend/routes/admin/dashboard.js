/**
 * Admin Dashboard Routes
 * 
 * This module handles the admin dashboard interface and stats endpoints.
 * Includes the HTML dashboard interface with real-time database monitoring.
 *
 * @module routes/admin/dashboard
 * @requires express
 * @requires mysql2/promise
 * @requires mongoose
 */

const express = require('express');
const router = express.Router();
const logger = require('../../utils/logger');
const mongoose = require('mongoose');
const { pool, query } = require('../../config/database');
const { validateAdmin, validateToken } = require('../../middleware/auth');

// ===============================================
// PUBLIC ADMIN DASHBOARD (No Auth Required)
// ===============================================

/**
 * @route GET /api/admin/
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
            await query("SELECT 1");
            const tablesResult = await query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
            mysqlTableCount = tablesResult.rows.length;
            mysqlStatus = "Connected";

            // Get table details with row counts
            for (const tableRow of tablesResult.rows) {
                const tableName = tableRow.table_name;
                try {
                    const countResult = await query(`SELECT COUNT(*) as count FROM ${tableName}`);
                    mysqlTables.push({
                        name: tableName,
                        count: countResult.rows[0].count
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
// DASHBOARD STATS ENDPOINTS
// ===============================================

/**
 * @route GET /api/admin/dashboard/stats
 * @desc Get dashboard statistics
 * @access Private (Admin)
 */
router.get("/dashboard/stats", validateToken, validateAdmin, async (req, res, next) => {
    try {
        console.log('🔍 [Dashboard Stats] Fetching proposal statistics...');

        // Get proposal statistics using correct column names
        const proposalStatsResult = await query(`
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN proposal_status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN proposal_status = 'approved' THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN proposal_status = 'rejected' OR proposal_status = 'denied' THEN 1 ELSE 0 END) as rejected
            FROM proposals
        `);

        // Get yesterday's total for growth calculation
        const yesterdayStatsResult = await query(`
            SELECT COUNT(*) as yesterdayTotal
            FROM proposals 
            WHERE created_at < CURRENT_DATE
        `);

        // Get new proposals since yesterday
        const newTodayStatsResult = await query(`
            SELECT COUNT(*) as newSinceYesterday
            FROM proposals 
            WHERE created_at >= CURRENT_DATE
        `);

        // Get user statistics (check if columns exist first)
        const userStatsResult = await query(`
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) as students,
                SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
                SUM(CASE WHEN role = 'faculty' THEN 1 ELSE 0 END) as faculty
            FROM users
        `);

        // Get recent proposals with correct column names
        const recentProposalsResult = await query(`
            SELECT 
                id, 
                event_name as eventName, 
                proposal_status as status, 
                COALESCE(submitted_at, created_at) as submittedAt, 
                contact_name as contactPerson
            FROM proposals
            WHERE event_name IS NOT NULL
            ORDER BY COALESCE(submitted_at, created_at) DESC
            LIMIT 5
        `);

        // Get event type distribution
        const eventTypesResult = await query(`
            SELECT 
                COALESCE(school_event_type, community_event_type, 'other') as eventType, 
                COUNT(*) as count
            FROM proposals
            WHERE COALESCE(school_event_type, community_event_type) IS NOT NULL
            GROUP BY COALESCE(school_event_type, community_event_type)
            ORDER BY count DESC
        `);

        // Calculate metrics safely
        const currentTotal = proposalStatsResult.rows[0]?.total || 0;
        const yesterdayTotal = yesterdayStatsResult.rows[0]?.yesterdayTotal || 0;
        const newSinceYesterday = newTodayStatsResult.rows[0]?.newSinceYesterday || 0;

        const dayOverDayChange = yesterdayTotal > 0
            ? ((currentTotal - yesterdayTotal) / yesterdayTotal * 100).toFixed(1)
            : 0;

        const approved = proposalStatsResult.rows[0]?.approved || 0;
        const approvalRate = currentTotal > 0
            ? ((approved / currentTotal) * 100).toFixed(0)
            : 0;

        console.log('✅ [Dashboard Stats] Statistics calculated:', {
            total: currentTotal,
            pending: proposalStatsResult.rows[0]?.pending || 0,
            approved: approved,
            rejected: proposalStatsResult.rows[0]?.rejected || 0,
            newSinceYesterday,
            approvalRate
        });

        res.json({
            success: true,
            stats: {
                proposals: {
                    ...proposalStatsResult.rows[0],
                    newSinceYesterday,
                    dayOverDayChange: parseFloat(dayOverDayChange),
                    approvalRate: parseInt(approvalRate),
                    yesterdayTotal
                },
                users: userStatsResult.rows[0] || { total: 0, students: 0, admins: 0, faculty: 0 },
                recentProposals: recentProposalsResult.rows || [],
                eventTypes: eventTypesResult.rows || [],
            },
        });
    } catch (error) {
        console.error('❌ [Dashboard Stats] Error:', error.message);
        next(error);
    }
});

/**
 * GET /api/admin/stats
 * Admin dashboard statistics endpoint
 */
router.get('/stats', validateToken, validateAdmin, async (req, res) => {
    try {
        console.log('Admin stats endpoint hit by user:', req.user?.id);

        // Get various statistics from the database
        const userStatsResult = await query('SELECT COUNT(*) as total FROM users');
        const proposalStatsResult = await query('SELECT COUNT(*) as total FROM proposals');
        const pendingApprovalsResult = await query('SELECT COUNT(*) as total FROM users WHERE is_approved = FALSE');

        // Get recent activity (last 30 days)
        const recentUsersResult = await query(
            'SELECT COUNT(*) as total FROM users WHERE created_at >= (CURRENT_TIMESTAMP - INTERVAL \'30 days\')'
        );

        // Get approved vs pending users
        const approvedUsersResult = await query('SELECT COUNT(*) as total FROM users WHERE is_approved = TRUE');

        const stats = {
            totalUsers: userStatsResult.rows[0].total,
            totalProposals: proposalStatsResult.rows[0].total,
            pendingApprovals: pendingApprovalsResult.rows[0].total,
            approvedUsers: approvedUsersResult.rows[0].total,
            recentUsers: recentUsersResult.rows[0].total,
            timestamp: new Date().toISOString()
        };

        console.log('Admin stats retrieved successfully:', stats);

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Admin stats error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve admin statistics',
            message: error.message
        });
    }
});

module.exports = router; 