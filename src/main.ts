import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Ponto de entrada do aplicativo Angular.
// O `bootstrapApplication` inicia o componente raiz `App` usando a configuração definida em appConfig.
bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
