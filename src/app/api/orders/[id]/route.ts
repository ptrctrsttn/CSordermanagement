import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== Starting Order Update Process ===');
    console.log('Order ID:', params.id);
    const { id } = params;
    const body = await request.json();
    console.log('Update Request Body:', JSON.stringify(body, null, 2));
    
    // First, get the existing order to preserve Shopify data
    console.log('Fetching existing order...');
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        driver: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!existingOrder) {
      console.error('Order not found:', id);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    console.log('Existing order found:', {
      id: existingOrder.id,
      orderNumber: existingOrder.orderNumber,
      status: existingOrder.status,
      itemCount: existingOrder.items.length,
      deliveryTime: existingOrder.deliveryTime
    });

    const { 
      status, 
      travelTime, 
      isManualTravelTime,
      driverId, 
      deliveryTime, 
      address,
      note,
      items 
    } = body;

    console.log('Preparing order update with fields:', {
      status,
      travelTime,
      isManualTravelTime,
      driverId,
      deliveryTime,
      hasAddress: !!address,
      hasNote: !!note,
      itemCount: items?.length
    });

    // Update order while preserving required fields
    console.log('Updating order in database...');
    const order = await prisma.order.update({
      where: { id },
      data: { 
        // Preserve Shopify data
        shopifyId: existingOrder.shopifyId,
        orderNumber: existingOrder.orderNumber,
        customerEmail: existingOrder.customerEmail,
        totalAmount: existingOrder.totalAmount,
        orderDate: existingOrder.orderDate,
        // Update editable fields
        ...(status && { status }),
        ...(travelTime !== undefined && { travelTime }),
        ...(isManualTravelTime !== undefined && { isManualTravelTime }),
        ...(driverId && { driverId }),
        ...(deliveryTime !== undefined && { deliveryTime: deliveryTime ? new Date(deliveryTime) : null }),
        ...(address && { address }),
        ...(note !== undefined && { note })
      },
      include: {
        driver: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    console.log('Order updated successfully:', {
      id: order.id,
      status: order.status,
      itemCount: order.items.length,
      deliveryTime: order.deliveryTime,
      updatedAt: order.updatedAt
    });

    // If items are provided, update them
    if (items) {
      console.log('Processing items update...');
      console.log('Items to update:', JSON.stringify(items, null, 2));
      
      // First, remove all existing items
      console.log('Removing existing items...');
      await prisma.orderItem.deleteMany({
        where: { orderId: id }
      });
      console.log('Existing items removed');

      // Process each item
      for (const item of items) {
        console.log('Processing item:', {
          sku: item.product.sku,
          name: item.product.name,
          quantity: item.quantity
        });

        // Find the product by SKU in the ProductList first
        const productListItem = await prisma.productList.findUnique({
          where: { variantSku: item.product.sku }
        });
        console.log('ProductList lookup result:', productListItem ? 'Found' : 'Not found');

        // Try to find existing product by SKU
        let product = await prisma.product.findFirst({
          where: { sku: item.product.sku }
        });
        console.log('Existing product lookup result:', product ? 'Found' : 'Not found');

        // If product doesn't exist, create it
        if (!product) {
          console.log('Creating new product...');
          product = await prisma.product.create({
            data: {
              name: item.product.name,
              sku: item.product.sku,
              price: item.price || 0,
              description: productListItem?.handle || item.product.name,
            }
          });
          console.log('New product created:', product.id);
        }

        // Create the order item
        console.log('Creating order item...');
        await prisma.orderItem.create({
          data: {
            orderId: id,
            productId: product.id,
            quantity: item.quantity,
            price: item.price || 0
          }
        });
        console.log('Order item created');
      }

      // Fetch the updated order with new items
      console.log('Fetching final order state...');
      const updatedOrder = await prisma.order.findUnique({
        where: { id },
        include: {
          driver: true,
          items: {
            include: {
              product: true
            }
          }
        }
      });

      console.log('=== Order Update Complete ===');
      console.log('Final order state:', {
        id: updatedOrder?.id,
        status: updatedOrder?.status,
        itemCount: updatedOrder?.items.length,
        deliveryTime: updatedOrder?.deliveryTime,
        updatedAt: updatedOrder?.updatedAt
      });
      return NextResponse.json(updatedOrder);
    }

    console.log('=== Order Update Complete (No Items Update) ===');
    return NextResponse.json(order);
  } catch (error) {
    console.error('=== Order Update Error ===');
    console.error('Error details:', error);
    let errorMessage = 'Failed to update order';
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Also add PUT method that calls the same handler
export const PUT = PATCH; 