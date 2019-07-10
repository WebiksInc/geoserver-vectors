import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AngularCesiumModule, ViewerConfiguration } from 'angular-cesium';

import { AppComponent } from './app.component';
import { VectorsComponent } from './components/vectors/vectors.component';
import { FeatureLayerComponent } from './components/feature-layer/feature-layer.component';
import { GeoserverService } from './geoserver.service';
import { WorkspacesComponent } from './components/workspaces/workspaces.component';

import { AccordionModule } from 'primeng/accordion';

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
    AngularCesiumModule.forRoot(),
    AccordionModule
  ],
  providers: [ViewerConfiguration, GeoserverService],
  bootstrap: [AppComponent]
})
export class AppModule {
}
