export type PaymentMethod = 'cash' | 'gcash' | 'maya' | 'utang';

export type InventoryMovementType = 'receive' | 'adjust' | 'sale' | 'void';

export interface Category {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  barcode: string | null;
  category_id: string | null;
  price: number;
  cost: number;
  stock: number;
  low_stock_threshold: number;
  unit: string;
  is_favorite: boolean;
  favorite_order: number;
  created_at: string;
  updated_at: string;
  category?: Category | null;
}

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  balance: number;
  is_shortcut: boolean;
  shortcut_order: number;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string | null;
  product_name: string;
  qty: number;
  unit_price: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  receipt_no: string;
  client_id: string | null;
  total_amount: number;
  amount_paid: number;
  change_amount: number;
  discount: number;
  payment_method: PaymentMethod;
  customer_id: string | null;
  note: string | null;
  is_voided: boolean;
  created_at: string;
  sale_items?: SaleItem[];
  customer?: Customer | null;
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  type: InventoryMovementType;
  qty_change: number;
  new_qty: number;
  reason: string | null;
  supplier_id: string | null;
  cost: number | null;
  created_at: string;
  product?: Product | null;
  supplier?: Supplier | null;
}

export interface Settings {
  id: string;
  store_name: string;
  owner_name: string | null;
  pin: string;
  gcash_number: string | null;
  maya_number: string | null;
  receipt_header: string | null;
  receipt_footer: string | null;
  idle_timeout_minutes: number;
  dark_mode: boolean;
  created_at: string;
}

export interface CartItem {
  product: Product;
  qty: number;
}

export interface HeldSale {
  id: string;
  label: string;
  items: CartItem[];
  customerId: string | null;
  createdAt: number;
}
