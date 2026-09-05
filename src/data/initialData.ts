import { Product, Order, Expense, Customer, TableInfo, ShopSettings } from '../types';

export const INITIAL_CATEGORIES = [
  'All Items',
  'Popular',
  'Skin Care',
  'Wines & Liquors',
  'Food & Groceries',
  'Beverages',
  'Snacks',
  'Personal Care'
];

export const INITIAL_PRODUCTS: Product[] = [
  // 1. Skin Care & Cosmetics
  {
    id: 'prod-sk-1',
    userId: 'user-admin',
    name: 'CeraVe Hydrating Facial Cleanser 237ml',
    nameKh: 'ហ្វូមលាងមុខ សេរ៉ាវី ផ្តល់សំណើម',
    category: 'Skin Care',
    price: 14.50,
    costPrice: 8.80,
    stock: 42,
    barcode: '885900100101',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=80',
    isPopular: true,
    unit: 'Bottle',
    description: 'Gentle hydrating face wash with ceramides & hyaluronic acid for normal to dry skin.'
  },
  {
    id: 'prod-sk-2',
    userId: 'user-admin',
    name: 'La Roche-Posay Anthelios SPF50+ Sunscreen',
    nameKh: 'ឡេការពារកម្ដៅថ្ងៃ រ៉ូសផូសេ SPF50+',
    category: 'Skin Care',
    price: 22.00,
    costPrice: 14.50,
    stock: 35,
    barcode: '885900100102',
    image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=400&q=80',
    isPopular: true,
    unit: 'Tube',
    description: 'Ultra-light invisible fluid sunscreen offering broad spectrum SPF 50+ UVA/UVB protection.'
  },
  {
    id: 'prod-sk-3',
    userId: 'user-admin',
    name: 'COSRX Advanced Snail 96 Mucin Power Essence',
    nameKh: 'សេរ៉ូមខ្យងកូរ៉េ COSRX ចិញ្ចឹមស្បែក',
    category: 'Skin Care',
    price: 18.50,
    costPrice: 11.20,
    stock: 28,
    barcode: '885900100103',
    image: 'https://images.unsplash.com/photo-1608248597359-5775317eb57a?auto=format&fit=crop&w=400&q=80',
    isPopular: true,
    unit: 'Bottle',
    description: '96.3% snail secretion filtrate to repair damaged skin barriers and lock in deep moisture.'
  },
  {
    id: 'prod-sk-4',
    userId: 'user-admin',
    name: 'Anua Heartleaf 77% Soothing Toner 250ml',
    nameKh: 'ទឹកជូតមុខផ្កា Anua បន្ធូរបន្ថយស្បែក',
    category: 'Skin Care',
    price: 16.00,
    costPrice: 9.50,
    stock: 25,
    barcode: '885900100104',
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80',
    isPopular: false,
    unit: 'Bottle',
    description: 'Calming facial toner with 77% Houttuynia cordata extract for sensitive and acne-prone skin.'
  },
  {
    id: 'prod-sk-5',
    userId: 'user-admin',
    name: 'Laneige Lip Sleeping Mask Berry 20g',
    nameKh: 'ម៉ាស់បបូរមាត់ Laneige ផ្លែប៊ឺរី',
    category: 'Skin Care',
    price: 12.00,
    costPrice: 6.80,
    stock: 50,
    barcode: '885900100105',
    image: 'https://images.unsplash.com/photo-1599305090598-fe179d501227?auto=format&fit=crop&w=400&q=80',
    isPopular: true,
    unit: 'Jar',
    description: 'Nourishing overnight lip care treatment loaded with vitamin C and antioxidant complex.'
  },

  // 2. Wines, Spirits & Liquors
  {
    id: 'prod-wn-1',
    userId: 'user-admin',
    name: 'Cabernet Sauvignon Red Wine 750ml',
    nameKh: 'ស្រាក្រហម កាប៊ែរណេ សូវីញ៉ុង ៧៥០មល',
    category: 'Wines & Liquors',
    price: 24.99,
    costPrice: 14.50,
    stock: 30,
    barcode: '885900200201',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=400&q=80',
    isPopular: true,
    unit: 'Bottle',
    description: 'Full-bodied French vintage red wine with rich notes of blackcurrant, cedar, and oak.'
  },
  {
    id: 'prod-wn-2',
    userId: 'user-admin',
    name: 'Chardonnay Reserve White Wine 750ml',
    nameKh: 'ស្រាស សាដូណេ ៧៥០មល',
    category: 'Wines & Liquors',
    price: 21.50,
    costPrice: 12.80,
    stock: 24,
    barcode: '885900200202',
    image: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?auto=format&fit=crop&w=400&q=80',
    isPopular: false,
    unit: 'Bottle',
    description: 'Crisp and refreshing white wine with aromas of green apple, citrus, and toasted vanilla.'
  },
  {
    id: 'prod-wn-3',
    userId: 'user-admin',
    name: 'Johnnie Walker Black Label 12Y 700ml',
    nameKh: 'ស្រាវីស្គី Johnnie Walker Black Label',
    category: 'Wines & Liquors',
    price: 38.00,
    costPrice: 26.50,
    stock: 20,
    barcode: '885900200203',
    image: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=400&q=80',
    isPopular: true,
    unit: 'Bottle',
    description: 'Iconic blended Scotch whisky matured for 12 years with smooth, rich, and smoky layers.'
  },
  {
    id: 'prod-wn-4',
    userId: 'user-admin',
    name: 'Hennessy V.S Cognac 700ml',
    nameKh: 'ស្រាកូញាក់ ហិនណេសស៊ី V.S',
    category: 'Wines & Liquors',
    price: 52.00,
    costPrice: 37.00,
    stock: 15,
    barcode: '885900200204',
    image: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=400&q=80',
    isPopular: true,
    unit: 'Bottle',
    description: 'Classic French cognac aged in oak barrels with toasted fruit and bold roasted notes.'
  },
  {
    id: 'prod-wn-5',
    userId: 'user-admin',
    name: 'Heineken Premium Beer (Pack 6 Cans)',
    nameKh: 'ស្រាបៀរ ហាយនីគែន ៦កំប៉ុង',
    category: 'Wines & Liquors',
    price: 8.50,
    costPrice: 5.60,
    stock: 60,
    barcode: '885900200205',
    image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=400&q=80',
    isPopular: true,
    unit: 'Pack',
    description: 'World-famous Dutch lager brewed with 100% natural ingredients, barley, and pure water.'
  },

  // 3. Food, Groceries & Staples
  {
    id: 'prod-fd-1',
    userId: 'user-admin',
    name: 'Premium Jasmine Fragrant Rice 5kg',
    nameKh: 'អង្ករផ្កាម្លិះប្រណិតលេខ១ ៥គីឡូ',
    category: 'Food & Groceries',
    price: 6.50,
    costPrice: 4.10,
    stock: 55,
    barcode: '885900300301',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80',
    isPopular: true,
    unit: 'Bag',
    description: 'Aromatic long-grain Cambodian Angkor Malis Jasmine rice, naturally fragrant and soft.'
  },
  {
    id: 'prod-fd-2',
    userId: 'user-admin',
    name: 'Extra Virgin Olive Oil 500ml',
    nameKh: 'ប្រេងអូលីវសុទ្ធសម្រាប់សុខភាព ៥០០មល',
    category: 'Food & Groceries',
    price: 7.90,
    costPrice: 4.80,
    stock: 35,
    barcode: '885900300302',
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80',
    isPopular: false,
    unit: 'Bottle',
    description: 'Cold-pressed extra virgin Mediterranean olive oil ideal for dressings, salads, and cooking.'
  },
  {
    id: 'prod-fd-3',
    userId: 'user-admin',
    name: 'Nongshim Shin Ramyun Noodles (Pack 5)',
    nameKh: 'មីកូរ៉េ ស៊ីនរ៉ាមយ៉ុង ហឹរឈ្ងុយ ៥កញ្ចប់',
    category: 'Food & Groceries',
    price: 4.50,
    costPrice: 2.70,
    stock: 80,
    barcode: '885900300303',
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&q=80',
    isPopular: true,
    unit: 'Pack',
    description: 'Authentic spicy Korean gourmet ramen with chewy noodles and rich mushroom broth.'
  },
  {
    id: 'prod-fd-4',
    userId: 'user-admin',
    name: 'Solid Albacore Tuna in Olive Oil 185g',
    nameKh: 'ត្រីធូណាកំប៉ុងក្នុងប្រេងអូលីវ ១៨៥ក្រាម',
    category: 'Food & Groceries',
    price: 2.75,
    costPrice: 1.40,
    stock: 70,
    barcode: '885900300304',
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80',
    isPopular: false,
    unit: 'Can',
    description: 'Premium wild-caught white albacore tuna packed in pure extra virgin olive oil.'
  },

  // 4. Beverages & Drinks
  {
    id: 'prod-bv-1',
    userId: 'user-admin',
    name: 'San Pellegrino Sparkling Water 750ml',
    nameKh: 'ទឹកបរិសុទ្ធហ្គាស San Pellegrino ៧៥០មល',
    category: 'Beverages',
    price: 3.20,
    costPrice: 1.60,
    stock: 65,
    barcode: '885900400401',
    image: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=400&q=80',
    isPopular: true,
    unit: 'Bottle',
    description: 'Natural mineral Italian sparkling water with gentle bubbles and crisp taste.'
  },
  {
    id: 'prod-bv-2',
    userId: 'user-admin',
    name: 'Uji Japanese Ceremonial Matcha 50g',
    nameKh: 'ម្សៅតែបៃតង ម៉ាតឆា ជប៉ុនសុទ្ធ ៥០ក្រាម',
    category: 'Beverages',
    price: 15.00,
    costPrice: 8.50,
    stock: 30,
    barcode: '885900400402',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80',
    isPopular: true,
    unit: 'Can',
    description: 'First-harvest organic stone-ground green tea powder sourced directly from Kyoto, Japan.'
  },
  {
    id: 'prod-bv-3',
    userId: 'user-admin',
    name: 'Arabica Whole Bean Roasted Coffee 500g',
    nameKh: 'គ្រាប់កាហ្វេអារ៉ាប៊ីកា លីងឈ្ងុយ ៥០០ក្រាម',
    category: 'Beverages',
    price: 8.50,
    costPrice: 4.20,
    stock: 45,
    barcode: '885900400403',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80',
    isPopular: true,
    unit: 'Bag',
    description: 'Medium roast highland Arabica coffee beans with hints of cocoa, almond, and berry.'
  },
  {
    id: 'prod-bv-4',
    userId: 'user-admin',
    name: 'Freshly Squeezed Valencia Orange Juice 1L',
    nameKh: 'ទឹកក្រូចច្របាច់ស្រស់ ១០០% ១លីត្រ',
    category: 'Beverages',
    price: 3.50,
    costPrice: 1.80,
    stock: 40,
    barcode: '885900400404',
    image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=400&q=80',
    isPopular: false,
    unit: 'Bottle',
    description: '100% natural orange juice without added sugar, preservatives, or artificial colors.'
  },

  // 5. Snacks & Confectionery
  {
    id: 'prod-sn-1',
    userId: 'user-admin',
    name: 'Belgian 70% Dark Chocolate Bar 100g',
    nameKh: 'សូកូឡាខ្មៅ បែលហ្ស៊ិក ៧០% ១០០ក្រាម',
    category: 'Snacks',
    price: 3.90,
    costPrice: 2.00,
    stock: 50,
    barcode: '885900500501',
    image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=400&q=80',
    isPopular: true,
    unit: 'Bar',
    description: 'Artisan rich dark chocolate made with sustainably harvested cocoa butter.'
  },
  {
    id: 'prod-sn-2',
    userId: 'user-admin',
    name: 'Pringles Sour Cream & Onion 158g',
    nameKh: 'ដំឡូងបំពង ព្រីងហ្គល រសជាតិខ្ទឹមស',
    category: 'Snacks',
    price: 2.40,
    costPrice: 1.30,
    stock: 65,
    barcode: '885900500502',
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&q=80',
    isPopular: true,
    unit: 'Can',
    description: 'Crispy potato crisps seasoned with savory sour cream, herbs, and onion flavors.'
  },
  {
    id: 'prod-sn-3',
    userId: 'user-admin',
    name: 'Roasted Cashew Nuts Sea Salt 250g',
    nameKh: 'គ្រាប់ស្វាយចន្ទីខ្មែរ លីងអំបិល ២៥០ក្រាម',
    category: 'Snacks',
    price: 4.80,
    costPrice: 2.90,
    stock: 40,
    barcode: '885900500503',
    image: 'https://images.unsplash.com/photo-1536591375315-1b83842155e9?auto=format&fit=crop&w=400&q=80',
    isPopular: false,
    unit: 'Bag',
    description: 'Crunchy premium jumbo cashew nuts lightly tossed in natural sea salt.'
  },

  // 6. Personal Care & Hygiene
  {
    id: 'prod-pc-1',
    userId: 'user-admin',
    name: 'Moroccanoil Hydrating Shampoo 250ml',
    nameKh: 'សាប៊ូកក់សក់ Moroccanoil ផ្តល់សំណើម',
    category: 'Personal Care',
    price: 16.50,
    costPrice: 9.80,
    stock: 22,
    barcode: '885900600601',
    image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=400&q=80',
    isPopular: false,
    unit: 'Bottle',
    description: 'Argan oil infused shampoo gently cleanses and nourishes dry, stressed hair.'
  },
  {
    id: 'prod-pc-2',
    userId: 'user-admin',
    name: 'Sensodyne Rapid Relief Toothpaste 100g',
    nameKh: 'ថ្នាំដុសធ្មេញ សេនសូឌីន ការពារស្រៀវធ្មេញ',
    category: 'Personal Care',
    price: 4.20,
    costPrice: 2.30,
    stock: 55,
    barcode: '885900600602',
    image: 'https://images.unsplash.com/photo-1588717847701-a47738b55694?auto=format&fit=crop&w=400&q=80',
    isPopular: true,
    unit: 'Tube',
    description: 'Clinically proven fast relief and long-lasting daily sensitivity protection.'
  }
];

export const INITIAL_TABLES: TableInfo[] = [
  { id: 'tbl-1', name: 'Counter 01 (Main POS)', seats: 1, status: 'available' },
  { id: 'tbl-2', name: 'Counter 02 (Express)', seats: 1, status: 'occupied' },
  { id: 'tbl-3', name: 'Counter 03 (Liquor Section)', seats: 1, status: 'available' },
  { id: 'tbl-4', name: 'Counter 04 (Beauty/Cosmetics)', seats: 1, status: 'reserved' },
  { id: 'tbl-5', name: 'Counter 05 (VIP Lounge)', seats: 1, status: 'occupied' },
  { id: 'tbl-6', name: 'Online Order #1', seats: 1, status: 'available' },
  { id: 'tbl-7', name: 'Delivery Dispatch #A', seats: 1, status: 'available' },
  { id: 'tbl-8', name: 'Delivery Dispatch #B', seats: 1, status: 'available' },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    userId: 'user-admin',
    name: 'Sophea Chan',
    phone: '012 345 678',
    email: 'sophea.chan@example.com',
    totalOrders: 14,
    totalSpent: 342.50,
    points: 170,
    lastVisit: '2026-08-13'
  },
  {
    id: 'cust-2',
    userId: 'user-admin',
    name: 'Dara Vong',
    phone: '098 765 432',
    email: 'dara.vong@example.com',
    totalOrders: 8,
    totalSpent: 198.20,
    points: 95,
    lastVisit: '2026-08-13'
  },
  {
    id: 'cust-3',
    userId: 'user-admin',
    name: 'Bopha Pich',
    phone: '085 112 233',
    email: 'bopha@example.com',
    totalOrders: 6,
    totalSpent: 145.00,
    points: 70,
    lastVisit: '2026-08-12'
  },
  {
    id: 'cust-4',
    userId: 'user-admin',
    name: 'MD Atikur Rhaman',
    phone: '077 889 900',
    email: 'atikur@example.com',
    totalOrders: 19,
    totalSpent: 512.80,
    points: 250,
    lastVisit: '2026-08-13'
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-1001',
    userId: 'user-admin',
    orderNumber: 'ORD-1001',
    items: [
      { product: INITIAL_PRODUCTS[0], quantity: 1 }, // CeraVe Cleanser $14.50
      { product: INITIAL_PRODUCTS[1], quantity: 1 }, // Sunscreen $22.00
      { product: INITIAL_PRODUCTS[5], quantity: 1 }, // Cabernet Wine $24.99
    ],
    subtotal: 61.49,
    discount: 3.00,
    discountType: 'fixed',
    tax: 4.68,
    taxRate: 0.08,
    total: 63.17,
    totalKhr: 258997,
    paymentMethod: 'khqr',
    amountPaid: 63.17,
    changeDue: 0,
    tableNumber: 'Counter 01 (Main POS)',
    customerName: 'Sophea Chan',
    customerPhone: '012 345 678',
    cashierName: 'MD Atikur Rhaman',
    status: 'completed',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    note: 'VIP Membership applied'
  },
  {
    id: 'ord-1002',
    userId: 'user-admin',
    orderNumber: 'ORD-1002',
    items: [
      { product: INITIAL_PRODUCTS[7], quantity: 1 }, // Johnnie Walker Black $38.00
      { product: INITIAL_PRODUCTS[9], quantity: 2 }, // Heineken 6-pack $8.50 x 2 = $17.00
      { product: INITIAL_PRODUCTS[18], quantity: 2 }, // Pringles $2.40 x 2 = $4.80
    ],
    subtotal: 59.80,
    discount: 0,
    discountType: 'fixed',
    tax: 4.78,
    taxRate: 0.08,
    total: 64.58,
    totalKhr: 264778,
    paymentMethod: 'cash',
    amountPaid: 70.00,
    changeDue: 5.42,
    tableNumber: 'Counter 03 (Liquor Section)',
    customerName: 'Dara Vong',
    customerPhone: '098 765 432',
    cashierName: 'MD Atikur Rhaman',
    status: 'completed',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'ord-1003',
    userId: 'user-admin',
    orderNumber: 'ORD-1003',
    items: [
      { product: INITIAL_PRODUCTS[10], quantity: 1 }, // Jasmine Rice 5kg $6.50
      { product: INITIAL_PRODUCTS[12], quantity: 2 }, // Shin Ramyun Pack $4.50 x 2 = $9.00
      { product: INITIAL_PRODUCTS[15], quantity: 1 }, // Uji Matcha $15.00
      { product: INITIAL_PRODUCTS[17], quantity: 2 }, // Dark Chocolate $3.90 x 2 = $7.80
    ],
    subtotal: 38.30,
    discount: 3.83,
    discountType: 'percent',
    tax: 2.76,
    taxRate: 0.08,
    total: 37.23,
    totalKhr: 152643,
    paymentMethod: 'card',
    amountPaid: 37.23,
    changeDue: 0,
    tableNumber: 'Express Lane',
    customerName: 'Walk-in Shopper',
    cashierName: 'MD Atikur Rhaman',
    status: 'completed',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString()
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    userId: 'user-admin',
    title: 'Korean Cosmetics & Skin Care Restock',
    category: 'Stock Purchase',
    amount: 320.00,
    date: '2026-08-13',
    paidBy: 'MD Atikur Rhaman',
    notes: 'Imported CeraVe, COSRX, La Roche-Posay batch'
  },
  {
    id: 'exp-2',
    userId: 'user-admin',
    title: 'French Wine & Spirits Distributor Wholesale',
    category: 'Stock Purchase',
    amount: 450.00,
    date: '2026-08-12',
    paidBy: 'MD Atikur Rhaman',
    notes: 'Cabernet Sauvignon, Hennessy, Johnnie Walker crates'
  },
  {
    id: 'exp-3',
    userId: 'user-admin',
    title: 'Store Electricity & Air Conditioning Bill',
    category: 'Utilities',
    amount: 135.00,
    date: '2026-08-11',
    paidBy: 'MD Atikur Rhaman',
    notes: 'EDC commercial rate'
  },
  {
    id: 'exp-4',
    userId: 'user-admin',
    title: 'Packaging Bags & Thermal Receipt Paper Rolls',
    category: 'Maintenance',
    amount: 42.00,
    date: '2026-08-10',
    paidBy: 'MD Atikur Rhaman',
    notes: '50x 80mm thermal rolls and shopping bags'
  }
];

export const INITIAL_SETTINGS: ShopSettings = {
  shopName: 'MINI MART POS',
  shopNameKh: 'ប្រព័ន្ធគ្រប់គ្រងការលក់ MINI MART POS',
  address: '#88, Preah Norodom Blvd, Daun Penh, Phnom Penh',
  phone: '+855 12 888 999 / +855 98 777 666',
  taxRate: 0.08,
  currencySymbol: '$',
  khrExchangeRate: 4100,
  enableSound: true,
  receiptFooterText: 'Thank you for shopping with us! សូមអរគុណដែលបានគាំទ្រទំនិញយើងខ្ញុំ!',
  language: 'en'
};
