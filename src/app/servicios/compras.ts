import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ItemPedido } from '../entidades/item-pedidos';

@Injectable({ providedIn: 'root' })
export class ComprasService {
  private readonly itemsSubject = new BehaviorSubject<ItemPedido[]>([]);
  readonly items$ = this.itemsSubject.asObservable();

  agregar(item: ItemPedido, cantidad: number = 1): void {
    const actuales = this.itemsSubject.value;
    const existente = actuales.find(actual => actual.id === item.id && actual.tipo === item.tipo);

    if (existente) {
      existente.cantidad += cantidad;
      this.itemsSubject.next([...actuales]);
      return;
    }

    this.itemsSubject.next([...actuales, { ...item, cantidad }]);
  }

  quitar(id: string, tipo: 'comida' | 'bebida'): void {
    this.itemsSubject.next(
      this.itemsSubject.value.filter(item => !(item.id === id && item.tipo === tipo))
    );
  }

  eliminar(id: string, tipo: 'comida' | 'bebida'): void {
    this.quitar(id, tipo);
  }

  actualizarCantidad(id: string, tipo: 'comida' | 'bebida', cantidad: number): void {
    if (cantidad < 1) return;

    const item = this.itemsSubject.value.find(actual => actual.id === id && actual.tipo === tipo);
    if (!item) return;

    item.cantidad = cantidad;
    this.itemsSubject.next([...this.itemsSubject.value]);
  }

  obtenerItems(): ItemPedido[] {
    return this.itemsSubject.value;
  }

  cantidadTotalItems(): number {
    return this.itemsSubject.value.reduce((total, item) => total + item.cantidad, 0);
  }

  total(): number {
    return this.itemsSubject.value.reduce((total, item) => total + item.precio * item.cantidad, 0);
  }

  vaciar(): void {
    this.itemsSubject.next([]);
  }
}
