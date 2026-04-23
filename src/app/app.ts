import { Component, signal } from '@angular/core';
import { TelaInicial } from './tela-inicial/tela-inicial';

/**
 * Componente raiz da aplicação.
 *
 * É o ponto de entrada principal montado em <app-root> no index.html.
 * Ele importa o componente `TelaInicial` para exibir o timer.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TelaInicial],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App {
  // Título da aplicação usado apenas para referência interna.
  protected readonly title = signal('pomodoro_timer');
}
