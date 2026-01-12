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
    
    const nameMatch = desc.match(/^(.*?)(?:\s\(Tamanho|\s\((Fêmea|Macho)\)|\s-)/);
    const name = nameMatch ? nameMatch[1] : 'Produto Desconhecido';

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
    const deliverySectionMatch = text.match(/--- DADOS PARA ENTREGA ---\s*([\s\S]*)/);
    const deliveryText = deliverySectionMatch ? deliverySectionMatch[1] : '';

    const getValue = (key: string) => {
        const regex = new RegExp(`^${key}:\\s*(.*?)$`, 'im');
        const match = deliveryText.match(regex);
        return match ? match[1].trim() : 'N/A';
    };

    return {
        name: getValue('Nome'),
        cpf: getValue('CPF'),
        phone: getValue('Telefone'),
        address: getValue('Endereço'),
        neighborhood: getValue('Bairro'),
        cityState: getValue('Cidade/Estado'),
        cep: getValue('CEP'),
    };
}

function parseSubtotal(text: string): number {
    const match = text.match(/Subtotal: R\$ ([\d,.]+)/);
    if (match) {
        return parseFloat(match[1].replace('.', '').replace(',', '.'));
    }
    return 0;
}


export function parseOrderText(text: string): ParsedData {
  const productsSectionMatch = text.match(/--- RESUMO DO PEDIDO ---\s*([\s\S]*?)\s*(?=--- DADOS PARA ENTREGA ---|Subtotal:)/);
  
  if (!productsSectionMatch) {
    throw new Error("Formato do texto inválido. Verifique se a seção 'RESUMO DO PEDIDO' existe.");
  }
  
  const productsText = productsSectionMatch[1] || '';
  
  const products = parseProducts(productsText);
  const customer = parseCustomerInfo(text); // Pass the full text
  const subtotal = parseSubtotal(text);

  if (products.length === 0) {
    console.warn("Nenhum produto foi encontrado no texto do pedido. Verifique o formato.");
  }

  return { products, customer, subtotal };
}
