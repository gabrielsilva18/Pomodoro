import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  inject,
  OnDestroy,
  PLATFORM_ID,
  signal,
  computed,
  Renderer2,
  effect
} from '@angular/core';

type SessionType = 'work' | 'shortBreak' | 'longBreak';

@Component({
  selector: 'app-tela-inicial',
  standalone: true,
  imports: [],
  templateUrl: './tela-inicial.html',
  styleUrls: ['./tela-inicial.scss'],
})
export class TelaInicial implements OnDestroy, AfterViewInit {

  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private renderer = inject(Renderer2);

  // ⏱️ Durações
  workDuration = signal(25 * 60);
  shortBreakDuration = signal(5 * 60);
  longBreakDuration = signal(15 * 60);

  // 🔁 Estado
  controlSession = signal<SessionType>('work');
  countCycles = signal(0);

  remainingSeconds = signal(this.workDuration());

  isRunning = signal(false);
  private intervalId?: number;

  // 🕒 Timer formatado
  timer = computed(() => {
    const seconds = this.remainingSeconds();
    return seconds > 0 ? this.formatTime(seconds) : '00:00';
  });

  // 💬 Mensagem dinâmica (REATIVO)
  message = computed(() => {
    const session = this.controlSession();

    if (session === 'work') {
      return 'Hora de focar! Mantenha a concentração.';
    } else if (session === 'shortBreak') {
      return 'Pausa curta! Respire um pouco.';
    } else {
      return 'Pausa longa! Hora de relaxar.';
    }
  });

  constructor() {
    // 🔥 REAÇÃO AUTOMÁTICA ao mudar sessão
    effect(() => {
      if (!this.isBrowser) return;

      this.updateBodyClass();
      this.updateTitleSession();
    });
  }

  ngAfterViewInit() {
    if (this.isBrowser) {
      this.startWork();
    }
  }

  // 🎨 Atualiza classe do BODY
  updateBodyClass() {
    const body = document.body;
    const currentSession = this.controlSession();

    const classes = ['work-session', 'short-break-session', 'long-break-session'];

    classes.forEach(c => this.renderer.removeClass(body, c));
    this.renderer.addClass(body, `${currentSession}-session`);
  }

  // 🏷️ Atualiza título da aba
  updateTitleSession() {
    const session = this.controlSession();

    if (session === 'work') {
      document.title = '💻 Sessão de Trabalho';
    } else if (session === 'shortBreak') {
      document.title = '☕ Pausa Curta';
    } else {
      document.title = '🛌 Pausa Longa';
    }
  }

  // ⏱️ Define duração manual
  setWorkDuration(value: string) {
    const minutes = parseInt(value, 10);

    if (isNaN(minutes) || minutes <= 0) {
      this.workDuration.set(25 * 60);
    } else {
      this.workDuration.set(minutes * 60);
    }

    if (this.controlSession() === 'work') {
      this.remainingSeconds.set(this.workDuration());
    }
  }

  // ▶️ / ⏸️
  toggleTimer() {
    this.isRunning() ? this.pauseTimer() : this.startTimer();
  }

  resetTimer() {
    this.pauseTimer();

    const current = this.controlSession();

    if (current === 'work') {
      this.remainingSeconds.set(this.workDuration());
    } else if (current === 'shortBreak') {
      this.remainingSeconds.set(this.shortBreakDuration());
    } else {
      this.remainingSeconds.set(this.longBreakDuration());
    }
  }

  private startTimer() {
    if (this.isRunning() || this.remainingSeconds() <= 0) return;

    this.isRunning.set(true);

    this.intervalId = window.setInterval(() => {

      if (this.remainingSeconds() <= 1) {
        this.pauseTimer();
        this.remainingSeconds.set(0);
        this.handleSessionEnd();
        return;
      }

      this.remainingSeconds.update(s => s - 1);

    }, 1000);
  }

  private pauseTimer() {
    this.isRunning.set(false);
    this.clearInterval();
  }

  private clearInterval() {
    if (this.intervalId !== undefined) {
      window.clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  private handleSessionEnd() {
    const current = this.controlSession();

    if (current === 'work') {
      this.countCycles.update(c => c + 1);

      if (this.countCycles() === 4) {
        this.countCycles.set(0);
        this.startLongBreak();
      } else {
        this.startShortBreak();
      }

    } else {
      this.startWork();
    }
  }

  private startWork() {
    this.controlSession.set('work');
    this.remainingSeconds.set(this.workDuration());
  }

  private startShortBreak() {
    this.controlSession.set('shortBreak');
    this.remainingSeconds.set(this.shortBreakDuration());
  }

  private startLongBreak() {
    this.controlSession.set('longBreak');
    this.remainingSeconds.set(this.longBreakDuration());
  }

  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;

    return `${minutes.toString().padStart(2, '0')}:${remaining
      .toString()
      .padStart(2, '0')}`;
  }

  ngOnDestroy() {
    this.clearInterval();
  }
}