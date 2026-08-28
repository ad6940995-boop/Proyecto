import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Navegacion } from "./navegacion/navegacion";
import { filter } from 'rxjs/operators';
import { FotosRestaurante } from "./fotos-restaurante/fotos-restaurante";
import { PlatosEstrellas } from "./platos-estrellas/platos-estrellas";
import { Informacion } from "./informacion/informacion";
import { Footer } from './footer/footer';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navegacion, FotosRestaurante, PlatosEstrellas, Informacion, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Proyecto');
  private router = inject(Router);
  esRutaInicio = true;

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd)
      )
      .subscribe((event) => {
        const url = event.urlAfterRedirects || '/';
        this.esRutaInicio = url === '/' || url === '/inicio';
      });
  }
}