import { Component, OnDestroy, signal, computed, AfterViewInit } from '@angular/core';

// ====================== TIPAGEM CORRETA ======================
// 🔧 ANTES: você usava string solta → propenso a erro
// ✅ AGORA: controlamos exatamente os estados possíveis
type SessionType = 'work' | 'shortBreak' | 'longBreak';

@Component({
  selector: 'app-tela-inicial',
  standalone: true,
  imports: [],
  templateUrl: './tela-inicial.html',
  styleUrls: ['./tela-inicial.scss'],
})
export class TelaInicial implements OnDestroy, AfterViewInit {

  // ====================== DURAÇÕES SEPARADAS ======================
  // ❌ ANTES: você usava UMA variável (workDuration) pra tudo
  // ✔️ PROBLEMA: pausa sobrescrevia trabalho → bug no reset isso ocorre por que eu nao levava em conta a diferenca entre tempo de trabalho e tempo de descanso

  // ✅ AGORA: cada tipo de sessão tem sua própria duração
  workDuration = signal(25 * 60); //tempo usadon como padrão, mas pode ser alterado pelo usuário
  shortBreakDuration = signal(5 * 60);
  longBreakDuration = signal(15 * 60);

  // ====================== ESTADO PRINCIPAL ======================
  // 🔥 ISSO É O CORAÇÃO DA APLICAÇÃO
  // define em que fase o app está
  controlSession = signal<SessionType>('work');//sesao inical de trablho

  // ====================== CONTADOR DE CICLOS ======================
  // ❌ ANTES: incrementava sempre
  // ✅ AGORA: só incrementa quando termina WORK
  Countcicles = signal(0);

  // ====================== TEMPO RESTANTE ======================
  remainingSeconds = signal(this.workDuration());

  // ====================== DISPLAY ======================
  timer = computed(() => {
    const seconds = this.remainingSeconds();
    return seconds > 0 ? this.formatTime(seconds) : '00:00';
  });

  isRunning = signal(false);
  private intervalId?: number;

  // ====================== INICIALIZAÇÃO ======================
  ngAfterViewInit() {
    this.solicitarMinutos(true);
  }

  // ====================== CONFIGURAR TEMPO DE TRABALHO ======================
  solicitarMinutos(isFirstTime: boolean = false) {
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

      // 🔧 IMPORTANTE:
      // Sempre que muda duração → reinicia no estado WORK
      this.startWork();

      if (!isFirstTime) {
        window.alert(`Duração definida para ${minutos} minutos.`);
      }
    } else {
      window.alert("Digite um número válido.");
      if (isFirstTime) this.solicitarMinutos(true);
    }
  }

  // ====================== CONTROLES ======================
  toggleTimer() {
    this.isRunning() ? this.pauseTimer() : this.startTimer();
  }

  resetTimer() {
    this.pauseTimer();

    // 🔧 ANTES: sempre voltava pro workDuration
    // ❌ errado se estiver em pausa

    // ✅ AGORA: respeita o estado atual
    const current = this.controlSession();

    if (current === 'work') {
      this.remainingSeconds.set(this.workDuration());
    } else if (current === 'shortBreak') {
      this.remainingSeconds.set(this.shortBreakDuration());
    } else {
      this.remainingSeconds.set(this.longBreakDuration());
    }
  }

  // ====================== TIMER ======================
  private startTimer() {
    if (this.isRunning() || this.remainingSeconds() <= 0) return;

    this.isRunning.set(true);

    this.intervalId = window.setInterval(() => {

      if (this.remainingSeconds() <= 1) {
        this.pauseTimer();
        this.remainingSeconds.set(0);

        // 🔥 AQUI ERA O MAIOR ERRO DO SEU CÓDIGO
        // ❌ você não chamava nenhuma lógica de troca
        // ✅ agora chamamos o cérebro da aplicação
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

  // ====================== LÓGICA DE SESSÃO ======================
  private handleSessionEnd() {
    const current = this.controlSession();

    if (current === 'work') {

      // ✅ só incrementa quando termina trabalho
      this.Countcicles.update(c => c + 1);

      if (this.Countcicles() === 4) {
        // 🔥 ciclo completo → pausa longa
        this.Countcicles.set(0);
        this.startLongBreak();
      } else {
        // 🔹 pausa curta normal
        this.startShortBreak();
      }

    } else {
      // 🔁 terminou pausa → volta pro trabalho
      this.startWork();
    }
  }

  // ====================== TRANSIÇÕES ======================
  private startWork() {
    this.controlSession.set('work');
    this.remainingSeconds.set(this.workDuration());
  }

  private startShortBreak() {
    this.controlSession.set('shortBreak');
    this.remainingSeconds.set(this.shortBreakDuration());
    window.alert("Pausa curta! ☕");
  }

  private startLongBreak() {
    this.controlSession.set('longBreak');
    this.remainingSeconds.set(this.longBreakDuration());
    window.alert("Pausa longa! 🧠");
  }

  // ====================== FORMATADOR ======================
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