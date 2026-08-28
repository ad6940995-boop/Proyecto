import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, DecimalPipe, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ComprasService } from '../servicios/compras';
import { ItemPedido } from '../entidades/item-pedidos';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DatosCliente {
  nombre: string;
  documento: string;
  correo: string;
  telefono: string;
  direccion: string;
}

@Component({
  selector: 'app-carrito',
  imports: [CommonModule, FormsModule, DecimalPipe],
  templateUrl: './carrito.html',
  styleUrl: './carrito.css',
})
export class Carrito implements OnInit {
  items: ItemPedido[] = [];

  // Datos de tu negocio — ajusta estos valores a los reales
  private readonly empresa = {
    nombre: 'Manila',
    direccion: 'Calle Principal 123',
    ciudad: 'Honda, Tolima',
  };

  private readonly IVA_PORCENTAJE = 19; // ajusta según tu país

  cliente: DatosCliente = {
    nombre: '',
    documento: '',
    correo: '',
    telefono: '',
    direccion: '',
  };

  mostrarErroresCliente = false;
  facturaGenerada = false;
  numeroFactura = '';

  constructor(
    private carrito: ComprasService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.items = this.carrito.obtenerItems();
    this.numeroFactura = this.generarNumeroFactura();
  }

  get subtotal(): number {
    return this.items.reduce((total, item) => total + item.precio * item.cantidad, 0);
  }

  get totalItems(): number {
    return this.items.reduce((total, item) => total + item.cantidad, 0);
  }

  get clienteValido(): boolean {
    return (
      this.cliente.nombre.trim().length > 0 &&
      this.cliente.documento.trim().length > 0 &&
      this.correoValido(this.cliente.correo) &&
      this.cliente.telefono.trim().length > 0 &&
      this.cliente.direccion.trim().length > 0
    );
  }

  private correoValido(correo: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim());
  }

  private generarNumeroFactura(): string {
    const fecha = new Date();
    const sufijo = Math.floor(1000 + Math.random() * 9000);
    return `FAC-${fecha.getFullYear()}${(fecha.getMonth() + 1).toString().padStart(2, '0')}${fecha.getDate().toString().padStart(2, '0')}-${sufijo}`;
  }

  aumentarCantidad(item: ItemPedido): void {
    this.carrito.actualizarCantidad(item.id, item.tipo, item.cantidad + 1);
    this.items = this.carrito.obtenerItems();
  }

  disminuirCantidad(item: ItemPedido): void {
    if (item.cantidad <= 1) {
      this.eliminarItem(item.id, item.tipo);
      return;
    }
    this.carrito.actualizarCantidad(item.id, item.tipo, item.cantidad - 1);
    this.items = this.carrito.obtenerItems();
  }

  eliminarItem(id: string, tipo: 'comida' | 'bebida'): void {
    this.carrito.eliminar(id, tipo);
    this.items = this.carrito.obtenerItems();
  }

  vaciarCarrito(): void {
    this.carrito.vaciar();
    this.items = [];
    this.facturaGenerada = false;
  }

  seguirComprando(): void {
    this.router.navigate(['/bebidas']);
  }

  descargarFactura(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (!this.clienteValido || this.items.length === 0) {
      this.mostrarErroresCliente = true;
      return;
    }
    this.mostrarErroresCliente = false;

    const doc = new jsPDF();
    const anchoPagina = doc.internal.pageSize.getWidth();
    const margen = 15;
    const colorAcento: [number, number, number] = [90, 65, 30]; // marrón elegante
    let y = 22;

    // ===== Encabezado =====
    doc.setFont('times', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(...colorAcento);
    doc.text(this.empresa.nombre, anchoPagina / 2, y, { align: 'center' });

    y += 7;
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(this.empresa.direccion, anchoPagina / 2, y, { align: 'center' });
    y += 5;
    doc.text(this.empresa.ciudad, anchoPagina / 2, y, { align: 'center' });

    // Línea decorativa con puntos en los extremos
    y += 6;
    doc.setDrawColor(...colorAcento);
    doc.setLineWidth(0.4);
    doc.line(margen + 25, y, anchoPagina - margen - 25, y);
    doc.setFillColor(...colorAcento);
    doc.circle(margen + 22, y, 0.8, 'F');
    doc.circle(anchoPagina - margen - 22, y, 0.8, 'F');

    // ===== Bloque Facturar a / Fechas =====
    y += 12;
    const colDerechaX = anchoPagina - margen - 55;

    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...colorAcento);
    doc.text('Facturar a', margen, y);
    doc.text('Fecha', colDerechaX, y);

    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.text(new Date().toLocaleDateString('es-CO'), anchoPagina - margen, y, { align: 'right' });

    y += 6;
    doc.text(this.cliente.nombre, margen, y);
    doc.setFont('times', 'bold');
    doc.setTextColor(...colorAcento);
    doc.text('N° de factura', colDerechaX, y);
    doc.setFont('times', 'normal');
    doc.setTextColor(30, 30, 30);
    doc.text(this.numeroFactura, anchoPagina - margen, y, { align: 'right' });

    y += 5;
    doc.text(this.cliente.direccion, margen, y);
    y += 5;
    doc.text(`Doc: ${this.cliente.documento}`, margen, y);
    y += 5;
    doc.text(`${this.cliente.correo}  ·  ${this.cliente.telefono}`, margen, y);

    // ===== Tabla de productos =====
    y += 10;
    const filas = this.items.map(item => [
      String(item.cantidad),
      item.nombre,
      `$${item.precio.toLocaleString('es-CO')}`,
      `$${(item.precio * item.cantidad).toLocaleString('es-CO')}`,
    ]);

    autoTable(doc, {
      startY: y,
      head: [['CANT.', 'DESCRIPCIÓN', 'PRECIO UNITARIO', 'IMPORTE']],
      body: filas,
      theme: 'plain',
      styles: {
        font: 'times',
        fontSize: 10,
        textColor: [30, 30, 30],
        cellPadding: 3,
        lineColor: colorAcento,
        lineWidth: 0.2,
      },
      headStyles: {
        font: 'times',
        fontStyle: 'bold',
        textColor: colorAcento,
        lineColor: colorAcento,
        lineWidth: { bottom: 0.5, top: 0.2, left: 0.2, right: 0.2 } as any,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 20 },
        1: { cellWidth: 90 },
        2: { halign: 'right', cellWidth: 35 },
        3: { halign: 'right', cellWidth: 35 },
      },
      margin: { left: margen, right: margen },
      tableLineColor: colorAcento,
      tableLineWidth: 0.3,
    });

    // ===== Totales =====
    const iva = this.subtotal * (this.IVA_PORCENTAJE / 100);
    const total = this.subtotal + iva;
    let yTotales = (doc as any).lastAutoTable.finalY + 8;
    const xEtiqueta = anchoPagina - margen - 55;

    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text('Subtotal', xEtiqueta, yTotales);
    doc.text(`$${this.subtotal.toLocaleString('es-CO')}`, anchoPagina - margen, yTotales, { align: 'right' });

    yTotales += 6;
    doc.text(`IVA ${this.IVA_PORCENTAJE}%`, xEtiqueta, yTotales);
    doc.text(`$${iva.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`, anchoPagina - margen, yTotales, { align: 'right' });

    yTotales += 3;
    doc.setDrawColor(...colorAcento);
    doc.setLineWidth(0.3);
    doc.line(xEtiqueta, yTotales, anchoPagina - margen, yTotales);

    yTotales += 8;
    doc.setFont('times', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...colorAcento);
    doc.text('TOTAL FACTURA', xEtiqueta, yTotales);
    doc.text(`$${total.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`, anchoPagina - margen, yTotales, { align: 'right' });

    // Línea decorativa antes del pie
    let yPie = yTotales + 18;
    doc.setDrawColor(...colorAcento);
    doc.setLineWidth(0.4);
    doc.line(margen + 25, yPie, anchoPagina - margen - 25, yPie);
    doc.setFillColor(...colorAcento);
    doc.circle(margen + 22, yPie, 0.8, 'F');
    doc.circle(anchoPagina - margen - 22, yPie, 0.8, 'F');

    // ===== Condiciones y forma de pago =====
    yPie += 12;
    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...colorAcento);
    doc.text('Condiciones y forma de pago', margen, yPie);

    yPie += 6;
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text('El pago se realizará contra entrega del pedido.', margen, yPie);
    yPie += 5;
    doc.text('Gracias por confiar en nosotros.', margen, yPie);

    doc.save(`${this.numeroFactura}.pdf`);
    this.facturaGenerada = true;
  }
}