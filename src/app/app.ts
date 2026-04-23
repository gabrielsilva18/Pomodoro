import { Component, signal } from '@angular/core';
import { TelaInicial } from './tela-inicial/tela-inicial';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TelaInicial],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App {
  protected readonly title = signal('pomodoro_timer');
}
