import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { AngularCesiumModule, ViewerConfiguration } from 'angular-cesium';
import { PolygonLayerComponent } from './components/polygon-layer/polygon-layer.component';
import { PlaneLayerComponent } from './components/plane/plane.component';
import { PolylineLayerComponent } from './components/polyline-layer/polyline-layer.component';
import { VectorsComponent } from './components/vectors/vectors.component';
import { FeatureLayerComponent } from './components/feature-layer/feature-layer.component';
import { GeoserverService } from './geoserver.service';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [
    AppComponent,
    PolygonLayerComponent,
    PlaneLayerComponent,
    PolylineLayerComponent,
    VectorsComponent,
    FeatureLayerComponent
  ],
  imports: [
    HttpClientModule,
    BrowserModule,
    AngularCesiumModule.forRoot()
  ],
  providers: [ViewerConfiguration, GeoserverService],
  bootstrap: [AppComponent]
})
export class AppModule {
}
