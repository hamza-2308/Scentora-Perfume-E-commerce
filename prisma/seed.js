const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const db = new PrismaClient();

const img = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=85`;

async function main() {
  const pass = await bcrypt.hash('Admin@123', 10);

  // Branches
  const branches = [];
  const branchData = [
    ['Islamabad', 'Blue Area, Islamabad', 'Islamabad', '051-111-222'],
    ['Lahore', 'Gulberg III, Lahore', 'Lahore', '042-333-444'],
    ['Karachi', 'DHA Phase 6, Karachi', 'Karachi', '021-555-666'],
    ['Rawalpindi', 'Saddar, Rawalpindi', 'Rawalpindi', '051-777-888'],
    ['Peshawar', 'University Road, Peshawar', 'Peshawar', '091-999-000'],
    ['Faisalabad', 'D Ground, Faisalabad', 'Faisalabad', '041-123-456'],
  ];
  for (const b of branchData) {
    let branch = await db.branch.findFirst({ where: { name: b[0] } });
    if (!branch) {
      branch = await db.branch.create({
        data: {
          name: b[0],
          address: b[1],
          city: b[2],
          phone: b[3],
          openingHours: '10:00 AM',
          closingHours: '10:00 PM',
          managerName: `${b[0]} Manager`,
        },
      });
    }
    branches.push(branch);
  }

  // Categories
  const cats = [];
  const categoryData = [
    ["Men's Perfumes", 'mens-perfumes'],
    ["Women's Perfumes", 'womens-perfumes'],
    ['Unisex Perfumes', 'unisex-perfumes'],
    ['Oud', 'oud'],
    ['Floral', 'floral'],
    ['Woody', 'woody'],
    ['Fresh', 'fresh'],
    ['Oriental', 'oriental'],
    ['Luxury Collection', 'luxury-collection'],
    ['Gift Sets', 'gift-sets'],
  ];
  for (const c of categoryData) {
    cats.push(
      await db.category.upsert({
        where: { slug: c[1] },
        update: {},
        create: { name: c[0], slug: c[1], description: `Explore our ${c[0]} collection.` },
      })
    );
  }

  // Products
  const products = [
    ['Royal Oud', 'royal-oud', 'https://images.unsplash.com/photo-1594035910387-fea47794261f', 'A rich oud fragrance with warm amber and woods.', 735000 / 245, 10, '100ml', 'MEN', 'Oud', 'Oud, Amber, Sandalwood', 4.8, true, false],
    ['Midnight Rose', 'midnight-rose', 'https://images.unsplash.com/photo-1541643600914-78b084683601', 'Elegant rose, vanilla and soft musk for evening wear.', 3000, 0, '100ml', 'WOMEN', 'Floral', 'Rose, Vanilla, Musk', 4.7, true, false],
    ['Blue Intense', 'blue-intense', 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539', 'Fresh citrus and aquatic notes with a woody finish.', 3000, 5, '100ml', 'MEN', 'Fresh', 'Bergamot, Marine, Cedar', 4.6, true, true],
    ['Velvet Amber', 'velvet-amber', 'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d', 'Smooth amber and vanilla with a luxurious oriental trail.', 4200, 0, '80ml', 'UNISEX', 'Oriental', 'Amber, Vanilla, Tonka', 4.9, false, true],
    ['Santal Noir', 'santal-noir', 'https://images.unsplash.com/photo-1563170351-be82bc888aa4', 'Creamy sandalwood and smoky spices.', 4600, 12, '100ml', 'UNISEX', 'Woody', 'Sandalwood, Pepper, Vetiver', 4.5, false, false],
    ['Bloom Elixir', 'bloom-elixir', 'https://images.unsplash.com/photo-1615634260167-c8cdede054de', 'A luminous floral bouquet designed for everyday elegance.', 3500, 0, '75ml', 'WOMEN', 'Floral', 'Jasmine, Peony, Musk', 4.4, false, true],
    ['Desert Crown', 'desert-crown', 'https://images.unsplash.com/photo-1587017539504-67cfbddac569', 'A bold oriental blend inspired by desert nights.', 5200, 15, '100ml', 'MEN', 'Oriental', 'Saffron, Oud, Leather', 4.9, true, false],
    ['Pure Aura', 'pure-aura', 'https://images.unsplash.com/photo-1523293182086-7651a899d37f', 'Clean musk and fresh citrus for all-day wear.', 2800, 0, '50ml', 'UNISEX', 'Fresh', 'Citrus, White Musk, Neroli', 4.3, false, true],
  ];
  for (const p of products) {
    const cat = p[7] === 'MEN' ? cats.find((c) => c.slug === 'mens-perfumes') : p[7] === 'WOMEN' ? cats.find((c) => c.slug === 'womens-perfumes') : cats.find((c) => c.slug === 'unisex-perfumes');
    await db.product.upsert({
      where: { slug: p[1] },
      update: { imageUrl: p[2] },
      create: {
        name: p[0],
        slug: p[1],
        imageUrl: p[2],
        description: p[3],
        price: p[4],
        discount: p[5],
        size: p[6],
        gender: p[7],
        fragranceType: p[8],
        notes: p[9],
        rating: p[10],
        bestSeller: p[11],
        newArrival: p[12],
        categoryId: cat.id,
      },
    });
  }

  // Inventory
  const all = await db.product.findMany();
  for (const br of branches) {
    for (const pr of all) {
      await db.inventory.upsert({
        where: { productId_branchId: { productId: pr.id, branchId: br.id } },
        update: {},
        create: { productId: pr.id, branchId: br.id, stock: Math.floor(Math.random() * 35) + 5, lowStockThreshold: 5 },
      });
    }
  }

  // Admin user
  await db.user.upsert({
    where: { email: 'admin@scentora.com' },
    update: { passwordHash: pass },
    create: { name: 'Scentora Admin', email: 'admin@scentora.com', passwordHash: pass, role: 'SUPER_ADMIN' },
  });

  // Settings
  await db.setting.upsert({ where: { key: 'brandName' }, update: { value: 'Scentora' }, create: { key: 'brandName', value: 'Scentora' } });
  await db.setting.upsert({ where: { key: 'currency' }, update: { value: 'PKR' }, create: { key: 'currency', value: 'PKR' } });

  console.log('Seeded Scentora. Login: admin@scentora.com / Admin@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());