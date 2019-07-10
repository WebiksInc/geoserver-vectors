import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { AcLayerComponent, AcNotification, MapLayerProviderOptions } from 'angular-cesium';
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
  polygons: AcNotification[];
  @Input()
  lineStrings: AcNotification[];
  @Input()
  points: AcNotification[];
  @Input()
  show: boolean;

  features$: Observable<AcNotification | AcNotification[]>;
  polygons$: Observable<AcNotification | AcNotification[]>;
  lineStrings$: Observable<AcNotification | AcNotification[]>;
  points$: Observable<AcNotification | AcNotification[]>;

  viewer = new Cesium.Viewer('main-map');

  constructor() {
  }

  MapLayerProviderOptions : MapLayerProviderOptions;

  ngOnInit() {
    this.features$ = observableFrom(this.features);
    this.polygons$ = observableFrom(this.polygons);
    this.lineStrings$ = observableFrom(this.lineStrings);
    this.points$ = observableFrom(this.points);
  }
}
