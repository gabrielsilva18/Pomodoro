import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, inject, OnDestroy, PLATFORM_ID, signal, computed, Renderer2 } from '@angular/core';

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
  if (!this.isBrowser) return;

  this.startWork();
}

/* Atualiza a classe do body com base na sessão atual, opara que assim eu consiga mudar a cor de fundo baseadio na sessao atual */
updateBodyClass() {
  const body = document.body;
  const currentSession = this.controlSession();

  this.renderer.removeClass(body, 'work-session');
  this.renderer.removeClass(body, 'short-break-session');
  this.renderer.removeClass(body, 'long-break-session');

  this.renderer.addClass(body, `${currentSession}-session`);
}

/** Atualiza o título da página com base na sessão atual */
updateTitleSession() {
  const title = document.title;
  const currentSession = this.controlSession(); 
  if (currentSession === 'work') {
    document.title = 'Sessão de Trabalho';
  } else if (currentSession === 'shortBreak') {
    document.title = 'Pausa Curta';
  } else {
    document.title = 'Pausa Longa';
  }
}

/* Gera uma mensagem dinâmica com base na sessão atual para motivar o usuário */
createDynamicMessageSession() {
  const currentSession = this.controlSession();
  if (currentSession === 'work') {
    return 'Hora de focar! Mantenha a concentração e aproveite ao máximo este tempo de trabalho.';
  } else if (currentSession === 'shortBreak') {
    return 'Pausa curta! Levante-se, alongue-se e recarregue as energias para a próxima sessão de trabalho.';
  } else {
    return 'Pausa longa! Aproveite para relaxar, fazer algo que goste e se preparar para a próxima rodada de foco.';
  }
}

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