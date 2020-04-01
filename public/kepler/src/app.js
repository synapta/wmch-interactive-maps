import React, {Component} from 'react';

import ButtonsPanel from './components/buttons';
import FullScreenLoader from './components/loaders';


// d3 csv request and parse
import {text} from 'd3-fetch';

import styled, {ThemeProvider} from 'styled-components';
import window from 'global/window';
import {connect} from 'react-redux';

import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import KeplerGl from 'kepler.gl';

// config
import layerConfig from './data/wmch-config';

// Kepler.gl actions
import {inputMapStyle, addCustomMapStyle, addDataToMap, updateMap} from 'kepler.gl/actions';

// Kepler.gl Data processing APIs
import Processors from 'kepler.gl/processors';

import MAP_STYLES from './map_styles';

// const MAPBOX_TOKEN = process.env.MapboxAccessToken; // eslint-disable-line
const MAPBOX_TOKEN = ''; // eslint-disable-line

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: true
    };

    this.changeBaseMapStyle = this.changeBaseMapStyle.bind(this);
  }

  // eseguito dopo che l’output del componente è stato renderizzato nel DOM.
  async componentDidMount() {
    // get current name
    const pathName = window.location.pathname.split('/').pop();
    // fetch raw csv data from API
    const staticDataRawCsv = await text(`/api/data/map/static/${pathName}`); // temp limit to 100
    // Use processCsvData helper to convert csv file into kepler.gl structure {fields, rows}
    const staticData = Processors.processCsvData(staticDataRawCsv);
    // Create dataset structure
    const staticDataset = {
      info: { id: 'wmch_data_static', label: 'Static data updated to last entry'},
      data: staticData
    };

    const timeDataRawCsv = await text(`/api/data/map/diff/${pathName}`);
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
      url: "http://localhost:9000/styles/osm-bright/style.json",
      style: MAP_STYLES.find(style => style.name === 'bright').config
    }));

    this.props.dispatch(addCustomMapStyle());

    this.setState({
      loading: false
    });
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
        {
          this.state.loading ?
          <FullScreenLoader
            color={'#0065A4'}
            loading={true}
          /> : ''
        }
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
    );
  }
}

const mapStateToProps = state => state;
const dispatchToProps = dispatch => ({dispatch});

export default connect(mapStateToProps, dispatchToProps)(App);
