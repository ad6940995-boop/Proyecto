import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CocktailApiService {
  private base = 'https://www.thecocktaildb.com/api/json/v1/1';

  constructor(private http: HttpClient) {}

  obtenerCategorias(): Observable<any> {
    return this.http.get(`${this.base}/list.php?c=list`);
  }

  obtenerPorCategoria(categoria: string): Observable<any> {
    return this.http.get(`${this.base}/filter.php?c=${categoria}`);
  }

  obtenerPorTipo(tipo: 'Alcoholic' | 'Non_Alcoholic'): Observable<any> {
    return this.http.get(`${this.base}/filter.php?a=${tipo}`);
  }

  obtenerPorIngrediente(ingrediente: string): Observable<any> {
    return this.http.get(`${this.base}/filter.php?i=${ingrediente}`);
  }

  buscarPorNombre(nombre: string): Observable<any> {
    return this.http.get(`${this.base}/search.php?s=${nombre}`);
  }

  obtenerDetalle(id: string): Observable<any> {
    return this.http.get(`${this.base}/lookup.php?i=${id}`);
  }

  obtenerAleatoria(): Observable<any> {
    return this.http.get(`${this.base}/random.php`);
  }
}