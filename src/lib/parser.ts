import { type ParsedData, type ProductItem, type CustomerInfo } from './types';

function parseProducts(text: string): ProductItem[] {
  const productLines = text.match(/- \d+x (.*)/g) || [];
  
  return productLines.map(line => {
    const match = line.match(/- (?<quantity>\d+)x (?<desc>.*?)\s+-\s+R\$\s+(?<price>[\d,.]+)/);
    if (!match || !match.groups) {
      console.error(`Could not parse product line: ${line}`);
      throw new Error(`Could not parse product line: ${line}`);
    }
    
    const { quantity, desc, price } = match.groups;
    const quant = parseInt(quantity, 10);
    const totalPrice = parseFloat(price.replace('.', '').replace(',', '.'));
    const unitPrice = totalPrice / quant;

    let type: 'CÃO' | 'GATO' | 'UNKNOWN' = 'UNKNOWN';
    if (desc.toLowerCase().includes('cães')) type = 'CÃO';
    if (desc.toLowerCase().includes('gatos')) type = 'GATO';

    const sizeMatch = desc.match(/\(Tamanho (\d+|0\d)\)/);
    const size = sizeMatch ? `Nº ${sizeMatch[1]}` : 'N/A';
    
    const nameMatch = desc.match(/^(.*?)(?:\s\(Tamanho|\s\((?:Fêmea|Macho)\)|$)/);
    let name = nameMatch ? nameMatch[1].trim() : 'Produto Desconhecido';

    const genderMatch = desc.match(/\((Fêmea|Macho)\)/);
    const gender = genderMatch ? genderMatch[1] : undefined;

    return {
      quantity: quant,
      description: desc.trim(),
      totalPrice,
      unitPrice,
      type,
      size,
      name: name.trim(),
      gender
    };
  });
}

function parseCustomerInfo(text: string): CustomerInfo {
    const lines = text.split('\n');
    const customer: CustomerInfo = {
        name: 'N/A',
        cpf: 'N/A',
        phone: 'N/A',
        address: 'N/A',
        neighborhood: 'N/A',
        cityState: 'N/A',
        cep: 'N/A',
    };

    let inDeliverySection = false;

    for (const line of lines) {
        if (line.includes('--- DADOS PARA ENTREGA ---')) {
            inDeliverySection = true;
            continue;
        }

        if (inDeliverySection || !text.includes('--- DADOS PARA ENTREGA ---')) {
            const parts = line.split(':');
            if (parts.length < 2) continue;

            const key = parts[0].trim().toLowerCase();
            const value = parts.slice(1).join(':').trim();

            if (key === 'nome') customer.name = value;
            else if (key === 'cpf') customer.cpf = value;
            else if (key === 'telefone') customer.phone = value;
            else if (key === 'endereço') customer.address = value;
            else if (key === 'bairro') customer.neighborhood = value;
            else if (key === 'cidade/estado') customer.cityState = value;
            else if (key === 'cep') customer.cep = value;
        }
    }

    return customer;
}


function parseSubtotal(text: string): number {
    const match = text.match(/Subtotal: R\$ ([\d,.]+)/);
    if (match) {
        return parseFloat(match[1].replace('.', '').replace(',', '.'));
    }
    return 0;
}


export function parseOrderText(text: string): ParsedData {
  const products = parseProducts(text);
  const customer = parseCustomerInfo(text);
  const subtotal = parseSubtotal(text);

  if (products.length === 0 && text.includes('--- RESUMO DO PEDIDO ---')) {
    console.warn("Nenhum produto foi encontrado no texto do pedido. Verifique o formato.");
  }

  return { products, customer, subtotal };
}
