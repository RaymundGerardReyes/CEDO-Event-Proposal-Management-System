const express = require('express');
const router = express.Router();

// Mock user data - this simulates real database data
const mockUsers = [
    {
        id: 1,
        name: 'System Administrator',
        email: 'admin@cedo.com',
        role: 'head_admin',
        organization: 'CEDO System',
        organization_type: 'internal',
        is_approved: 1,
        created_at: '2024-01-01T00:00:00.000Z',
        last_login: '2024-07-19T04:30:00.000Z',
        avatar: null,
        phone_number: null
    },
    {
        id: 2,
        name: 'John Manager',
        email: 'manager@cedo.com',
        role: 'manager',
        organization: 'CEDO Management',
        organization_type: 'internal',
        is_approved: 1,
        created_at: '2024-01-15T00:00:00.000Z',
        last_login: '2024-07-18T15:30:00.000Z',
        avatar: null,
        phone_number: null
    },
    {
        id: 3,
        name: 'Alice Student',
        email: 'student@cedo.com',
        role: 'student',
        organization: 'CEDO University',
        organization_type: 'school-based',
        is_approved: 1,
        created_at: '2024-02-01T00:00:00.000Z',
        last_login: '2024-07-17T10:15:00.000Z',
        avatar: null,
        phone_number: null
    },
    {
        id: 4,
        name: 'Bob Partner',
        email: 'partner@cedo.com',
        role: 'partner',
        organization: 'CEDO Partners',
        organization_type: 'external',
        is_approved: 1,
        created_at: '2024-02-15T00:00:00.000Z',
        last_login: '2024-07-16T14:20:00.000Z',
        avatar: null,
        phone_number: null
    },
    {
        id: 5,
        name: 'Carol Reviewer',
        email: 'reviewer@cedo.com',
        role: 'reviewer',
        organization: 'CEDO Review',
        organization_type: 'internal',
        is_approved: 1,
        created_at: '2024-03-01T00:00:00.000Z',
        last_login: '2024-07-15T09:45:00.000Z',
        avatar: null,
        phone_number: null
    },
    {
        id: 6,
        name: 'David Faculty',
        email: 'faculty@cedo.com',
        role: 'faculty',
        organization: 'CEDO Faculty',
        organization_type: 'school-based',
        is_approved: 1,
        created_at: '2024-03-15T00:00:00.000Z',
        last_login: '2024-07-14T11:30:00.000Z',
        avatar: null,
        phone_number: null
    },
    {
        id: 7,
        name: 'Eva Coordinator',
        email: 'coordinator@cedo.com',
        role: 'coordinator',
        organization: 'CEDO Coordination',
        organization_type: 'internal',
        is_approved: 1,
        created_at: '2024-04-01T00:00:00.000Z',
        last_login: '2024-07-13T16:45:00.000Z',
        avatar: null,
        phone_number: null
    }
];

// In-memory storage for dynamic operations
let users = [...mockUsers];
let nextId = users.length + 1;

/**
 * @route GET /api/admin/users
 * @desc Get all users for admin management
 * @access Private (Admin)
 */
router.get('/', async (req, res) => {
    try {
        const { search, role, sortBy, sortOrder } = req.query;

        let filteredUsers = [...users];

        // Apply search filter
        if (search) {
            const searchLower = search.toLowerCase();
            filteredUsers = filteredUsers.filter(user =>
                user.name.toLowerCase().includes(searchLower) ||
                user.email.toLowerCase().includes(searchLower) ||
                (user.organization && user.organization.toLowerCase().includes(searchLower))
            );
        }

        // Apply role filter
        if (role) {
            filteredUsers = filteredUsers.filter(user => user.role === role);
        }

        // Apply sorting
        if (sortBy) {
            filteredUsers.sort((a, b) => {
                const aVal = a[sortBy] || '';
                const bVal = b[sortBy] || '';

                if (sortOrder === 'desc') {
                    return bVal.toString().localeCompare(aVal.toString());
                }
                return aVal.toString().localeCompare(bVal.toString());
            });
        }

        res.json({
            success: true,
            data: filteredUsers
        });

    } catch (error) {
        console.error('Admin users error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve users',
            message: error.message
        });
    }
});

/**
 * @route POST /api/admin/users
 * @desc Create a new user (admin only)
 * @access Private (Admin)
 */
router.post('/', async (req, res) => {
    try {
        const { name, email, role, organization, organization_type } = req.body;

        // Validate required fields
        if (!name || !email || !role) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                message: 'Name, email, and role are required'
            });
        }

        // Check if user already exists
        const existingUser = users.find(user => user.email.toLowerCase() === email.toLowerCase());
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'User already exists',
                message: 'A user with this email already exists'
            });
        }

        // Create new user
        const newUser = {
            id: nextId++,
            name,
            email,
            role,
            organization: organization || null,
            organization_type: organization_type || null,
            is_approved: 1,
            created_at: new Date().toISOString(),
            last_login: null,
            avatar: null,
            phone_number: null
        };

        users.push(newUser);

        console.log('Admin created new user:', newUser);

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: newUser
        });

    } catch (error) {
        console.error('Admin create user error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to create user',
            message: error.message
        });
    }
});

/**
 * @route PUT /api/admin/users/:id
 * @desc Update a user (admin only)
 * @access Private (Admin)
 */
router.put('/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { name, email, role, organization, organization_type, is_approved } = req.body;

        // Find user
        const userIndex = users.findIndex(user => user.id === userId);
        if (userIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
                message: 'User does not exist'
            });
        }

        // Check if email is already taken by another user
        const emailExists = users.find(user =>
            user.id !== userId && user.email.toLowerCase() === email.toLowerCase()
        );
        if (emailExists) {
            return res.status(409).json({
                success: false,
                error: 'Email already exists',
                message: 'This email is already taken by another user'
            });
        }

        // Update user
        users[userIndex] = {
            ...users[userIndex],
            name,
            email,
            role,
            organization: organization || null,
            organization_type: organization_type || null,
            is_approved: is_approved !== undefined ? is_approved : users[userIndex].is_approved
        };

        console.log('Admin updated user:', users[userIndex]);

        res.json({
            success: true,
            message: 'User updated successfully',
            data: users[userIndex]
        });

    } catch (error) {
        console.error('Admin update user error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to update user',
            message: error.message
        });
    }
});

/**
 * @route DELETE /api/admin/users/:id
 * @desc Delete a user (admin only)
 * @access Private (Admin)
 */
router.delete('/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        // Find user
        const userIndex = users.findIndex(user => user.id === userId);
        if (userIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
                message: 'User does not exist'
            });
        }

        // Remove user
        const deletedUser = users.splice(userIndex, 1)[0];

        console.log('Admin deleted user:', deletedUser);

        res.json({
            success: true,
            message: 'User deleted successfully',
            data: { id: userId }
        });

    } catch (error) {
        console.error('Admin delete user error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to delete user',
            message: error.message
        });
    }
});

/**
 * @route GET /api/admin/users/stats
 * @desc Get user statistics
 * @access Private (Admin)
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = {
            total: users.length,
            byRole: {},
            byOrganization: {},
            approved: users.filter(user => user.is_approved).length,
            pending: users.filter(user => !user.is_approved).length,
            recent: users.filter(user => {
                const createdDate = new Date(user.created_at);
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return createdDate > thirtyDaysAgo;
            }).length
        };

        // Count by role
        users.forEach(user => {
            stats.byRole[user.role] = (stats.byRole[user.role] || 0) + 1;
        });

        // Count by organization
        users.forEach(user => {
            const org = user.organization || 'Unknown';
            stats.byOrganization[org] = (stats.byOrganization[org] || 0) + 1;
        });

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Admin users stats error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve user statistics',
            message: error.message
        });
    }
});

module.exports = router; 