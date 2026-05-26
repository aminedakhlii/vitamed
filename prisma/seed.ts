import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.orderStatusHistory.deleteMany();
  await prisma.order.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.followUp.deleteMany();
  await prisma.productDocument.deleteMany();
  await prisma.countryPrice.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      email: "admin@charles.com",
      passwordHash: await bcrypt.hash("admin123", 10),
      name: "System Administrator",
      role: "ADMIN",
      language: "en",
    },
  });

  const sales = await prisma.user.create({
    data: {
      email: "sales@charles.com",
      passwordHash: await bcrypt.hash("sales123", 10),
      name: "Sarah Mitchell",
      role: "SALES",
      language: "en",
      country: "FR",
    },
  });

  const client = await prisma.user.create({
    data: {
      email: "client@charles.com",
      passwordHash: await bcrypt.hash("client123", 10),
      name: "Acme Industries",
      role: "CLIENT",
      language: "en",
      country: "US",
      company: "Acme Industries",
      phone: "+1 555 0100",
    },
  });

  const products = [
    {
      code: "IND-4500",
      name: "Industrial Valve Assembly",
      category: "Industrial Components",
      description: "High-pressure industrial valve assembly for process control systems.",
      specifications: JSON.stringify({ pressure: "150 PSI", diameter: "4 inch", weight: "12 kg" }),
      colors: JSON.stringify(["Silver", "Black"]),
      sizes: JSON.stringify(["Standard", "Large"]),
      materials: "Stainless Steel 316",
      certifications: "ISO 9001, CE",
      modelNumber: "IVA-4500-X",
      imageUrl: null,
      prices: [
        { country: "US", currency: "USD", price: 1250 },
        { country: "FR", currency: "EUR", price: 1180 },
        { country: "DE", currency: "EUR", price: 1180 },
      ],
      docs: [
        { name: "Specification Sheet", docType: "PDF", fileUrl: "/docs/spec-ind-4500.pdf" },
        { name: "Compliance Certificate", docType: "PDF", fileUrl: "/docs/cert-ind-4500.pdf" },
      ],
    },
    {
      code: "PKG-2201",
      name: "Premium Packaging Unit",
      category: "Packaging",
      description: "Modular packaging solution for export-ready product protection.",
      specifications: JSON.stringify({ dimensions: "120x80x60 cm", capacity: "500 kg" }),
      colors: JSON.stringify(["White", "Brown"]),
      sizes: JSON.stringify(["Medium", "Large", "XL"]),
      materials: "Recycled Corrugated Board",
      certifications: "FSC Certified",
      modelNumber: "PPU-2201",
      prices: [
        { country: "US", currency: "USD", price: 89 },
        { country: "GB", currency: "GBP", price: 72 },
        { country: "AE", currency: "AED", price: 340 },
      ],
      docs: [{ name: "Packaging Guide", docType: "PDF", fileUrl: "/docs/pkg-2201-guide.pdf" }],
    },
    {
      code: "CTL-8800",
      name: "Control Panel Module",
      category: "Electronics",
      description: "Programmable control panel module with integrated diagnostics.",
      specifications: JSON.stringify({ voltage: "24V DC", channels: 16, display: "7 inch LCD" }),
      colors: JSON.stringify(["Gray"]),
      sizes: JSON.stringify(["Standard"]),
      materials: "ABS Housing, Copper PCB",
      certifications: "UL Listed, RoHS",
      modelNumber: "CPM-8800",
      prices: [
        { country: "US", currency: "USD", price: 2890 },
        { country: "CN", currency: "CNY", price: 19800 },
        { country: "DE", currency: "EUR", price: 2650 },
      ],
      docs: [
        { name: "Instruction Manual", docType: "PDF", fileUrl: "/docs/manual-ctl-8800.pdf" },
        { name: "Technical Specs", docType: "Excel", fileUrl: "/docs/specs-ctl-8800.xlsx" },
      ],
    },
    {
      code: "FLT-1102",
      name: "Filtration Cartridge Set",
      category: "Consumables",
      description: "Replacement filtration cartridge set for industrial water systems.",
      specifications: JSON.stringify({ micron: "5μm", flow: "200 L/min", lifespan: "6 months" }),
      colors: JSON.stringify(["Blue", "White"]),
      sizes: JSON.stringify(["Type A", "Type B"]),
      materials: "Polypropylene, Activated Carbon",
      certifications: "NSF 42",
      modelNumber: "FCS-1102",
      prices: [
        { country: "US", currency: "USD", price: 245 },
        { country: "FR", currency: "EUR", price: 220 },
      ],
      docs: [{ name: "Installation Guide", docType: "PDF", fileUrl: "/docs/install-flt-1102.pdf" }],
    },
  ];

  const createdProducts = [];
  for (const p of products) {
    const { prices, docs, ...productData } = p;
    const product = await prisma.product.create({
      data: {
        ...productData,
        countryPrices: { create: prices },
        documents: { create: docs },
      },
    });
    createdProducts.push(product);
  }

  const quotation = await prisma.quotation.create({
    data: {
      userId: client.id,
      status: "APPROVED",
      items: JSON.stringify([
        { productId: createdProducts[0].id, name: createdProducts[0].name, quantity: 10, unitPrice: 1250 },
      ]),
      notes: "Bulk order for Q3 production line",
      incoterm: "FOB",
      country: "US",
    },
  });

  const order = await prisma.order.create({
    data: {
      orderNumber: "ORD-2026-0001",
      userId: client.id,
      quotationId: quotation.id,
      status: "IN_PRODUCTION",
      incoterm: "FOB",
      destinationCountry: "US",
      shippingCost: 4500,
      estimatedDelivery: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      trackingNumber: "TRK-8847291",
      items: JSON.stringify([
        { productId: createdProducts[0].id, name: createdProducts[0].name, quantity: 10, unitPrice: 1250 },
      ]),
      statusHistory: {
        create: [
          { status: "QUOTE_REQUESTED", note: "Quotation submitted by client" },
          { status: "QUOTE_APPROVED", note: "Approved by sales team" },
          { status: "PRODUCTION_STARTED", note: "Manufacturing scheduled" },
          { status: "IN_PRODUCTION", note: "Assembly in progress — 60% complete" },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      orderNumber: "ORD-2026-0002",
      userId: client.id,
      status: "SHIPPED",
      incoterm: "CIF",
      destinationCountry: "US",
      shippingCost: 890,
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      trackingNumber: "TRK-7721045",
      items: JSON.stringify([
        { productId: createdProducts[3].id, name: createdProducts[3].name, quantity: 50, unitPrice: 245 },
      ]),
      statusHistory: {
        create: [
          { status: "QUOTE_REQUESTED" },
          { status: "QUOTE_APPROVED" },
          { status: "PRODUCTION_STARTED" },
          { status: "IN_PRODUCTION" },
          { status: "QUALITY_CHECK" },
          { status: "PACKED" },
          { status: "SHIPPED", note: "Departed warehouse — ETA 7 days" },
        ],
      },
    },
  });

  await prisma.cartItem.create({
    data: {
      userId: client.id,
      productId: createdProducts[1].id,
      quantity: 100,
      color: "White",
      size: "Large",
      packaging: "Export pallet",
      deliveryNotes: "Deliver to loading dock B",
    },
  });

  const notifications = [
    { userId: client.id, title: "Order Update", message: `Order ${order.orderNumber} is now in production.`, type: "ORDER" as const },
    { userId: client.id, title: "Shipping Alert", message: "Order ORD-2026-0002 has been shipped.", type: "SHIPPING" as const },
    { userId: sales.id, title: "New Quotation", message: "Acme Industries requested a quotation.", type: "ORDER" as const },
    { userId: admin.id, title: "System", message: "Weekly analytics report is ready.", type: "SYSTEM" as const },
  ];

  for (const n of notifications) {
    await prisma.notification.create({ data: n });
  }

  await prisma.supportTicket.create({
    data: {
      ticketNumber: "TKT-2026-0001",
      userId: client.id,
      assignedToId: sales.id,
      type: "COMPLAINT",
      subject: "Delayed delivery on previous order",
      description: "Our last shipment arrived 3 days late. Please advise on compensation.",
      status: "IN_PROGRESS",
    },
  });

  await prisma.followUp.createMany({
    data: [
      {
        clientId: client.id,
        salesUserId: sales.id,
        type: "email",
        subject: "Quotation follow-up — Industrial Valve",
        message: "Automated reminder: Client has not responded to quotation in 48 hours.",
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        automated: true,
      },
      {
        clientId: client.id,
        salesUserId: sales.id,
        type: "call",
        subject: "Quarterly account review",
        message: "Schedule call to review product performance and upcoming needs.",
        scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        automated: false,
      },
    ],
  });

  console.log("Seed completed:");
  console.log("  Admin:  admin@charles.com / admin123");
  console.log("  Sales:  sales@charles.com / sales123");
  console.log("  Client: client@charles.com / client123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
