import { type ParsedData, type ProductItem, type CustomerInfo } from './types';

function parseProducts(text: string): ProductItem[] {
  const productLines = text.match(/- \d+x (.*)/g) || [];
  
  return productLines.map(line => {
    // This regex handles both normal spaces and non-breaking spaces (\s) before R$
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
    
    // This regex stops before size or gender to get only the product name
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
    const deliverySectionMatch = text.match(/--- DADOS PARA ENTREGA ---\s*([\s\S]*)/);
    const deliveryText = deliverySectionMatch ? deliverySectionMatch[1].trim() : '';

    const getValue = (key: string, data: string) => {
        const regex = new RegExp(`${key}:\\s*(.+)`, 'i');
        const match = data.match(regex);
        return match ? match[1].trim() : 'N/A';
    };

    return {
        name: getValue('Nome', deliveryText),
        cpf: getValue('CPF', deliveryText),
        phone: getValue('Telefone', deliveryText),
        address: getValue('Endereço', deliveryText),
        neighborhood: getValue('Bairro', deliveryText),
        cityState: getValue('Cidade/Estado', deliveryText),
        cep: getValue('CEP', deliveryText),
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
  const productsSectionMatch = text.match(/--- RESUMO DO PEDIDO ---\s*([\s\S]*?)(?=--- DADOS PARA ENTREGA ---|Subtotal:)/);
  
  if (!productsSectionMatch) {
    throw new Error("Formato do texto inválido. Verifique se a seção 'RESUMO DO PEDIDO' existe.");
  }
  
  const productsText = productsSectionMatch[1] || '';
  
  const products = parseProducts(productsText);
  const customer = parseCustomerInfo(text);
  const subtotal = parseSubtotal(text);

  if (products.length === 0) {
    console.warn("Nenhum produto foi encontrado no texto do pedido. Verifique o formato.");
  }

  return { products, customer, subtotal };
}
