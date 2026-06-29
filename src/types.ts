export interface Delivery {
  date: string;
  delivered: number;
  collected: number;
  amount: number;
  paidStatus: 'paid' | 'pending';
}

export interface PaymentRecord {
  date: string;
  amount: number;
  note: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address: string;
  mapLink?: string;
  agent?: string;
  notes?: string;
  deliveryTime?: string;
  jarsAtCustomer: number;
  monthlyPlan: number;
  ratePerJar: number;
  payType: 'perDelivery' | 'monthly';
  monthlyAmt?: number;
  deliveries: Delivery[];
  payments: PaymentRecord[];
  addedOn: string;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  notes?: string;
}

export type UserRole = 'owner' | 'boy' | 'kharche' | null;
