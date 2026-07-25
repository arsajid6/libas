const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Hardcoded mock data from src/data/products.js
const products = [
  {
    id: '1', name: 'Charcoal Grey Cutwork Suit', price: 9999, description: 'A sophisticated raw silk suit featuring intricate cutwork on the hem and cuffs, paired with matching trousers and a coordinating dupatta.', images: ['/images/final_prod_1.png', '/images/p1_secondary.png'], sizes: ['S', 'M', 'L', 'XL'], colors: ['Charcoal Grey'], category: 'Fusion', fabric: 'Raw Silk', isNew: true
  },
  {
    id: '2', name: 'Ivory Raw Silk Kurta', price: 9499, description: 'A premium, handcrafted ivory raw silk kurta suit with matching trousers, featuring intricate gold zari embroidery and traditional patterns.', images: ['/images/final_prod_2.png', '/images/p2_secondary.png'], sizes: ['S', 'M', 'L'], colors: ['Ivory'], category: 'Formal', fabric: 'Raw Silk', isNew: false
  },
  {
    id: '3', name: 'Deep Rust Orange Jamawar', price: 11499, description: 'A premium, handcrafted deep rust orange jamawar raw silk suit with matching trousers, featuring intricate traditional patterns and an embroidered collar.', images: ['/images/final_prod_3.png', '/images/p3_secondary.png'], sizes: ['S', 'M', 'L'], colors: ['Rust Orange'], category: 'Ethnic', fabric: 'Jamawar', isNew: true
  },
  {
    id: '4', name: 'Dusty Lavender Pink Chiffon', price: 10999, description: 'A premium, handcrafted dusty lavender-pink chiffon Anarkali suit with matching trousers, featuring complex and delicate silver tilla embroidery.', images: ['/images/final_prod_4.png', '/images/p4_secondary.png'], sizes: ['S', 'M', 'L', 'XL'], colors: ['Lavender Pink'], category: 'Formal', fabric: 'Chiffon', isNew: false
  },
  {
    id: '5', name: 'Navy Blue Cutwork Suit', price: 9999, description: 'A sophisticated raw silk suit featuring intricate cutwork on the hem and cuffs. Available in limited edition deep tones.', images: ['/images/final_prod_5.png', '/images/p5_secondary.png'], sizes: ['S', 'M', 'L'], colors: ['Deep Navy'], category: 'Fusion', fabric: 'Raw Silk', isNew: true
  },
  {
    id: '6', name: 'Burgundy Velvet Suit', price: 13499, description: 'A premium, handcrafted deep burgundy velvet kurta suit featuring minimalist and delicate white pearl and gold zari work on the collar, cuffs, and hem.', images: ['/images/final_prod_6.png', '/images/p6_secondary.png'], sizes: ['M', 'L', 'XL'], colors: ['Burgundy'], category: 'Formal', fabric: 'Velvet', isNew: true
  },
  {
    id: '7', name: 'Light Pink Silk Anarkali', price: 12499, description: 'Flowing light pink paneled silk Anarkali gown. Intricate silver resham work. Matching trousers. Elegant and refined.', images: ['/images/final_prod_7.png', '/images/p7_secondary.png'], sizes: ['S', 'M', 'L'], colors: ['Light Pink'], category: 'Occasion', fabric: 'Silk', isNew: false
  },
  {
    id: '8', name: 'Deep Teal Raw Silk', price: 9999, description: 'A premium, handcrafted deep teal raw silk kurta suit with matching trousers, featuring minimalist tone-on-tone embroidery on the high collar and cuffs.', images: ['/images/final_prod_8.png', '/images/p8_secondary.png'], sizes: ['S', 'M', 'L', 'XL'], colors: ['Teal'], category: 'Formal', fabric: 'Raw Silk', isNew: true
  },
  {
    id: '9', name: 'Soft Gold Textured Suit', price: 10499, description: 'A beautifully textured raw silk suit featuring delicate tone-on-tone embroidery. Presented in three versatile shades (Soft Gold, Champagne Pink, and Silver Grey) and captured in distinct, elegant poses.', images: ['/images/p9_primary.png', '/images/p9_secondary.png'], sizes: ['S', 'M', 'L'], colors: ['Soft Gold', 'Champagne Pink', 'Silver Grey'], category: 'Fusion', fabric: 'Raw Silk', isNew: true
  },
  {
    id: '10', name: 'Silk Jamawar Suit', price: 11499, description: 'A premium, handcrafted silk jamawar suit with intricate patterns and texture. Features a rich fabric, a detailed design, and premium stitching. Ideal for formal and festive events.', images: ['/images/p10_primary.png', '/images/p10_secondary.png'], sizes: ['S', 'M', 'L', 'XL'], colors: ['Rust', 'Teal', 'Dark'], category: 'Formal', fabric: 'Silk Jamawar', isNew: false
  },
  {
    id: '11', name: 'Deep Burgundy Velvet Suit', price: 13999, description: 'A premium, handcrafted deep burgundy velvet kurta suit featuring intricate gold zardozi embroidery on the collar and cuffs, paired with matching trousers.', images: ['/images/p11_primary.png', '/images/p11_secondary.png'], sizes: ['M', 'L', 'XL'], colors: ['Burgundy', 'Deep Maroon', 'Wine', 'Classic'], category: 'Formal', fabric: 'Velvet', isNew: true
  },
  {
    id: '12', name: 'Exquisite Katan Silk Suit', price: 10999, description: 'A premium, handcrafted Katan silk kurta suit with extensive gold and silver tilla thread-work and delicate bead embellishments. Available in classic and limited edition tones.', images: ['/images/p12_primary.png', '/images/p12_secondary.png'], sizes: ['S', 'M', 'L'], colors: ['Cream', 'Maroon', 'Ivory', 'Gold'], category: 'Fusion', fabric: 'Katan Silk', isNew: true
  },
  {
    id: '13', name: 'Jamawar & Velvet Fusion Suit', price: 12499, description: 'A handcrafted fusion of classic silk jamawar and premium velvet. Features intricate zardozi, tilla, and beadwork, a unique asymmetric cut tunic, and structured velvet trousers.', images: ['/images/p13_primary.png', '/images/p13_secondary.png'], sizes: ['S', 'M', 'L'], colors: ['Teal-Rust', 'Indigo-Gold'], category: 'Ethnic', fabric: 'Fusion', isNew: false
  },
  {
    id: '14', name: 'Jamawar Silk Fusion Suit', price: 13499, description: 'A premium, handcrafted Jamawar Silk fusion suit with complex tilla thread-work, subtle bead embellishments, and dynamic cuts. Perfect for formal and festive statement.', images: ['/images/p14_primary.png', '/images/p14_secondary.png'], sizes: ['S', 'M', 'L', 'XL'], colors: ['Cream-Gold', 'Maroon', 'Classic Black'], category: 'Occasion', fabric: 'Jamawar Silk', isNew: true
  },
  {
    id: '15', name: 'Exquisite Hand-Block Printed Suit', price: 11499, description: 'A premium hand-block printed cotton-silk suit featuring intricate patterns, subtle mirror accents on the neckline, and structured trousers. Crafted for effortless formal and festive statement.', images: ['/images/p15_primary.png', '/images/p15_secondary.png'], sizes: ['S', 'M', 'L'], colors: ['Teal-Rust', 'Indigo-Gold', 'Amber-Silver'], category: 'Casual', fabric: 'Cotton Silk', isNew: false
  },
  {
    id: '16', name: 'Exquisite Crush Silk Suit', price: 10999, description: 'A premium handcrafted Crush Silk kurta suit with intricate tilla embroidery and rich texture, paired with structured trousers. Ideal for a sophisticated formal or festive statement.', images: ['/images/p16_primary.png', '/images/p16_secondary.png'], sizes: ['S', 'M', 'L', 'XL'], colors: ['Emerald', 'Rich Mustard', 'Classic Black'], category: 'Formal', fabric: 'Crush Silk', isNew: true
  },
  {
    id: '17', name: 'Exquisite Zardozi & Zari Silk Suit', price: 13999, description: 'A premium handcrafted Katan silk kurta suit featuring intricate Zardozi and Zari thread-work on the neckline and cuffs. Paired with structured trousers. Ideal for grand and formal statement.', images: ['/images/p17_primary.png', '/images/p17_secondary.png'], sizes: ['M', 'L', 'XL'], colors: ['Forest Green', 'Royal Blue', 'Burnt Orange', 'Classic'], category: 'Occasion', fabric: 'Katan Silk', isNew: true
  },
  {
    id: '18', name: 'Exquisite Handcrafted Collection', price: 13999, description: 'An exquisite Dua Libas collection featuring three distinct handcrafted suites: delicate Ice Blue Chikankari, luxurious Maroon Velvet Zardozi, and Deep Teal Jamawar fusion.', images: ['/images/p18_primary.png', '/images/p18_secondary.png'], sizes: ['S', 'M', 'L'], colors: ['Ice Blue', 'Deep Maroon', 'Teal'], category: 'Ethnic', fabric: 'Mixed', isNew: true
  }
];

const insertProducts = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Clear existing data
      db.run('DELETE FROM product_images');
      db.run('DELETE FROM product_variants');
      db.run('DELETE FROM products', (err) => {
        if (err) return reject(err);

        let completed = 0;

        products.forEach(p => {
          const stmt = db.prepare('INSERT INTO products (name, description, base_price, fabric) VALUES (?, ?, ?, ?)');
          
          stmt.run([p.name, p.description, p.price / 280, p.fabric], function(err) {
            if (err) console.error(err);
            const productId = this.lastID;

            // Insert variants
            p.sizes.forEach(size => {
              p.colors.forEach(color => {
                db.run('INSERT INTO product_variants (product_id, size, color, stock_quantity) VALUES (?, ?, ?, 10)', [productId, size, color]);
              });
            });

            // Insert images
            p.images.forEach((imgUrl, i) => {
              db.run('INSERT INTO product_images (product_id, image_url) VALUES (?, ?)', [productId, imgUrl]);
            });

            completed++;
            if (completed === products.length) {
              resolve();
            }
          });
          stmt.finalize();
        });
      });
    });
  });
};

insertProducts().then(() => {
  console.log('Successfully seeded database with webstore products.');
  db.close();
}).catch(err => {
  console.error('Error seeding DB:', err);
  db.close();
});
