
import {combineReducers} from 'redux';
import {handleActions} from 'redux-actions';
import {routerReducer} from 'react-router-redux';

import keplerGlReducer from 'kepler.gl/reducers';

// CONSTANTS
import { ADD_METADATA, DATA_LOADED } from '../actions';

// INITIAL_APP_STATE
const initialAppState = {
  appName: 'WMCH maps',
  loaded: false
};

// custom updaters
const dataLoadedUpdater = (state, action) => {
  return {
    ...state,
    loaded: true
  };
};

const updateMetadata = (state, action) => {
  return {
    ...state,
    metadata: action.metadata
  };
};

// app reducer
const appReducer = handleActions(
  {
    [DATA_LOADED]: dataLoadedUpdater,
    [ADD_METADATA]: updateMetadata
  },
  initialAppState
);

// kepler reducer
const customKeplerReducer = keplerGlReducer.initialState({
  mapStyle: {
    mapStyles: {},
    styleType: 'OpenStreetMap'
  },
  uiState: {
    readOnly: false,
    activeSidePanel: 'filter',
    centerMap: true,
    currentModal: null,
    exportImage: false,
    exportData: false
  }
});

const reducers = combineReducers({
  keplerGl: customKeplerReducer,
  app: appReducer,
  routing: routerReducer
});

export default reducers;
