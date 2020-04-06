import React, { Component } from 'react';

const CONTROLS_BACKGROUND = '#29323C';

const buttonStyle = {
  position: 'relative',
  zIndex: 2,
  width: '120px',
  height: '40px',
  backgroundColor: CONTROLS_BACKGROUND,
  color: '#FFFFFF',
  cursor: 'pointer',
  border: 0,
  borderRadius: '3px',
  fontSize: '12px',
  margin:'8px 0',
  transition: 'opacity .3s'
};

const panelStyle = {
  position: 'absolute',
  zIndex: 2,
  top: '40%',
  right: '0px',
  padding: '12px',
  display: 'flex',
  flexDirection: 'column',
  textAlign: 'center',
  color: CONTROLS_BACKGROUND
};

class StyleButton extends Component {
  render() {
    return (
      <button
      data-style={this.props.text}
      id={this.props.btnId}
      style={buttonStyle}
      onClick={this.props.clickHandler}>
        {this.props.text}
      </button>
    );
  }
}

export class ButtonsPanel extends Component {
  render() {
    const buttons = this.props.mapStyles.map(styleJson =>
      <StyleButton
      clickHandler={this.props.clickHandler}
      btnId={`style-button-${styleJson.name}`}
      text={styleJson.name}
      key={styleJson.name}
      />
    );

    return (
      <div
      style={panelStyle}>
      {buttons}
      </div>
    );
  }
}

class LayerButton extends Component {
  render() {
    return (
      <button
      data-layer_data_id={this.props.layer_data_id}
      id={this.props.btnId}
      className={this.props.btnClass}
      style={buttonStyle}
      onClick={this.props.clickHandler}>
        {this.props.text}
      </button>
    );
  }
}

export class LayersButtonsPanel extends Component {
  render() {
    // console.log(this.props.layersConfig);
    const buttons = this.props.layersConfig.map((config, idx) =>
      <LayerButton
      clickHandler={this.props.clickHandler}
      layer_data_id={config.id}
      btnClass={config.isVisible ? '' : 'semitransparent'}
      btnId={`style-button-${config.id}`}
      text={config.label}
      key={`${config.id}-${idx}`}
      />
    );

    return (
      <div
      style={panelStyle}>
      <h4>TOGGLE VIEW</h4>
      {buttons}
      </div>
    );
  }
}
