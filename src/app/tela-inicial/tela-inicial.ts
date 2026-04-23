import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, inject, OnDestroy, PLATFORM_ID, signal, computed } from '@angular/core';

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

  workDuration = signal(25 * 60);
  shortBreakDuration = signal(5 * 60);
  longBreakDuration = signal(15 * 60);

  controlSession = signal<SessionType>('work');

  Countcicles = signal(0);

  remainingSeconds = signal(this.workDuration());

  timer = computed(() => {
    const seconds = this.remainingSeconds();
    return seconds > 0 ? this.formatTime(seconds) : '00:00';
  });

  isRunning = signal(false);
  private intervalId?: number;

  ngAfterViewInit() {
    if (this.isBrowser) {
      this.solicitarMinutos(true);
    } else {
      this.startWork();
    }
  }

  solicitarMinutos(isFirstTime: boolean = false) {
    if (!this.isBrowser) {
      this.workDuration.set(25 * 60);
      this.startWork();
      return;
    }

    const mensagem = isFirstTime
      ? "Bem-vindo! Digite a duração do Pomodoro em minutos:"
      : "Digite a nova duração em minutos:";

    const input = window.prompt(mensagem);

    if (input === null) {
      if (isFirstTime) {
        this.workDuration.set(25 * 60);
        this.startWork();
        window.alert("Usando 25 minutos como padrão.");
      }
      return;
    }

    const minutos = parseInt(input, 10);

    if (!isNaN(minutos) && minutos > 0) {
      const duracao = minutos * 60;

      this.workDuration.set(duracao);

      this.startWork();

      if (!isFirstTime) {
        window.alert(`Duração definida para ${minutos} minutos.`);
      }
    } else {
      window.alert("Digite um número válido.");
      if (isFirstTime) this.solicitarMinutos(true);
    }
  }

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

      this.Countcicles.update(c => c + 1);

      if (this.Countcicles() === 4) {
        this.Countcicles.set(0);
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
    if (this.isBrowser) window.alert("Pausa curta!");
  }

  private startLongBreak() {
    this.controlSession.set('longBreak');
    this.remainingSeconds.set(this.longBreakDuration());
    if (this.isBrowser) window.alert("Pausa longa!");
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