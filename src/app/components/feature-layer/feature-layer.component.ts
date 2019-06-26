import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { AcLayerComponent, AcNotification } from 'angular-cesium';
import { from as observableFrom, Observable } from 'rxjs';

@Component({
  selector: 'feature-layer',
  templateUrl: './feature-layer.component.html',
  styleUrls: ['./feature-layer.component.less']
})
export class FeatureLayerComponent implements OnInit {
  @ViewChild(AcLayerComponent, {static: false}) layer: AcLayerComponent;

  @Input()
  vectorId: string;
  @Input()
  features: AcNotification[];
  @Input()
  show: boolean;

  features$: Observable<AcNotification | AcNotification[]>;

  constructor() {
  }

  ngOnInit() {
    this.features$ = observableFrom(this.features);
  }
}
