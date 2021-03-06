import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import './styles.scss'; // Doesn't work when typescript set to commonjs? problem loading sass plugin?

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule).then(success => console.log(`Bootstrap success`))
  .catch(err => console.error('bootstrap error',err));
