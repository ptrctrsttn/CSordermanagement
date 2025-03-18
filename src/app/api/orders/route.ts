import { NextResponse } from 'next/server';
import { PrismaClient, Order } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// File path for persisting orders
const ORDERS_FILE = path.join(process.cwd(), 'orders.json');

interface SavedOrder extends Order {
  isDispatched?: boolean;
  dispatchTime?: string | null;
}

// Function to load saved orders with dispatch status
const loadSavedOrders = (): SavedOrder[] => {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const data = fs.readFileSync(ORDERS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading saved orders:', error);
  }
  return [];
};

// Function to save orders to file
const saveOrders = (orders: SavedOrder[]) => {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
    console.log('Orders saved to file');
  } catch (error) {
    console.error('Error saving orders:', error);
  }
};

export async function GET() {
  try {
    console.log('=== Starting GET /api/orders ===');
    
    // Load saved orders first to get dispatch states
    const savedOrders = loadSavedOrders();
    console.log(`Loaded ${savedOrders.length} saved orders with dispatch states`);
    
    console.log('Starting to fetch orders from Shopify...');
    const shopifyOrders = await fetchShopifyOrders();
    console.log(`Successfully fetched ${shopifyOrders.length} orders from Shopify`);
    
    // Process and store new orders
    for (const shopifyOrder of shopifyOrders) {
      try {
        console.log(`\n=== Processing Order ${shopifyOrder.name} ===`);
        await processShopifyOrder(shopifyOrder);
      } catch (orderError) {
        console.error(`Error processing order ${shopifyOrder.name}:`, orderError);
        // Continue with next order even if one fails
      }
    }

    console.log('\n=== Fetching all orders from database ===');
    // Return all orders from our database
    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: {
            product: true,
          },
        },
        driver: true,
      },
      orderBy: {
        orderDate: 'desc',
      },
    });

    if (!orders) {
      return NextResponse.json({ error: 'No orders found' }, { status: 404 });
    }

    // Merge dispatch status from saved orders
    const mergedOrders = orders.map(order => {
      const savedOrder = savedOrders.find(saved => saved.id === order.id);
      return {
        ...order,
        // Preserve dispatch state from saved orders, defaulting to false if not found
        isDispatched: savedOrder?.isDispatched ?? false,
        // Preserve dispatch time if it exists
        dispatchTime: savedOrder?.dispatchTime || null
      };
    });

    // Save the merged orders back to file to ensure consistency
    saveOrders(mergedOrders);

    console.log(`Successfully retrieved ${mergedOrders.length} orders from database`);
    return NextResponse.json(mergedOrders);
  } catch (error) {
    console.error('\n=== Error in GET /api/orders ===');
    console.error('Error details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

async function fetchShopifyOrders() {
  const shopName = process.env.SHOPIFY_SHOP_NAME;
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
  const apiVersion = process.env.SHOPIFY_API_VERSION;

  console.log('\n=== Fetching Shopify Orders ===');
  console.log(`Shop: ${shopName}`);
  console.log(`API Version: ${apiVersion}`);
  
  const response = await fetch(
    `https://${shopName}/admin/api/${apiVersion}/orders.json`,
    {
      headers: {
        'X-Shopify-Access-Token': accessToken!,
      },
    }
  );

  if (!response.ok) {
    console.error('Shopify API error:', {
      status: response.status,
      statusText: response.statusText
    });
    throw new Error(`Failed to fetch Shopify orders: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log(`Successfully fetched ${data.orders.length} orders from Shopify`);
  console.log('=== End of Shopify fetch ===\n');
  return data.orders;
}

async function processShopifyOrder(shopifyOrder: any) {
  console.log(`\n=== Processing Order ${shopifyOrder.name} ===`);
  console.log(`Checking if order already exists...`);
  
  // Check if order already exists
  const existingOrder = await prisma.order.findUnique({
    where: {
      shopifyId: shopifyOrder.id.toString(),
    },
  });

  if (existingOrder) {
    console.log(`Order ${shopifyOrder.name} already exists, skipping...`);
    return;
  }

  // Extract delivery attributes from note attributes
  const deliveryAttributes = shopifyOrder.note_attributes?.find(
    (attr: any) => attr.name === 'Delivery Attributes'
  );
  
  let deliveryTime = null;
  let deliveryDate = null;
  let phoneNumber = null;

  // First try to find delivery info and phone number in the order notes as it's the most reliable source
  if (shopifyOrder.note) {
    console.log('Checking order notes for delivery info and phone:', shopifyOrder.note);
    try {
      // Extract delivery time from notes using regex
      const timeMatch = shopifyOrder.note.match(/Delivery Time: ([0-9:]+ [AP]M)/);
      const dateMatch = shopifyOrder.note.match(/Delivery Date: ([A-Za-z]+ [A-Za-z]+ \d+)/);
      const phoneMatch = shopifyOrder.note.match(/Phone:\s*([^\n|]+)/);
      
      if (timeMatch) {
        deliveryTime = timeMatch[1];
        console.log('Found delivery time in notes:', deliveryTime);
      }
      if (dateMatch) {
        deliveryDate = dateMatch[1];
        console.log('Found delivery date in notes:', deliveryDate);
      }
      if (phoneMatch) {
        phoneNumber = phoneMatch[1].trim();
        console.log('Found phone number in notes:', phoneNumber);
      }
    } catch (e) {
      console.error('Error parsing order notes:', e);
    }
  }

  // If not found in notes, try delivery attributes as fallback
  if ((!deliveryTime || !deliveryDate || !phoneNumber) && deliveryAttributes) {
    try {
      console.log('Raw delivery attributes:', deliveryAttributes.value);
      const attributes = JSON.parse(deliveryAttributes.value);
      console.log('Parsed delivery attributes:', attributes);
      
      // Extract delivery time and date
      if (!deliveryTime) deliveryTime = attributes.delivery_time;
      if (!deliveryDate) deliveryDate = attributes.delivery_date;
      if (!phoneNumber) phoneNumber = attributes.phone_number;
      
      console.log('Extracted delivery info from attributes:', { deliveryTime, deliveryDate, phoneNumber });
    } catch (e) {
      console.error('Error parsing delivery attributes:', e);
      console.error('Raw value:', deliveryAttributes.value);
    }
  }

  // If still no delivery time, set a default time of 2 hours from order creation
  if (!deliveryTime || !deliveryDate) {
    const orderDate = new Date(shopifyOrder.created_at);
    const defaultDeliveryTime = new Date(orderDate.getTime() + (2 * 60 * 60 * 1000)); // 2 hours from order creation
    deliveryTime = defaultDeliveryTime.toLocaleTimeString('en-US', { hour12: false });
    deliveryDate = defaultDeliveryTime.toISOString().split('T')[0];
    console.log('Using default delivery time:', { deliveryTime, deliveryDate });
  }

  // Only use other phone number sources if not found in notes or attributes
  if (!phoneNumber) {
    phoneNumber = shopifyOrder.phone || 
                  shopifyOrder.shipping_address?.phone ||
                  shopifyOrder.billing_address?.phone;
    console.log('Using fallback phone number:', phoneNumber);
  }

  if (!phoneNumber) {
    console.log('Warning: No phone number found for order:', shopifyOrder.name);
  }

  console.log(`\nProcessing ${shopifyOrder.line_items.length} line items:`);
  // First, create or update products
  const productPromises = shopifyOrder.line_items.map(async (item: any, index: number) => {
    console.log(`\nProcessing line item ${index + 1}:`);
    console.log(`Title: ${item.title}`);
    console.log(`Price: ${item.price}`);
    console.log(`Quantity: ${item.quantity}`);
    
    try {
      // First try to find existing product by name
      console.log(`Looking for existing product with name: ${item.title}`);
      const existingProduct = await prisma.product.findFirst({
        where: {
          name: item.title,
        },
      });

      if (existingProduct) {
        console.log(`Found existing product: ${item.title}`);
        console.log(`Updating product with new price: ${item.price}`);
        // Update existing product
        return prisma.product.update({
          where: { id: existingProduct.id },
          data: {
            price: parseFloat(item.price),
            description: item.variant_title,
            sku: item.sku || null,
          },
        });
      } else {
        console.log(`Creating new product: ${item.title}`);
        // Create new product
        return prisma.product.create({
          data: {
            name: item.title,
            price: parseFloat(item.price),
            description: item.variant_title,
            sku: item.sku || null,
          },
        });
      }
    } catch (productError) {
      console.error(`Error processing product ${item.title}:`, productError);
      throw productError;
    }
  });

  console.log('\nWaiting for all products to be processed...');
  const products = await Promise.all(productPromises);
  console.log(`Successfully processed ${products.length} products`);

  console.log('\nCreating order with processed products...');
  try {
    // Parse the delivery time
    const [hours, minutes, period] = deliveryTime.match(/(\d+):(\d+) ([AP]M)/).slice(1);
    const hour = parseInt(hours);
    const minute = parseInt(minutes);
    const isPM = period === 'PM';
    
    let hour24 = hour;
    if (isPM && hour !== 12) hour24 += 12;
    if (!isPM && hour === 12) hour24 = 0;

    // Parse the delivery date
    const [dayName, monthName, day] = deliveryDate.split(' ');
    const monthMap: { [key: string]: number } = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };

    // Get the year from the order creation date
    const orderDate = new Date(shopifyOrder.created_at);
    const year = orderDate.getFullYear();

    // Create the delivery time date
    const fullDeliveryTime = new Date(year, monthMap[monthName], parseInt(day), hour24, minute);
    
    console.log('Creating order with delivery time:', fullDeliveryTime);

    // Then create the order with references to the products
    await prisma.order.create({
      data: {
        shopifyId: shopifyOrder.id.toString(),
        orderNumber: shopifyOrder.name,
        customerName: `${shopifyOrder.shipping_address?.first_name || ''} ${shopifyOrder.shipping_address?.last_name || ''}`.trim(),
        customerEmail: shopifyOrder.email,
        phone: phoneNumber,
        address: shopifyOrder.shipping_address ? JSON.stringify(shopifyOrder.shipping_address) : null,
        status: 'PENDING',
        orderDate: new Date(shopifyOrder.created_at),
        deliveryTime: fullDeliveryTime,
        totalAmount: parseFloat(shopifyOrder.total_price),
        note: shopifyOrder.note || null,
        items: {
          create: shopifyOrder.line_items.map((item: any, index: number) => ({
            productId: products[index].id,
            quantity: item.quantity,
            price: parseFloat(item.price),
          })),
        },
      },
    });
    console.log(`Successfully created order: ${shopifyOrder.name}`);
  } catch (orderError) {
    console.error(`Error creating order ${shopifyOrder.name}:`, orderError);
    throw orderError;
  }
  console.log('=== End of order processing ===\n');
} 