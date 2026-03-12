import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MainLayoutComponent } from '../../shared/components/main-layout/main-layout.component';

@Component({
  selector: 'app-dashboard',
  imports: [RouterOutlet, MainLayoutComponent],
  template: '<app-main-layout />'
})
export class DashboardComponent {}