const { MongoClient } = require('mongodb');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// MongoDB URI
const mongoUri = "mongodb+srv://alexestuardo642_db_user:aJAQr5Szf5nuBHMI@cluster0.ewhwqsh.mongodb.net/perflo-plast?retryWrites=true&w=majority&appName=Cluster0";

async function migrate() {
  const client = new MongoClient(mongoUri);
  
  try {
    console.log("🚀 Starting Migration...");
    await client.connect();
    const db = client.db('perflo-plast');
    
    // 1. Create Default Admin if not exists
    const adminEmail = "admin@perfloplast.com";
    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
    
    if (!existingAdmin) {
      console.log("👤 Creating default admin...");
      const hashedPassword = await bcrypt.hash("perflo2026", 10);
      await prisma.user.create({
        data: {
          name: "Administrador",
          email: adminEmail,
          password: hashedPassword,
          role: 'ADMIN'
        }
      });
    }

    // 2. Migrate Products
    console.log("📦 Migrating products...");
    const mongoProducts = await db.collection('products').find({}).toArray();
    
    for (const mp of mongoProducts) {
      console.log(`- Migrating: ${mp.name}`);
      
      // Upsert product
      const product = await prisma.product.upsert({
        where: { sku: mp.sku || mp._id.toString() },
        update: {
          name: mp.name,
          price: parseFloat(mp.price) || 0,
          description: mp.description || "",
          imageUrl: mp.image || null,
          maskUrl: mp.maskImage || null,
          baseHue: mp.baseHue || 0,
          imageTransform: mp.imageTransform || null,
          lumina: mp.lumina || null,
          showInCatalog: true,
        },
        create: {
          sku: mp.sku || mp._id.toString(),
          name: mp.name,
          salePrice: parseFloat(mp.price) || 0,
          description: mp.description || "",
          imageUrl: mp.image || null,
          maskUrl: mp.maskImage || null,
          baseHue: mp.baseHue || 0,
          imageTransform: mp.imageTransform || null,
          lumina: mp.lumina || null,
          showInCatalog: true,
        }
      });

      // Migrate Variants (types)
      if (mp.types && Array.isArray(mp.types)) {
        for (const variant of mp.types) {
          await prisma.productVariant.create({
            data: {
              productId: product.id,
              name: variant.name || "Sin nombre",
              price: parseFloat(variant.price) || null,
              imageUrl: variant.image || null,
              maskUrl: variant.maskImage || null,
              imageTransform: variant.imageTransform || null,
              lumina: variant.lumina || null,
              description: variant.description || "",
            }
          });
        }
      }
    }

    console.log("✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await client.close();
    await prisma.$disconnect();
  }
}

migrate();
