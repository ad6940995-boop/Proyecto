import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComprasService } from '../servicios/compras';
import { ItemPedido } from '../entidades/item-pedidos';
import { CocktailApiService } from '../servicios/bebida';
import { forkJoin } from 'rxjs';
import { Router } from '@angular/router';

interface BebidaApi {
  idDrink: string;
  strDrink: string;
  strDrinkThumb: string;
  tipo: 'alcoholica' | 'sin alcohol';
  categoria: 'bebida ordinaria' | 'coctel' | 'otras';
  precio: number;
  destacada?: boolean;
}

interface BebidaApiBasica {
  idDrink: string;
  strDrink: string;
  strDrinkThumb: string;
}

interface DetalleBebida {
  idDrink: string;
  strDrink: string;
  strInstructions: string;
  [campo: string]: string | null | undefined;
}

@Component({
  selector: 'app-bebidas',
  imports: [CommonModule, FormsModule, DecimalPipe],
  templateUrl: './bebidas.html',
  styleUrl: './bebidas.css',
})
export class Bebidas implements OnInit {
  bebidas: BebidaApi[] = [];
  nombreBuscado = '';
  ingredienteBuscado = '';
  idsPorNombre: Set<string> | null = null;
  idsPorIngrediente: Set<string> | null = null;
  cargandoIngrediente = false;
  errorIngrediente = '';
  detalleSeleccionado: DetalleBebida | null = null;
  idDetalleSolicitado = '';
  cargandoDetalle = false;
  errorDetalle = '';
  tipoSeleccionado = 'todos';
  categoriaSeleccionada = 'todas';
  cargando = true;
  error = '';

  constructor(
    private carrito: ComprasService,
    private cocktailApi: CocktailApiService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    forkJoin({
      ordinarias: this.cocktailApi.obtenerPorCategoria('Ordinary_Drink'),
      cocteles: this.cocktailApi.obtenerPorCategoria('Cocktail'),
      alcoholicas: this.cocktailApi.obtenerPorTipo('Alcoholic'),
      sinAlcohol: this.cocktailApi.obtenerPorTipo('Non_Alcoholic'),
      estrella: this.cocktailApi.buscarPorNombre('Mojito'),
    }).subscribe({
      next: respuestas => {
        const tipos = new Map<string, BebidaApi['tipo']>([
          ...(respuestas.sinAlcohol.drinks ?? []).map((bebida: BebidaApiBasica) => [bebida.idDrink, 'sin alcohol' as const]),
          ...(respuestas.alcoholicas.drinks ?? []).map((bebida: BebidaApiBasica) => [bebida.idDrink, 'alcoholica' as const]),
        ]);
        const categorias = new Map<string, BebidaApi['categoria']>([
          ...(respuestas.ordinarias.drinks ?? []).map((bebida: BebidaApiBasica) => [bebida.idDrink, 'bebida ordinaria' as const]),
          ...(respuestas.cocteles.drinks ?? []).map((bebida: BebidaApiBasica) => [bebida.idDrink, 'coctel' as const]),
        ]);
        const bebidasPorTipo = [...(respuestas.sinAlcohol.drinks ?? []), ...(respuestas.alcoholicas.drinks ?? [])]
          .map((bebida: BebidaApiBasica) => ({
            ...bebida,
            categoria: categorias.get(bebida.idDrink) ?? 'otras',
            tipo: tipos.get(bebida.idDrink)!,
            precio: this.precioAleatorio(6000, 30000),
          }));
        const estrella = respuestas.estrella.drinks?.[0] as BebidaApiBasica | undefined;
        this.bebidas = this.combinarBebidas(
          estrella && tipos.has(estrella.idDrink)
            ? [{ ...estrella, tipo: tipos.get(estrella.idDrink)!, categoria: categorias.get(estrella.idDrink) ?? 'otras', precio: this.precioAleatorio(8000, 30000), destacada: true }]
            : [],
          bebidasPorTipo,
        );
        this.cargando = false;
        this.recargar();
      },
      error: () => {
        this.error = 'No se pudieron cargar las bebidas.';
        this.cargando = false;
        this.recargar();
      },
    });
  }

  recargar(): void {
    setTimeout(() => this.cd.detectChanges(), 500);
  }

  volverArriba(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private precioAleatorio(minimo: number, maximo: number): number {
    const pasos = Math.floor((maximo - minimo) / 500);
    return minimo + Math.floor(Math.random() * (pasos + 1)) * 500;
  }

  private combinarBebidas(principales: BebidaApi[], secundarias: BebidaApi[]): BebidaApi[] {
    const mapa = new Map<string, BebidaApi>();
    [...principales, ...secundarias].forEach(bebida => {
      const anterior = mapa.get(bebida.idDrink);
      mapa.set(bebida.idDrink, { ...bebida, destacada: anterior?.destacada || bebida.destacada });
    });
    return [...mapa.values()];
  }

  get bebidasFiltradas(): BebidaApi[] {
    const nombre = this.nombreBuscado.trim().toLowerCase();

    return this.bebidas.filter(bebida =>
      bebida.strDrink.toLowerCase().includes(nombre) &&
      (!nombre || this.idsPorNombre?.has(bebida.idDrink) === true) &&
      (!this.ingredienteBuscado.trim() || this.idsPorIngrediente?.has(bebida.idDrink) === true) &&
      (this.tipoSeleccionado === 'todos' || bebida.tipo === this.tipoSeleccionado) &&
      (this.categoriaSeleccionada === 'todas' || bebida.categoria === this.categoriaSeleccionada),
    );
  }

  get bebidasConAlcohol(): BebidaApi[] {
    return this.bebidasFiltradas.filter(b => b.tipo === 'alcoholica');
  }

  get bebidasSinAlcohol(): BebidaApi[] {
    return this.bebidasFiltradas.filter(b => b.tipo === 'sin alcohol');
  }

  buscarPorNombre(valor: string): void {
    this.nombreBuscado = valor;
    const nombre = valor.trim();
    if (!nombre) {
      this.idsPorNombre = null;
      this.recargar();
      return;
    }

    this.cocktailApi.buscarPorNombre(nombre).subscribe({
      next: respuesta => {
        this.idsPorNombre = new Set((respuesta.drinks ?? []).map((bebida: BebidaApiBasica) => bebida.idDrink));
        this.recargar();
      },
      error: () => {
        this.idsPorNombre = new Set();
        this.recargar();
      },
    });
    this.recargar();
  }

  buscarPorIngrediente(valor: string): void {
    this.ingredienteBuscado = valor;
    const ingrediente = valor.trim();
    this.errorIngrediente = '';
    if (!ingrediente) {
      this.idsPorIngrediente = null;
      this.cargandoIngrediente = false;
      this.recargar();
      return;
    }

    this.cargandoIngrediente = true;
    this.cocktailApi.obtenerPorIngrediente(ingrediente).subscribe({
      next: respuesta => {
        this.idsPorIngrediente = new Set((respuesta.drinks ?? []).map((bebida: BebidaApiBasica) => bebida.idDrink));
        this.cargandoIngrediente = false;
        if (this.idsPorIngrediente.size === 0) {
          this.errorIngrediente = 'No se encontró ese ingrediente.';
        }
        this.recargar();
      },
      error: () => {
        this.idsPorIngrediente = new Set();
        this.cargandoIngrediente = false;
        this.errorIngrediente = 'No se pudo consultar el ingrediente.';
        this.recargar();
      },
    });
  }

  filtrarPorTipo(valor: string): void {
    this.tipoSeleccionado = valor;
    this.recargar();
  }

  filtrarPorCategoria(valor: string): void {
    this.categoriaSeleccionada = valor;
    this.recargar();
  }

  verDetalles(idDrink: string): void {
    if (this.detalleSeleccionado?.idDrink === idDrink) {
      this.detalleSeleccionado = null;
      this.idDetalleSolicitado = '';
      this.errorDetalle = '';
      this.recargar();
      return;
    }

    this.idDetalleSolicitado = idDrink;
    this.cargandoDetalle = true;
    this.errorDetalle = '';
    this.detalleSeleccionado = null;
    this.cocktailApi.obtenerDetalle(idDrink).subscribe({
      next: respuesta => {
        this.detalleSeleccionado = respuesta.drinks?.[0] ?? null;
        this.cargandoDetalle = false;
        if (!this.detalleSeleccionado) {
          this.errorDetalle = 'No se encontraron los detalles de esta bebida.';
        }
        this.recargar();
      },
      error: () => {
        this.cargandoDetalle = false;
        this.errorDetalle = 'No se pudieron cargar los detalles.';
        this.recargar();
      },
    });
    this.recargar();
  }

  obtenerIngredientesDetalle(detalle: DetalleBebida): { nombre: string; medida: string }[] {
    return Array.from({ length: 15 }, (_, indice) => indice + 1)
      .map(indice => ({
        nombre: detalle[`strIngredient${indice}`]?.trim() ?? '',
        medida: detalle[`strMeasure${indice}`]?.trim() ?? '',
      }))
      .filter(ingrediente => ingrediente.nombre);
  }

  agregarAlCarrito(item: Omit<ItemPedido, 'cantidad'>): void {
    this.carrito.agregar({ ...item, cantidad: 1 });
    this.router.navigate(['/carrito']);
    this.recargar();
  }
}