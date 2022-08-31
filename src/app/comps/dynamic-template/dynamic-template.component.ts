import { Component, ComponentFactoryResolver, Input, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { AppComponent } from 'src/app/app.component';
import { DynamicItem } from 'src/app/models/dynamic-item';

export interface DynamicComponent {
  data: any;
}

@Component({
  selector: 'dynamic-template',
  templateUrl: './dynamic-template.component.html',
  styleUrls: ['./dynamic-template.component.css']
})
export class DynamicTemplateComponent implements OnInit, OnDestroy {

  @Input() item: DynamicItem;
  @ViewChild("container", { read: ViewContainerRef }) container: ViewContainerRef;

  constructor(private resolver: ComponentFactoryResolver) {}

  ngOnInit() {
    setTimeout(() => {
      this.loadComponent();
    });
  }

  ngOnDestroy() {
    this.item.instance = undefined;
  }

  loadComponent() {
    this.container.clear();

    const factory = this.resolver.resolveComponentFactory(this.item.component);
    const componentRef = this.container.createComponent<DynamicComponent>(factory);
    componentRef.instance.data = this.item.data;
    this.item.instance = componentRef.instance;

    if(AppComponent.instance) {
      AppComponent.instance.tick();
    }
  }
}
