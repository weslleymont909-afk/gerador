export interface ProductItem {
  quantity: number;
  description: string;
  totalPrice: number;
  unitPrice: number;
  type: 'CÃO' | 'GATO' | 'UNKNOWN';
  size: string;
  name: string;
  gender?: string;
}

export interface CustomerInfo {
  name: string;
  cpf: string;
  phone: string;
  address: string;
  neighborhood: string;
  cityState: string;
  cep: string;
}

export interface ParsedData {
  products: ProductItem[];
  customer: CustomerInfo;
  subtotal: number;
}
