import { api } from '@/lib/api';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();

        // Use axios instance instead of fetch
        const response = await api.post('/api/proposals/search', body);

        return NextResponse.json(response.data);
    } catch (error) {
        console.error('Error in proposals/find:', error);

        // Handle connection errors
        if (!error.response) {
            return NextResponse.json(
                { error: 'Unable to connect to the server. Please check your connection and try again.' },
                { status: 503 }
            );
        }

        // Handle other errors
        return NextResponse.json(
            { error: error.message || 'An error occurred while processing your request' },
            { status: error.response?.status || 500 }
        );
    }
} 