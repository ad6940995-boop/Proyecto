import { Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-fotos-restaurante',
  imports: [],
  templateUrl: './fotos-restaurante.html',
  styleUrl: './fotos-restaurante.css',
})
export class FotosRestaurante {
  @ViewChild('track', { static: true }) trackRef!: ElementRef<HTMLDivElement>;

  private isDragging = false;
  private startX = 0;
  private scrollStart = 0;

  startDrag(event: MouseEvent): void {
    this.isDragging = true;
    this.startX = event.pageX;
    this.scrollStart = this.trackRef.nativeElement.scrollLeft;
  }

  onDrag(event: MouseEvent): void {
    if (!this.isDragging) {
      return;
    }
    const delta = event.pageX - this.startX;
    this.trackRef.nativeElement.scrollLeft = this.scrollStart - delta;
  }

  endDrag(): void {
    this.isDragging = false;
  }

  scrollByAmount(amount: number): void {
    this.trackRef.nativeElement.scrollBy({ left: amount, behavior: 'smooth' });
  }
}