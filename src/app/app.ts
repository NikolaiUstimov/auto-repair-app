import {Component, signal} from '@angular/core'
import {RouterOutlet} from '@angular/router'
import {HeaderComponent} from './features/header/header.component'
import {SwUpdate, VersionReadyEvent} from '@angular/service-worker'
import {filter} from 'rxjs'

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('auto-repair-app');


  constructor(swUpdate: SwUpdate) {
    swUpdate.versionUpdates
      .pipe(
        filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'),
      )
      .subscribe(event => {
        if (confirm('New version available. Load New Version?')) {
          swUpdate.activateUpdate().then(() => window.location.reload());
        }
        console.log(event);
      });
  }
}
