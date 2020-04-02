import React from 'react';
import document from 'global/document';
import {Provider} from 'react-redux';
import {browserHistory} from 'react-router';
import {syncHistoryWithStore} from 'react-router-redux';
import {render} from 'react-dom';
import store from './store';
import App from './app';

const history = syncHistoryWithStore(browserHistory, store);

const Root = () => (
  <Provider store={store}>
    <App />
  </Provider>
);

render(<Root />, document.body.appendChild(document.createElement('div')));
