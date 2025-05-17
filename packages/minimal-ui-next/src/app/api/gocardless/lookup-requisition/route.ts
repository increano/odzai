import { NextRequest, NextResponse } from 'next/server';

/**
 * Look up a requisition ID from a reference ID
 * GET /api/gocardless/lookup-requisition?reference=<reference>
 */
export async function GET(request: NextRequest) {
  try {
    // Extract reference from query parameters
    const reference = request.nextUrl.searchParams.get('reference');
    
    if (!reference) {
      return NextResponse.json(
        { error: 'Reference parameter is required' },
        { status: 400 }
      );
    }
    
    console.log(`Looking up requisition ID for reference: ${reference}`);
    
    // In a real implementation, you would look up the requisition ID in a database
    // For this demo, we'll return a mock response
    // This would be replaced with a real database lookup in production
    
    // Example of how this might work:
    /*
    const db = getDatabase();
    const requisition = await db.collection('requisitions').findOne({ reference });
    if (requisition) {
      return NextResponse.json({
        success: true,
        requisitionId: requisition.id
      });
    }
    */
    
    // For now, extract the timestamp from the reference and create a mock requisition ID
    const timestamp = reference.split('-').pop();
    const mockRequisitionId = `req-${timestamp}-mock`;
    
    console.log(`Created mock requisition ID: ${mockRequisitionId}`);
    
    // Return mock data - in a real implementation this would come from a database
    return NextResponse.json({
      success: true,
      requisitionId: mockRequisitionId,
      // Include the original reference for verification
      reference: reference
    });
  } catch (error) {
    console.error('Error looking up requisition ID:', error);
    return NextResponse.json(
      { error: 'Failed to look up requisition ID' },
      { status: 500 }
    );
  }
} 