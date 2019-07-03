import { AfterViewInit, Component, Input } from '@angular/core';
import { MapsManagerService, ViewerConfiguration } from 'angular-cesium';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent implements AfterViewInit {

  showVectors = true;

  @Input()
  title = 'hide';

  constructor(public mapManager: MapsManagerService, private viewerConfiguration: ViewerConfiguration) {
    this.viewerConfiguration.viewerOptions = {
      selectionIndicator: false,
      timeline: false,
      sceneMode: Cesium.SceneMode.SCENE2D,
      infoBox: false,
      fullscreenButton: false,
      baseLayerPicker: false,
      animation: false,
      homeButton: false,
      geocoder: false,
      navigationHelpButton: false,
      sceneModePicker: false,
      navigationInstructionsInitiallyVisible: false,
      terrainProviderViewModels: []
    };
  }

  displayLayers() {
    this.title = this.showVectors ? 'show' : 'hide';
    this.showVectors = !this.showVectors;
  }

  ngAfterViewInit() {

    // mapManager.getMap().getCesiumViewer().scene.morphTo2D(0);

  }
}
