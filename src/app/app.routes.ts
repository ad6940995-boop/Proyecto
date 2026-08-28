import { Routes } from '@angular/router';
import { Bebidas } from './bebidas/bebidas';
import { Comidas } from './comidas/comidas';
import { FotosRestaurante } from './fotos-restaurante/fotos-restaurante';
import { PlatosEstrellas } from './platos-estrellas/platos-estrellas';
import { Informacion } from './informacion/informacion';
import { Juego } from './juego/juego';
import { Carrito } from './carrito/carrito';

export const routes: Routes = [
    { path: 'inicio', redirectTo: '', pathMatch: 'full' },

    { path: 'bebidas', component: Bebidas },
    { path: 'comidas', component: Comidas },
    { path: 'fotos', component: FotosRestaurante },
    { path: 'platos', component: PlatosEstrellas },
    { path: 'informacion', component: Informacion },
    { path: 'juego', component: Juego },
    {path:'carrito',component:Carrito},
    { path: '**', redirectTo: '' }
];
