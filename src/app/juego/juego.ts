import { Component } from '@angular/core';

interface Carta {
  id: number;
  pareja: number;
  nombre: string;
  imagen: string;
  tipo: 'comida' | 'bebida';
  volteada: boolean;
  encontrada: boolean;
}

@Component({
  selector: 'app-juego',
  standalone: true,
  imports: [],
  templateUrl: './juego.html',
  styleUrl: './juego.css'
})
export class Juego {

  cartas: Carta[] = [];

  intentos: number = 0;

  parejasEncontradas: number = 0;

  ganaste: boolean = false;

  private primeraCarta: Carta | null = null;

  private segundaCarta: Carta | null = null;

  private bloqueado: boolean = false;


  ngOnInit(): void {
    this.nuevoJuego();
  }


  // ==========================================
  // INICIAR NUEVO JUEGO
  // ==========================================

  nuevoJuego(): void {

    this.intentos = 0;

    this.parejasEncontradas = 0;

    this.ganaste = false;

    this.primeraCarta = null;

    this.segundaCarta = null;

    this.bloqueado = false;


    // ==========================================
    // COMIDAS Y BEBIDAS
    // ==========================================

    const parejas = [

      // --------------------------
      // COMIDAS
      // --------------------------

      {
        pareja: 1,
        nombre: 'Benedictinos de Salmón',
        imagen:
          'https://www.themealdb.com/images/media/meals/1550440197.jpg',
        tipo: 'comida' as const
      },

      {
        pareja: 2,
        nombre: 'Panqueques de Vainilla',
        imagen:
          'https://www.themealdb.com/images/media/meals/rwuyqx1511383174.jpg',
        tipo: 'comida' as const
      },

      {
        pareja: 3,
        nombre: 'Atún Nicoise',
        imagen:
          'https://www.themealdb.com/images/media/meals/yypwwq1511304979.jpg',
        tipo: 'comida' as const
      },

      {
        pareja: 4,
        nombre: 'Pollo Cremoso con Mostaza',
        imagen:
          'https://www.themealdb.com/images/media/meals/4htbtm1783803558.jpg',
        tipo: 'comida' as const
      },


      // --------------------------
      // BEBIDAS
      // --------------------------

      {
        pareja: 5,
        nombre: 'Mojito',
        imagen:
          'https://www.thecocktaildb.com/images/media/drink/metwgh1606770327.jpg',
        tipo: 'bebida' as const
      },

      {
        pareja: 6,
        nombre: 'Negroni',
        imagen:
          'https://www.thecocktaildb.com/images/media/drink/qgdu971561574065.jpg',
        tipo: 'bebida' as const
      },

      {
        pareja: 7,
        nombre: 'Martini',
        imagen:
          'https://www.thecocktaildb.com/images/media/drink/6ck9yi1589574317.jpg',
        tipo: 'bebida' as const
      },

      {
        pareja: 8,
        nombre: 'Margarita',
        imagen:
          'https://www.thecocktaildb.com/images/media/drink/5noda61589575158.jpg',
        tipo: 'bebida' as const
      }

    ];


    // ==========================================
    // CREAR LAS DOS CARTAS DE CADA PAREJA
    // ==========================================

    const cartas: Carta[] = [];

    parejas.forEach((pareja) => {

      // Primera carta

      cartas.push({
        id: pareja.pareja * 10 + 1,
        pareja: pareja.pareja,
        nombre: pareja.nombre,
        imagen: pareja.imagen,
        tipo: pareja.tipo,
        volteada: false,
        encontrada: false
      });


      // Segunda carta

      cartas.push({
        id: pareja.pareja * 10 + 2,
        pareja: pareja.pareja,
        nombre: pareja.nombre,
        imagen: pareja.imagen,
        tipo: pareja.tipo,
        volteada: false,
        encontrada: false
      });

    });


    // ==========================================
    // MEZCLAR LAS CARTAS
    // ==========================================

    this.cartas = this.mezclar(cartas);

  }


  // ==========================================
  // MÉTODO PARA MEZCLAR
  // ==========================================

  mezclar(cartas: Carta[]): Carta[] {

    const resultado = [...cartas];

    for (let i = resultado.length - 1; i > 0; i--) {

      const j = Math.floor(Math.random() * (i + 1));

      [resultado[i], resultado[j]] =
        [resultado[j], resultado[i]];

    }

    return resultado;

  }


  // ==========================================
  // VOLTEAR CARTA
  // ==========================================

  voltearCarta(carta: Carta): void {

    // No permitir clics mientras se comparan
    // las dos cartas

    if (this.bloqueado) {
      return;
    }


    // No permitir seleccionar una carta
    // que ya fue encontrada

    if (carta.encontrada) {
      return;
    }


    // No permitir seleccionar nuevamente
    // la primera carta

    if (carta === this.primeraCarta) {
      return;
    }


    // Voltear carta

    carta.volteada = true;


    // ==========================================
    // PRIMERA CARTA
    // ==========================================

    if (!this.primeraCarta) {

      this.primeraCarta = carta;

      return;

    }


    // ==========================================
    // SEGUNDA CARTA
    // ==========================================

    this.segundaCarta = carta;

    this.intentos++;

    this.comprobarPareja();

  }


  comprobarPareja(): void {

    if (
      !this.primeraCarta ||
      !this.segundaCarta
    ) {
      return;
    }


    // Bloquear tablero temporalmente

    this.bloqueado = true;


    if (
      this.primeraCarta.pareja ===
      this.segundaCarta.pareja
    ) {

      this.primeraCarta.encontrada = true;

      this.segundaCarta.encontrada = true;


      this.parejasEncontradas++;


      this.limpiarSeleccion();


      // ========================================
      // COMPROBAR SI GANÓ
      // ========================================

      if (this.parejasEncontradas === 8) {

        setTimeout(() => {

          this.ganaste = true;

        }, 500);

      }

    }


    // ==========================================
    // SI NO SON IGUALES
    // ==========================================

    else {

      setTimeout(() => {

        if (this.primeraCarta) {

          this.primeraCarta.volteada = false;

        }


        if (this.segundaCarta) {

          this.segundaCarta.volteada = false;

        }


        this.limpiarSeleccion();

      }, 1000);

    }

  }



  limpiarSeleccion(): void {

    this.primeraCarta = null;

    this.segundaCarta = null;

    this.bloqueado = false;

  }

}