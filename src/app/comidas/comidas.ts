import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComprasService } from '../servicios/compras';
import { ItemPedido } from '../entidades/item-pedidos';
import { MealApiService } from '../servicios/comida';
import { catchError, forkJoin, of } from 'rxjs';
import { Router } from '@angular/router';

type CategoriaTienda = 'Desayuno' | 'Almuerzo' | 'Cena' | 'Postre';

interface ComidaApi {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
  strCategory?: string;
  precio: number;
  categoriaTienda: CategoriaTienda;
  destacada?: boolean;
}

interface DetalleComida {
  idMeal: string;
  strMeal: string;
  strInstructions: string;
  [campo: string]: string | null | undefined;
}

@Component({
  selector: 'app-comidas',
  imports: [CommonModule, FormsModule, DecimalPipe],
  templateUrl: './comidas.html',
  styleUrl: './comidas.css',
})
export class Comidas implements OnInit {
  comidas: ComidaApi[] = [];
  nombreBuscado = '';
  ingredienteBuscado = '';
  resultadosBusqueda: ComidaApi[] | null = null;
  categoriaActiva = 'Todas';

  detalleSeleccionado: DetalleComida | null = null;
  idDetalleSolicitado = '';
  cargandoDetalle = false;
  errorDetalle = '';

  cargando = true;
  error = '';

  constructor(
    private carrito: ComprasService,
    private mealApi: MealApiService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarComidas();
  }

  recargar(): void {
    setTimeout(() => this.cd.detectChanges(), 500);
  }

  volverArriba(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private cargarComidas(): void {
    this.mealApi.obtenerCategorias().subscribe({
      next: (respuesta: { categories: { strCategory: string }[] }) => {
        const categoriasApi = respuesta.categories?.map(c => c.strCategory) ?? [];
        const peticiones = categoriasApi.map(categoria =>
          this.mealApi.obtenerPorCategoria(categoria).pipe(
            catchError(() => of({ meals: [] }))
          )
        );

        if (peticiones.length === 0) {
          this.error = 'No se encontraron categorías de comidas.';
          this.cargando = false;
          this.recargar();
          return;
        }

        forkJoin(peticiones).subscribe({
          next: listados => {
            const todas: ComidaApi[] = listados.flatMap((listado: any, indice: number) =>
              (listado.meals ?? []).map((comida: any) => ({
                idMeal: comida.idMeal,
                strMeal: comida.strMeal,
                strMealThumb: comida.strMealThumb,
                precio: this.precioAleatorio(12000, 42000),
                categoriaTienda: this.mapearCategoriaTienda(categoriasApi[indice]),
              })),
            );

            this.comidas = todas;
            this.cargando = false;
            this.cargarEstrella();
            this.recargar();
          },
          error: () => {
            this.error = 'No se pudieron cargar las comidas.';
            this.cargando = false;
            this.recargar();
          },
        });
      },
      error: () => {
        this.error = 'No se pudieron cargar las comidas.';
        this.cargando = false;
        this.recargar();
      },
    });
  }

  private cargarEstrella(): void {
    this.mealApi.buscarPorNombre('Katsu').subscribe({
      next: respuesta => {
        const estrella = respuesta.meals?.[0];
        if (!estrella) return;

        const existente = this.comidas.find(c => c.idMeal === estrella.idMeal);
        const comidaEstrella: ComidaApi = {
          idMeal: estrella.idMeal,
          strMeal: estrella.strMeal,
          strMealThumb: estrella.strMealThumb,
          precio: existente?.precio ?? this.precioAleatorio(15000, 45000),
          categoriaTienda: existente?.categoriaTienda ?? this.mapearCategoriaTienda((estrella as any).strCategory ?? ''),
          destacada: true,
        };

        this.comidas = this.combinarComidas([comidaEstrella], this.comidas);
        this.recargar();
      },
      error: () => {},
    });
  }

  private mapearCategoriaTienda(categoriaApi: string): CategoriaTienda {
    const desayuno = ['Breakfast'];
    const postre = ['Dessert'];
    const almuerzo = ['Starter', 'Side', 'Vegetarian', 'Vegan', 'Pasta', 'Chicken'];

    if (desayuno.includes(categoriaApi)) return 'Desayuno';
    if (postre.includes(categoriaApi)) return 'Postre';
    if (almuerzo.includes(categoriaApi)) return 'Almuerzo';
    return 'Cena';
  }

  private precioAleatorio(minimo: number, maximo: number): number {
    const pasos = Math.floor((maximo - minimo) / 500);
    return minimo + Math.floor(Math.random() * (pasos + 1)) * 500;
  }

  private combinarComidas(principales: ComidaApi[], secundarias: ComidaApi[]): ComidaApi[] {
    const mapa = new Map<string, ComidaApi>();
    [...principales, ...secundarias].forEach(comida => {
      const anterior = mapa.get(comida.idMeal);
      mapa.set(comida.idMeal, { ...comida, destacada: anterior?.destacada || comida.destacada });
    });
    return [...mapa.values()];
  }

  get comidasPorCategoria(): Record<CategoriaTienda, ComidaApi[]> {
    const grupos: Record<CategoriaTienda, ComidaApi[]> = {
      Desayuno: [],
      Almuerzo: [],
      Cena: [],
      Postre: [],
    };
    this.comidas.forEach(comida => grupos[comida.categoriaTienda].push(comida));
    return grupos;
  }

  private enriquecer(meal: any): ComidaApi {
    const existente = this.comidas.find(c => c.idMeal === meal.idMeal);
    return {
      idMeal: meal.idMeal,
      strMeal: meal.strMeal,
      strMealThumb: meal.strMealThumb,
      precio: existente?.precio ?? this.precioAleatorio(12000, 42000),
      categoriaTienda: existente?.categoriaTienda ?? this.mapearCategoriaTienda(meal.strCategory ?? ''),
      destacada: existente?.destacada,
    };
  }

  onBuscarNombre(valor: string): void {
    this.nombreBuscado = valor;
    const nombre = valor.trim();

    if (!nombre && !this.ingredienteBuscado.trim()) {
      this.resultadosBusqueda = null;
      this.recargar();
      return;
    }
    if (!nombre) return;

    this.mealApi.buscarPorNombre(nombre).subscribe({
      next: respuesta => {
        const meals = respuesta.meals ?? [];
        this.resultadosBusqueda = meals.map((m: any) => this.enriquecer(m));
        this.recargar();
      },
      error: () => {
        this.resultadosBusqueda = [];
        this.recargar();
      },
    });
  }

  onBuscarIngrediente(valor: string): void {
    this.ingredienteBuscado = valor;
    const ingrediente = valor.trim();

    if (!ingrediente && !this.nombreBuscado.trim()) {
      this.resultadosBusqueda = null;
      this.recargar();
      return;
    }
    if (!ingrediente) return;

    this.mealApi.obtenerPorIngrediente(ingrediente).subscribe({
      next: respuesta => {
        const meals = respuesta.meals ?? [];
        this.resultadosBusqueda = meals.map((m: any) => this.enriquecer(m));
        this.recargar();
      },
      error: () => {
        this.resultadosBusqueda = [];
        this.recargar();
      },
    });
  }

  filtrarCategoria(categoria: string): void {
    this.categoriaActiva = categoria;
    this.recargar();
  }

  limpiarBusqueda(): void {
    this.nombreBuscado = '';
    this.ingredienteBuscado = '';
    this.resultadosBusqueda = null;
    this.recargar();
  }

  verDetalles(idMeal: string): void {
    if (this.detalleSeleccionado?.idMeal === idMeal) {
      this.detalleSeleccionado = null;
      this.idDetalleSolicitado = '';
      this.errorDetalle = '';
      this.recargar();
      return;
    }

    this.cargandoDetalle = true;
    this.idDetalleSolicitado = idMeal;
    this.errorDetalle = '';
    this.detalleSeleccionado = null;

    this.mealApi.obtenerDetalle(idMeal).subscribe({
      next: respuesta => {
        this.detalleSeleccionado = respuesta.meals?.[0] ?? null;
        this.cargandoDetalle = false;
        if (!this.detalleSeleccionado) {
          this.errorDetalle = 'No se encontraron los detalles de esta comida.';
        }
        this.recargar();
      },
      error: () => {
        this.cargandoDetalle = false;
        this.errorDetalle = 'No se pudieron cargar los detalles.';
        this.recargar();
      },
    });
  }

  obtenerIngredientesDetalle(detalle: DetalleComida): { nombre: string; medida: string }[] {
    return Array.from({ length: 20 }, (_, indice) => indice + 1)
      .map(indice => ({
        nombre: detalle[`strIngredient${indice}`]?.trim() ?? '',
        medida: detalle[`strMeasure${indice}`]?.trim() ?? '',
      }))
      .filter(ingrediente => ingrediente.nombre);
  }

  agregarAlCarrito(item: Omit<ItemPedido, 'cantidad'>): void {
    this.carrito.agregar({ ...item, cantidad: 1 });
    this.router.navigate(['/carrito']);
  }
}