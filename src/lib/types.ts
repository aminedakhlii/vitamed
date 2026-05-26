export type Role = "ADMIN" | "SALES" | "CLIENT";

export type OrderStatus =
  | "QUOTE_REQUESTED"
  | "QUOTE_APPROVED"
  | "PRODUCTION_STARTED"
  | "IN_PRODUCTION"
  | "QUALITY_CHECK"
  | "PACKED"
  | "SHIPPED"
  | "DELIVERED";

export type QuotationStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export type TicketType = "COMPLAINT" | "RETURN" | "REPLACEMENT" | "FEEDBACK";

export type NotificationType =
  | "ORDER"
  | "SHIPPING"
  | "PAYMENT"
  | "COMPLAINT"
  | "FOLLOW_UP"
  | "SYSTEM";

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: Role;
  language: string;
  country: string | null;
  company: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string;
  specifications: string;
  colors: string;
  sizes: string;
  materials: string;
  certifications: string;
  modelNumber: string | null;
  imageUrl: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CountryPrice = {
  id: string;
  productId: string;
  country: string;
  currency: string;
  price: number;
};

export type ProductDocument = {
  id: string;
  productId: string;
  name: string;
  docType: string;
  fileUrl: string;
};

export type CartItem = {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  color: string | null;
  size: string | null;
  packaging: string | null;
  deliveryNotes: string | null;
};

export type Quotation = {
  id: string;
  userId: string;
  status: QuotationStatus;
  items: string;
  notes: string | null;
  incoterm: string | null;
  country: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  userId: string;
  quotationId: string | null;
  status: OrderStatus;
  incoterm: string | null;
  destinationCountry: string | null;
  shippingCost: number | null;
  estimatedDelivery: string | null;
  trackingNumber: string | null;
  items: string;
  createdAt: string;
  updatedAt: string;
};

export type OrderStatusHistory = {
  id: string;
  orderId: string;
  status: OrderStatus;
  note: string | null;
  createdAt: string;
};

export type Notification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
};

export type SupportTicket = {
  id: string;
  ticketNumber: string;
  userId: string;
  assignedToId: string | null;
  type: TicketType;
  subject: string;
  description: string;
  status: TicketStatus;
  attachments: string;
  createdAt: string;
  updatedAt: string;
};

export type FollowUp = {
  id: string;
  clientId: string;
  salesUserId: string | null;
  type: string;
  subject: string;
  message: string;
  scheduledAt: string;
  completed: boolean;
  automated: boolean;
  createdAt: string;
};
