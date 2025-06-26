// Health check endpoint for Docker
export async function GET() {
    return Response.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'CEDO Frontend API'
    });
} 