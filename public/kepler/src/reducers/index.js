
import {combineReducers} from 'redux';
import {handleActions} from 'redux-actions';
import {routerReducer} from 'react-router-redux';

import keplerGlReducer, {combinedUpdaters, uiStateUpdaters} from 'kepler.gl/reducers';

// CONSTANTS
const INIT = 'INIT';

// INITIAL_APP_STATE
const initialAppState = {
  appName: 'WMCH maps',
  loaded: false
};

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

const appReducer = handleActions(
  {
    [INIT]: (state, action) => ({
      ...state,
      loaded: true
    })
  },
  initialAppState
);

const reducers = combineReducers({
  keplerGl: customKeplerReducer,
  app: appReducer,
  routing: routerReducer
});

export default reducers;
