import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { AngularCesiumModule, ViewerConfiguration } from 'angular-cesium';
import { VectorsComponent } from './components/vectors/vectors.component';
import { FeatureLayerComponent } from './components/feature-layer/feature-layer.component';
import { GeoserverService } from './geoserver.service';
import { HttpClientModule } from '@angular/common/http';
import { WorkspacesComponent } from './components/workspaces/workspaces.component';

@NgModule({
  declarations: [
    AppComponent,
    VectorsComponent,
    FeatureLayerComponent,
    WorkspacesComponent
  ],
  imports: [
    HttpClientModule,
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    AngularCesiumModule.forRoot()
  ],
  providers: [ViewerConfiguration, GeoserverService],
  bootstrap: [AppComponent]
})
export class AppModule {
}
