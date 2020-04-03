import React, {Component} from 'react';

import ButtonsPanel from './components/buttons';
import FullScreenLoader from './components/loaders';
import NavBar from './components/navbar';

// d3 csv request and parse
import {text} from 'd3-fetch';

import window from 'global/window';
import {connect} from 'react-redux';

import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import KeplerGl from 'kepler.gl';

// config
import layerConfig from './config/wmch-config';

// Kepler.gl actions
import {inputMapStyle, addCustomMapStyle, addDataToMap, updateMap, layerConfigChange} from 'kepler.gl/actions';

// custom app actions
import {addMetadata, dataLoaded} from './actions';

// Kepler.gl Data processing APIs
import Processors from 'kepler.gl/processors';
import MAP_STYLES from './map_styles';

// const MAPBOX_TOKEN = process.env.MapboxAccessToken; // eslint-disable-line
const MAPBOX_TOKEN = ''; // eslint-disable-line

const STATIC_LAYER_DATA_ID = 'wmch_data_static';

const NAVBAR_HEIGHT = 85; // px
const WIKIBLUE = '#0065A4';

class App extends Component {
  constructor(props) {
    super(props);

    this.changeBaseMapStyle = this.changeBaseMapStyle.bind(this);
    this.toggleLayerVisibility = this.toggleLayerVisibility.bind(this);
  }

  // eseguito dopo che l’output del componente è stato renderizzato nel DOM.
  async componentDidMount() {

    const res = await fetch('/metadata');
    const metadata = await res.json();

    this.props.dispatch(addMetadata(metadata));

    const t_mount = performance.now();
    // get current name
    const pathName = window.location.pathname.split('/').pop();
    // fetch raw csv data from API
    const staticDataRawCsv = await text(`/api/data/map/static/${pathName}`); // temp limit to 100
    const timeDataRawCsv = await text(`/api/data/map/diff/${pathName}`);

    const t_data = performance.now();

    // Use processCsvData helper to convert csv file into kepler.gl structure {fields, rows}
    const staticData = Processors.processCsvData(staticDataRawCsv);
    // Create dataset structure
    const staticDataset = {
      info: { id: STATIC_LAYER_DATA_ID, label: 'Static data updated to last entry'},
      data: staticData
    };

    const timeData = Processors.processCsvData(timeDataRawCsv);

    const timeDataset = {
      info: { id: 'wmch_data_time', label: 'Entries differences over time'},
      data: timeData
    };

    // addDataToMap action to inject dataset into kepler.gl instance
    this.props.dispatch(addDataToMap({
      datasets: [staticDataset, timeDataset],
      config: layerConfig
    }));

    // set switzerland on center (also included in layer config, so if you load it you don't need this line)
    // this.props.dispatch(updateMap({latitude: 46.5302175253001, longitude: 7.655025992403368, zoom: 7.3420833731326685}));

    // inputMapStyle actions to inject dataset into kepler.gl instance
    this.props.dispatch(inputMapStyle({
      id: "OpenStreetMap",
      label: "OpenStreetMap",
      url: "https://tile.synapta.io/styles/osm-bright/style.json",
      style: MAP_STYLES.find(style => style.name === 'bright').config
    }));

    this.props.dispatch(addCustomMapStyle());

    console.log('finished loading data');

    this.props.dispatch(dataLoaded());

    const t_process = performance.now();

    // console.log(`**** PERFORMANCE ****`);
    // console.log(`Fetching data took ${t_data - t_mount}ms`);
    // console.log(`Processing data took ${t_process - t_data}ms`);
    // console.log(`*********************`);
  }

  toggleLayerVisibility(layerDataID) {
    const mapLayers = this.props.keplerGl.map.visState.layers;
    const layer = mapLayers.find(lyr => lyr.config.dataId === layerDataID);
    const visible = layer.config.isVisible;
    this.props.dispatch(layerConfigChange(layer, { isVisible: !visible }));
  }

  changeBaseMapStyle(e) {
    const styleName = e.target.dataset.style;
    const mapStyle = MAP_STYLES.find(style => style.name === styleName).config;

    this.props.dispatch(inputMapStyle({
      style: mapStyle
    }));

    this.props.dispatch(addCustomMapStyle());
  }


  render() {
    return (
      <div style={{position: 'absolute', width: '100%', height: '100%'}}>
        <div id="navbar"
          style={{
            height: NAVBAR_HEIGHT,
            minHeight: NAVBAR_HEIGHT,
            display: 'flex',
            alignItems: 'center',
            borderBottom: `2px solid ${WIKIBLUE}`
          }}
        >
        <NavBar
            id="navbar"
            title={window.location.pathname.split('/').pop().toUpperCase()}
            logo={this.props.app.metadata ? this.props.app.metadata.logo : {}}
          />
        </div>
        {
          !this.props.app.loaded ?
          <FullScreenLoader
            color={WIKIBLUE}
            loading={true}
          /> : ''
        }
        <ButtonsPanel
        mapStyles={[{name: 'toggleLayerVisibility'}]}
        clickHandler={this.toggleLayerVisibility}
        />
        <div
          style={{
            transition: 'margin 1s, height 1s',
            position: 'absolute',
            width: '100%',
            height: `calc(100% - ${NAVBAR_HEIGHT}px)`,
            minHeight: `calc(100% - ${NAVBAR_HEIGHT}px)`
          }}
        >
        <AutoSizer>
          {({height, width}) => (
            <KeplerGl
              mapboxApiAccessToken={MAPBOX_TOKEN}
              id="map"
              width={width}
              height={height}
            />
          )}
        </AutoSizer>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => state;
const dispatchToProps = dispatch => ({dispatch});

export default connect(mapStateToProps, dispatchToProps)(App);
