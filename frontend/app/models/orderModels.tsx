export interface Address {
  id: number;
  order_id: number;
  type: string;
  name: string;
  address_line_1: string;
  address_line_2: string | null;
  postal_code: string;
  city: string;
  country: string;
  created_at: string;
  pick_up_point_id: string | null;
}

export interface OrderLine {
  id: number;
  order_id: number;
  product_id: string;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface OrderLog {
  id: number;
  order_id: number;
  created_by_type: string;
  created_by_admin_id: number;
  message: string;
  created_at: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface Order {
  id: number;
  order_number: string;
  customer_id: number;
  status: string;
  total_amount: number | null;
  currency: string | null;
  shipping_method_id: string | null;
  shipping_amount: number | null;
  shipping_tracking_number: string | null;
  shipping_tracking_url: string | null;
  created_at: string;
  updated_at: string;
  customer: Customer | null;
  order_lines: OrderLine[];
  addresses: Address[];
  logs: OrderLog[];
}

export interface Product {
  _id: string;
  title: string;
  slug: { current: string };
  patternId: string;
}