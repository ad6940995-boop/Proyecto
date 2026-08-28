import { ItemPedido } from './item-pedidos';

describe('ItemPedido', () => {
  it('should accept a valid order item', () => {
    const item: ItemPedido = {
      id: '1',
      tipo: 'comida',
      nombre: 'Hamburguesa',
      precio: 15000,
      cantidad: 1,
    };

    expect(item).toBeTruthy();
  });
});
