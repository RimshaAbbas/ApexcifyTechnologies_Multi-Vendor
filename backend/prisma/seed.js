// prisma/seed.js — Demo data with real Unsplash images
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const PRODUCTS = [
  {
    title: 'Wireless Pro Headphones',
    category: 'Electronics',
    price: 129.99,
    stockQty: 45,
    description: 'Premium noise-cancelling wireless headphones with 40hr battery life.',
    imageUrls: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80'],
  },
  {
    title: 'Mechanical Gaming Keyboard',
    category: 'Electronics',
    price: 89.99,
    stockQty: 30,
    description: 'RGB backlit mechanical keyboard with Cherry MX switches.',
    imageUrls: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80'],
  },
  {
    title: 'Ultra-Wide 4K Monitor',
    category: 'Electronics',
    price: 549.00,
    stockQty: 12,
    description: '34-inch curved ultrawide QHD gaming monitor, 144Hz.',
    imageUrls: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&q=80'],
  },
  {
    title: 'Minimalist Leather Watch',
    category: 'Clothing',
    price: 199.00,
    stockQty: 20,
    description: 'Handcrafted Italian leather strap with sapphire crystal glass.',
    imageUrls: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80'],
  },
  {
    title: 'Urban Streetwear Hoodie',
    category: 'Clothing',
    price: 74.99,
    stockQty: 60,
    description: 'Premium cotton blend oversized hoodie in midnight black.',
    imageUrls: ['https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80'],
  },
  {
    title: 'Air Max Running Shoes',
    category: 'Sports',
    price: 119.00,
    stockQty: 35,
    description: 'Lightweight responsive cushioning for road running.',
    imageUrls: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80'],
  },
  {
    title: 'Yoga & Fitness Mat',
    category: 'Sports',
    price: 39.99,
    stockQty: 80,
    description: 'Non-slip eco-friendly TPE mat, 6mm thick.',
    imageUrls: ['https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?w=600&q=80'],
  },
  {
    title: 'The Art of Clean Code',
    category: 'Books',
    price: 34.99,
    stockQty: 100,
    description: 'A practical guide to writing maintainable, scalable software.',
    imageUrls: ['https://images.unsplash.com/photo-1532012197267-da84d127e765?w=600&q=80'],
  },
  {
    title: 'Smart Home LED Strip',
    category: 'Home',
    price: 29.99,
    stockQty: 150,
    description: 'WiFi RGB LED strip, works with Alexa & Google Home.',
    imageUrls: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'],
  },
  {
    title: 'Luxury Skincare Set',
    category: 'Beauty',
    price: 89.00,
    stockQty: 25,
    description: 'Complete 5-step Korean skincare routine with hyaluronic acid.',
    imageUrls: ['https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&q=80'],
  },
  {
    title: 'Portable SSD 1TB',
    category: 'Electronics',
    price: 99.00,
    stockQty: 40,
    description: 'USB-C NVMe portable SSD, 1000MB/s read speed.',
    imageUrls: ['https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&q=80'],
  },
  {
    title: 'Stainless Steel Water Bottle',
    category: 'Sports',
    price: 24.99,
    stockQty: 200,
    description: 'Double-wall vacuum insulated, keeps cold 24h / hot 12h.',
    imageUrls: ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&q=80'],
  },
];

async function main() {
  console.log('🌱 Seeding database…');

  // Admin
  const adminHash = await bcrypt.hash('Admin@1234', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@multivendor.com' },
    update: {},
    create: { name: 'Admin', email: 'admin@multivendor.com', passwordHash: adminHash, role: 'ADMIN' },
  });
  console.log('✅ Admin:', admin.email);

  // Vendor user
  const vendorHash = await bcrypt.hash('Vendor@1234', 12);
  const vendorUser = await prisma.user.upsert({
    where: { email: 'vendor@multivendor.com' },
    update: {},
    create: { name: 'Tech Store', email: 'vendor@multivendor.com', passwordHash: vendorHash, role: 'VENDOR' },
  });

  // Vendor profile
  const vendor = await prisma.vendor.upsert({
    where: { userId: vendorUser.id },
    update: {},
    create: {
      userId: vendorUser.id,
      storeName: 'TechNova Store',
      description: 'Premium tech and lifestyle products.',
      status: 'APPROVED',
    },
  });
  console.log('✅ Vendor:', vendor.storeName);

  // Customer
  const custHash = await bcrypt.hash('Customer@1234', 12);
  await prisma.user.upsert({
    where: { email: 'customer@multivendor.com' },
    update: {},
    create: { name: 'Demo Customer', email: 'customer@multivendor.com', passwordHash: custHash, role: 'CUSTOMER' },
  });
  console.log('✅ Customer: customer@multivendor.com');

  const EXTRA_PRODUCTS = [
    {
      title: 'Professional DSLR Camera',
      category: 'Electronics',
      price: 899.00,
      stockQty: 8,
      description: '24MP full-frame sensor, 4K video, dual card slots.',
      imageUrls: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&q=80'],
    },
    {
      title: 'Noise Cancelling Earbuds',
      category: 'Electronics',
      price: 149.99,
      stockQty: 60,
      description: 'True wireless ANC earbuds with 30hr total battery life.',
      imageUrls: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80'],
    },
    {
      title: 'Smart Watch Pro',
      category: 'Electronics',
      price: 299.00,
      stockQty: 22,
      description: 'AMOLED display, GPS, heart rate, sleep tracking.',
      imageUrls: ['https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&q=80'],
    },
    {
      title: 'Gaming Chair RGB',
      category: 'Home',
      price: 349.00,
      stockQty: 15,
      description: 'Ergonomic gaming chair with lumbar support and RGB underglow.',
      imageUrls: ['https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=600&q=80'],
    },
    {
      title: 'Vintage Leather Backpack',
      category: 'Clothing',
      price: 119.00,
      stockQty: 30,
      description: 'Genuine full-grain leather backpack with laptop sleeve.',
      imageUrls: ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80'],
    },
    {
      title: 'Wireless Charging Pad',
      category: 'Electronics',
      price: 39.99,
      stockQty: 90,
      description: '15W fast wireless charger compatible with all Qi devices.',
      imageUrls: ['https://images.unsplash.com/photo-1586816001966-79b736744398?w=600&q=80'],
    },
    {
      title: 'Premium Coffee Maker',
      category: 'Home',
      price: 189.00,
      stockQty: 18,
      description: 'Programmable 12-cup coffee maker with thermal carafe.',
      imageUrls: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80'],
    },
    {
      title: 'Running GPS Watch',
      category: 'Sports',
      price: 249.00,
      stockQty: 25,
      description: 'Multisport GPS watch with advanced training metrics.',
      imageUrls: ['https://images.unsplash.com/photo-1553545204-4f7d339aa06a?w=600&q=80'],
    },
    {
      title: 'Silk Evening Dress',
      category: 'Clothing',
      price: 159.00,
      stockQty: 20,
      description: 'Flowing silk midi dress, available in 6 colours.',
      imageUrls: ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80'],
    },
    {
      title: 'Scented Candle Set',
      category: 'Home',
      price: 44.99,
      stockQty: 75,
      description: 'Set of 3 hand-poured soy wax candles — lavender, vanilla, cedar.',
      imageUrls: ['https://images.unsplash.com/photo-1603905861408-c35b60e5d9e2?w=600&q=80'],
    },
    {
      title: '4K Action Camera',
      category: 'Electronics',
      price: 199.00,
      stockQty: 35,
      description: 'Waterproof 4K/60fps action cam with HyperSmooth stabilisation.',
      imageUrls: ['https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&q=80'],
    },
    {
      title: 'Bamboo Desk Organiser',
      category: 'Home',
      price: 34.99,
      stockQty: 55,
      description: 'Eco-friendly bamboo desktop organiser with 6 compartments.',
      imageUrls: ['https://images.unsplash.com/photo-1541558869434-2840d308329a?w=600&q=80'],
    },
    {
      title: 'Protein Powder 2kg',
      category: 'Sports',
      price: 54.99,
      stockQty: 100,
      description: 'Whey isolate protein, 27g protein per serving, chocolate flavour.',
      imageUrls: ['https://images.unsplash.com/photo-1579722820308-d74e571900a9?w=600&q=80'],
    },
    {
      title: 'Minimalist Desk Lamp',
      category: 'Home',
      price: 59.99,
      stockQty: 40,
      description: 'Touch-dimming LED desk lamp with USB charging port.',
      imageUrls: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&q=80'],
    },
    {
      title: 'Anti-Aging Serum',
      category: 'Beauty',
      price: 69.00,
      stockQty: 45,
      description: 'Vitamin C & retinol serum for brighter, firmer skin.',
      imageUrls: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80'],
    },
    {
      title: 'Hardcover Planner 2026',
      category: 'Books',
      price: 22.99,
      stockQty: 120,
      description: 'Weekly & monthly undated hardcover planner with habit tracker.',
      imageUrls: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80'],
    },
    {
      title: 'Foldable Treadmill',
      category: 'Sports',
      price: 699.00,
      stockQty: 6,
      description: 'Compact foldable treadmill, max 14km/h, Bluetooth speaker.',
      imageUrls: ['https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=600&q=80'],
    },
    {
      title: 'Titanium Sunglasses',
      category: 'Clothing',
      price: 189.00,
      stockQty: 28,
      description: 'Polarised titanium frame sunglasses, UV400 protection.',
      imageUrls: ['https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&q=80'],
    },
  ];

  // Products
  for (const p of [...PRODUCTS, ...EXTRA_PRODUCTS]) {
    await prisma.product.create({
      data: { ...p, vendorId: vendor.id },
    });
  }
  console.log(`✅ Created ${PRODUCTS.length + EXTRA_PRODUCTS.length} products`);

  console.log('\n🎉 Seed complete!\n');
  console.log('Demo accounts:');
  console.log('  Admin    → admin@multivendor.com    / Admin@1234');
  console.log('  Vendor   → vendor@multivendor.com   / Vendor@1234');
  console.log('  Customer → customer@multivendor.com / Customer@1234');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
