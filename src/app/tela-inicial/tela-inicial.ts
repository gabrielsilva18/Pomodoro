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

  // 💬 Mensagem dinâmica
  message = computed(() => {
    const session = this.controlSession();

    if (session === 'work') return 'Hora de focar! Mantenha a concentração.';
    if (session === 'shortBreak') return 'Pausa curta! Respire um pouco.';
    return 'Pausa longa! Hora de relaxar.';
  });

  constructor() {
    effect(() => {
      if (!this.isBrowser) return;

      this.updateBodyClass();
      this.updateTitleSession();
    });
  }

  // 🚀 Inicialização
  ngAfterViewInit() {
    if (!this.isBrowser) return;

    this.loadState();

    if (!this.remainingSeconds()) {
      this.startWork();
    }

    this.updateBodyClass();
    this.updateTitleSession();
  }

  // 🎨 Atualiza classe do BODY
  updateBodyClass() {
    const body = document.body;
    const currentSession = this.controlSession();

    const classes = ['work-session', 'short-break-session', 'long-break-session'];

    classes.forEach(c => this.renderer.removeClass(body, c));
    this.renderer.addClass(body, `${currentSession}-session`);
  }

  // 🧠 Atualiza título
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

  // ⏱️ Define duração
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

    this.saveState();
  }

  // ▶ start/pause
  toggleTimer() {
    this.unlockAudio();
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

    this.saveState();
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

      // 💾 salva a cada segundo
      this.saveState();

    }, 1000);
  }

  private pauseTimer() {
    this.isRunning.set(false);
    this.clearInterval();
    this.saveState();
  }

  private clearInterval() {
    if (this.intervalId !== undefined) {
      window.clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  // 🔁 Transição de sessões
  private handleSessionEnd() {
    const current = this.controlSession();

    // 🔔 som da sessão que terminou
    this.playSound(current);

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

  // 💾 Salvar estado
  private saveState() {
    const state = {
      workDuration: this.workDuration(),
      shortBreakDuration: this.shortBreakDuration(),
      longBreakDuration: this.longBreakDuration(),
      remainingSeconds: this.remainingSeconds(),
      session: this.controlSession(),
      isRunning: this.isRunning(),
      countCycles: this.countCycles(),
      lastUpdated: Date.now()
    };

    localStorage.setItem('pomodoroState', JSON.stringify(state));
  }

  // 📥 Carregar estado
  private loadState() {
    const savedState = localStorage.getItem('pomodoroState');
    if (!savedState) return;

    const state = JSON.parse(savedState);

    this.workDuration.set(state.workDuration);
    this.shortBreakDuration.set(state.shortBreakDuration);
    this.longBreakDuration.set(state.longBreakDuration);

    this.controlSession.set(state.session);
    this.countCycles.set(state.countCycles || 0);

    let remaining = state.remainingSeconds;

    if (state.isRunning && state.lastUpdated) {
      const now = Date.now();
      const diffMs = now - state.lastUpdated;
      const diffSeconds = Math.floor(diffMs / 1000);

      remaining = remaining - diffSeconds;
    }

    if (remaining <= 0) {
      remaining = 0;
    }

    this.remainingSeconds.set(remaining);

    if (state.isRunning && remaining > 0) {
      this.startTimer();
    } else {
      this.isRunning.set(false);
    }
  }

  private startWork() {
    this.controlSession.set('work');
    this.remainingSeconds.set(this.workDuration());
    this.saveState();
  }

  private startShortBreak() {
    this.controlSession.set('shortBreak');
    this.remainingSeconds.set(this.shortBreakDuration());
    this.saveState();
  }

  private startLongBreak() {
    this.controlSession.set('longBreak');
    this.remainingSeconds.set(this.longBreakDuration());
    this.saveState();
  }

  // 🔊 Sons
  private playSound(type: 'work' | 'shortBreak' | 'longBreak') {
    const sounds = {
      work: '/fim_work.mp3',
      shortBreak: '/fim_pausa_curta.mp3',
      longBreak: '/fim_pausa_longa.mp3'
    };

    const audio = new Audio(sounds[type]);
    audio.play().catch(() => {});
  }

  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;

    return `${minutes.toString().padStart(2, '0')}:${remaining
      .toString()
      .padStart(2, '0')}`;
  }

private audioUnlocked = false;

private unlockAudio() {
  if (this.audioUnlocked) return;

  const audio = new Audio('/fim_work.mp3');
  audio.volume = 0;

  audio.play()
    .then(() => this.audioUnlocked = true)
    .catch(() => {});
}

  ngOnDestroy() {
    this.clearInterval();
  }
}