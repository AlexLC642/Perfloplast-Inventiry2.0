const { MongoClient } = require('mongodb');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// MongoDB URI
const mongoUri = "mongodb+srv://alexestuardo642_db_user:aJAQr5Szf5nuBHMI@cluster0.ewhwqsh.mongodb.net/perflo-plast?retryWrites=true&w=majority&appName=Cluster0";

async function migrate() {
  const mongoClient = new MongoClient(mongoUri);
  const mysqlClient = await mysql.createConnection({
    host: 'localhost',
    user: 'perfloplast_user',
    password: 'perfloplast_password',
    database: 'perfloplast_inventory'
  });
  
  try {
    console.log("🚀 Starting Migration (Native MySQL)...");
    await mongoClient.connect();
    const db = mongoClient.db('perflo-plast');
    
    // 1. Ensure Roles exist
    console.log("🔑 Checking roles...");
    const [roles] = await mysqlClient.execute('SELECT id FROM Role WHERE name = ?', ['ADMIN']);
    let adminRoleId;
    if (roles.length === 0) {
      const [result] = await mysqlClient.execute('INSERT INTO Role (name, description) VALUES (?, ?)', ['ADMIN', 'Administrador del sistema']);
      adminRoleId = result.insertId;
    } else {
      adminRoleId = roles[0].id;
    }

    // 2. Create Default Admin if not exists
    const adminEmail = "admin@perfloplast.com";
    const [users] = await mysqlClient.execute('SELECT id FROM User WHERE email = ?', [adminEmail]);
    
    if (users.length === 0) {
      console.log("👤 Creating default admin...");
      const hashedPassword = await bcrypt.hash("perflo2026", 10);
      await mysqlClient.execute(
        'INSERT INTO User (name, email, password, roleId, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
        ["Administrador", adminEmail, hashedPassword, adminRoleId, 1]
      );
    }

    // 3. Migrate Products
    console.log("📦 Migrating products...");
    const mongoProducts = await db.collection('products').find({}).toArray();
    
    for (const mp of mongoProducts) {
      console.log(`- Migrating: ${mp.name}`);
      const sku = mp.sku || mp._id.toString();
      
      // Upsert product
      const [existingProducts] = await mysqlClient.execute('SELECT id FROM Product WHERE sku = ?', [sku]);
      let productId;
      
      const salePrice = parseFloat(mp.price) || 0;
      const description = mp.description || "";
      const imageUrl = mp.image || null;
      const maskUrl = mp.maskImage || null;
      const baseHue = parseFloat(mp.baseHue) || 0;
      const imageTransform = mp.imageTransform || mp.transform ? JSON.stringify(mp.imageTransform || mp.transform) : null;
      const lumina = mp.lumina ? JSON.stringify(mp.lumina) : null;

      if (existingProducts.length > 0) {
        productId = existingProducts[0].id;
        await mysqlClient.execute(
          'UPDATE Product SET name = ?, salePrice = ?, description = ?, imageUrl = ?, maskUrl = ?, baseHue = ?, imageTransform = ?, lumina = ?, updatedAt = NOW() WHERE id = ?',
          [mp.name, salePrice, description, imageUrl, maskUrl, baseHue, imageTransform, lumina, productId]
        );
      } else {
        const [result] = await mysqlClient.execute(
          'INSERT INTO Product (sku, name, salePrice, description, imageUrl, maskUrl, baseHue, imageTransform, lumina, showInCatalog, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
          [sku, mp.name, salePrice, description, imageUrl, maskUrl, baseHue, imageTransform, lumina, 1]
        );
        productId = result.insertId;
      }

      // Migrate Variants (types)
      if (mp.types && Array.isArray(mp.types)) {
        await mysqlClient.execute('DELETE FROM ProductVariant WHERE productId = ?', [productId]);
        
        for (const variant of mp.types) {
          const vPrice = parseFloat(variant.price) || null;
          const vTransform = variant.imageTransform || variant.transform ? JSON.stringify(variant.imageTransform || variant.transform) : null;
          const vLumina = variant.lumina ? JSON.stringify(variant.lumina) : null;
          
          await mysqlClient.execute(
            'INSERT INTO ProductVariant (productId, name, price, imageUrl, maskUrl, imageTransform, lumina, description, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
            [productId, variant.name || "Sin nombre", vPrice, variant.image || null, variant.maskImage || null, vTransform, vLumina, variant.description || "", 1]
          );
        }
      }
    }

    console.log("✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await mongoClient.close();
    await mysqlClient.end();
  }
}

migrate();
