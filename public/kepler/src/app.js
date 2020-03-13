// Copyright (c) 2018 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import React, {Component} from 'react';

import ButtonsPanel from './components/buttons.js';


// d3 csv request and parse
import {text} from 'd3-fetch';

import {connect} from 'react-redux';

import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import KeplerGl from 'kepler.gl';

// data
import nycTrips from './data/nyc-trips.csv';
import wmchTest from './data/framap-test.csv';
import swissMuseums from './data/swiss-museums.json';

// config
// import layerNYConfig from './data/nyc-config.json';
import layerConfig from './data/wmch-config.json';

// Kepler.gl actions
import {inputMapStyle, addCustomMapStyle, addDataToMap, updateMap} from 'kepler.gl/actions';

// Kepler.gl Data processing APIs
import Processors from 'kepler.gl/processors';

import MAP_STYLES from './map_styles';


// const MAPBOX_TOKEN = process.env.MapboxAccessToken; // eslint-disable-line
// const MAPBOX_TOKEN = 'pk.eyJ1IjoiZnJhbmNlc2NvY3JldHRpIiwiYSI6ImNrNzNtZHllcDBkZXMzZG1zcmFzMXJtMHQifQ.f4OEnS23dbLKKFrJudClhA'; // eslint-disable-line
const MAPBOX_TOKEN = ''; // eslint-disable-line

class App extends Component {
  constructor(props) {
    super(props);

    this.changeBaseMapStyle = this.changeBaseMapStyle.bind(this);
  }

  /*
   * Da @link https://it.reactjs.org/docs/state-and-lifecycle.html
   * Il metodo componentDidMount() viene eseguito dopo che l’output del
   * componente è stato renderizzato nel DOM.
   */
  async componentDidMount() {
    // fetch raw csv data from API
    const rawCsvData = await text("/proxy/test");

    // Use processCsvData helper to convert csv file into kepler.gl structure {fields, rows}
    const wmchTestData = Processors.processCsvData(rawCsvData);
    // const nycTripsData = Processors.processCsvData(nycTrips);
    // const data = Processors.processGeojson(swissMuseums);

    // Create dataset structure
    const dataset = {
      data: wmchTestData,
      info: {
        // `info` property are optional, adding an `id` associate with this dataset makes it easier
        // to replace it later
        id: 'wmch_data'
      }
    };

    // addDataToMap action to inject dataset into kepler.gl instance
    this.props.dispatch(addDataToMap({
      datasets: dataset,
      config: layerConfig,
      options: {
        centerMap: true,
        readOnly: true
      }
    }));

    // set switzerland on center (included in layer config)
    // this.props.dispatch(updateMap({latitude: 46.5302175253001, longitude: 7.655025992403368, zoom: 7.3420833731326685}));

    // inputMapStyle action to inject dataset into kepler.gl instance
    this.props.dispatch(inputMapStyle({
      id: "customStyle",
      label: "Custom style",
      url: "http://localhost:9000/styles/osm-bright/style.json",
      style: MAP_STYLES.find(style => style.name === 'bright').config
    }));

    this.props.dispatch(addCustomMapStyle());
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
        <ButtonsPanel
        mapStyles={MAP_STYLES}
        clickHandler={this.changeBaseMapStyle}
        />,
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
