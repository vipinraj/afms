import { Component, ViewChild, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Http, Response } from '@angular/http';
import { GoogleMapsAPIWrapper } from '@agm/core/services';
import { WMSService, WMSLayerComponent, MapViewParameterService } from 'map-wald';
import { SelectionService } from '../selection.service';
import { VectorLayer } from '../vector-layer-selection/vector-layer-selection.component';
import {LatLng} from '../latlng';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/observable/throw';

//const BASE_URL='http://gsky-dev.nci.org.au/ows';
const BASE_URL='http://gsky-test.nci.org.au/ows';
//const BASE_URL = 'http://130.56.242.21/ows';
//'http://dapds00.nci.org.au/thredds';

@Component({
  selector: 'app-main-map',
  templateUrl: './main-map.component.html',
  styleUrls: ['./main-map.component.scss']
})
export class MainMapComponent implements OnInit {

  layerVariable: string;
  chartHeight:number = 0;

  initLayer(sat?:boolean):any{
    return {
      layers: this.layerVariable+(sat?'%3ASaturated':''),
      time: `${this.selection.dateText(this.selection.effectiveDate())}T00%3A00%3A00.000Z`,
      styles: "",
      transparent: true,
      tiled: true,
      feature_count: 101
    };
  }

  constructor(private _wmsService: WMSService,
    _activatedRoute: ActivatedRoute,
    private selection: SelectionService,
    private mapView:MapViewParameterService,
    private http: Http) {
    this.selection.loadFromURL(_activatedRoute);
    this.selection.dateChange.subscribe((dateTxt: string) => {
      this.dateChanged(dateTxt);
    });
    this.wmsURL = BASE_URL;
    this.wmsParameters = this.initLayer();
    this.wmsParametersSat = this.initLayer(true);

    var view = mapView.current();

    var coords = decodeURIComponent(view.coords)
    if(coords&&(coords!=='_')){
//      console.log(coords);
      var coordArray = coords.split(',').map(s=>+s);
      this.selectLocation(this.constrain({
        lat:coordArray[0],
        lng:coordArray[1]
      }));
    }

    if(!((view.lat==='_')||(view.lng==='_')||(view.zm==='_'))){
      var ll = this.constrain(<LatLng>view);
      this.lat=ll.lat;
      this.lng=ll.lng;
      this.zoom=+view.zm;
    }
  }

  constrain(ll:LatLng){
    return{
      lat:Math.min(-7,Math.max(-45,+ll.lat)),
      lng:Math.min(170,Math.max(110,+ll.lng))
    };
  }

  map: any;
  // google maps zoom level
  zoom: number = 4;

  wmsURL: string;
  wmsParameters: any = {};
  wmsParametersSat: any = null;
  wmsPalette: string = 'RdYlBu';
  wmsColourCount: number = 11;
  wmsReverse: boolean = true;
  wmsRange: Array<number> = [0, 255];
  mapUnits: string = 'units';
  mapTitle: string = 'Fuel Moisture Content';

  // initial center position for the map
  lat: number = -22.673858;
  lng: number = 129.815982;

  geoJsonObject: Object = null;
  vectorLayer:VectorLayer;
  selectedCoordinates:LatLng;

  mapClick(clickEvent){
    this.selectLocation({
      lng:clickEvent.coords.lng,
      lat:clickEvent.coords.lat
    });
  }

  clicked(clickEvent) {
    this.selectLocation({
      lng:clickEvent.latLng.lng(),
      lat:clickEvent.latLng.lat()
    });
  }

  moveAndZoom(coords:LatLng){
    this.selectLocation(coords);
    this.moved(coords);
    this.moved(12);

    // Zoom
  }

  moved(event){
    if(event.lat){
      this.lat=event.lat;
      this.lng=event.lng;
//      this.mapView.update({lat:event.lat.toFixed(2),lng:event.lng.toFixed(2)});
    } else {
      this.zoom = event;
//      this.mapView.update({zm:event});
    }
    this.mapView.update({
      lat:this.lat.toFixed(2),
      lng:this.lng.toFixed(2),
      zm:this.zoom
    });
  }

  selectLocation(coords:LatLng){
    this.selectedCoordinates=coords;
    this.mapView.update({coords:`${coords.lat.toFixed(3)},${coords.lng.toFixed(3)}`});
    this.chartHeight=150;
  }


  staticStyles:any={
      clickable: true,
      fillOpacity: 0,
      fillColor: null,//'#80F090',
      strokeWeight: 0.5,
      strokeColor: '#444'
    };

  styleFunc(feature) {
    return {
      clickable: true,
      fillOpacity: 0,
      fillColor: null,//'#80F090',
      strokeWeight: 0.5,
      strokeColor: '#444'
    };
  }

  @ViewChild('mapDiv') mapDiv: Component;
  @ViewChild('wms') wmsLayer: WMSLayerComponent;
  // UNCOMMENT to enable underlay layer
  //  @ViewChild('wmsSat') wmsLayerSat: WMSLayerComponent;

  updateLayers(){
    this.wmsLayer.buildMap();

    // UNCOMMENT to enable underlay layer
    // this.wmsLayerSat.buildMap();
  }

  dateChanged(dateText: string) {
    this.wmsParameters.time = `${dateText}T00%3A00%3A00.000Z`;
    this.wmsParametersSat.time =
      this.selection.dateText(this.selection.previousTimeStep(this.selection.date));

    this.updateLayers();
  }

  ngAfterViewInit() {
  }
  theMap: any

  ngOnInit() {
  }

  layerChanged(layer) {
    this.layerVariable = layer.variable;
    this.wmsParameters.layers = this.layerVariable;
    this.wmsParametersSat.layers = this.layerVariable+'%3ASaturated';
    this.mapTitle = layer.name;
    this.mapUnits = layer.units;
    this.wmsPalette = layer.palette.name;
    this.wmsColourCount = layer.palette.count;
    this.wmsReverse = layer.palette.reverse;
    this.wmsRange = layer.range;

    this.updateLayers();
  }

  changeCount:number =0;
  vectorLayerChanged(layer:VectorLayer){
    this.changeCount++;
    var component = this;
    this.geoJsonObject=null;
    this.vectorLayer=layer;
    this.http.get(`assets/selection_layers/${layer.jsonFilename}`)
      .map((r) => r.json())
      .subscribe((data) => {
        component.geoJsonObject = data;
      });
  }
}
