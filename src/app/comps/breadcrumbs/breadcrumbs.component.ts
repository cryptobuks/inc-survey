import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppComponent } from 'src/app/app.component';
import { Breadcrumb } from 'src/app/shared/menu';

@Component({
  selector: 'breadcrumbs',
  templateUrl: './breadcrumbs.component.html',
  styleUrls: ['./breadcrumbs.component.css']
})
export class BreadcrumbsComponent implements OnInit {

  items: Breadcrumb[] = [];

  constructor(
    private router: Router
  ) {}

  ngOnInit() {
    this.items = AppComponent.instance.breadcrumbs;
  }

  back() {
    this.items.pop();

    if (this.items.length > 0) {
      let url = this.items[this.items.length - 1].url;
      this.router.navigate([url]);
    } else {
      this.router.navigate(['/']);
    }
  }
}
