import React, { Component } from 'react';

import { css } from "@emotion/core";
import BeatLoader from "react-spinners/BeatLoader";

// Can be a string as well. Need to ensure each key-value pair ends with ;
const override = css`
  height          : 100%;
  display         : flex;
  align-items     : center;
  justify-content : center;
`;

const sweetLoadingStyle = {
  position   : 'absolute',
  width      :'100%',
  height     :'100%',
  zIndex     : '100',
  background : 'rgba(255, 255, 255, .8)'
};

export default class FullScreenLoader extends Component {
  // _handleDelete(id) {
  //   this.props._handleDelete(id);
  // }

  render() {
    return(
      <div className="sweet-loading" style={sweetLoadingStyle} >
        <BeatLoader
          css={override}
          size={50}
          color={this.props.color}
          loading={this.props.loading}
        />
      </div>
    );
  }
}
