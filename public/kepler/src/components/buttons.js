import React, { Component } from 'react';

const buttonStyle = {
  position: 'relative',
  zIndex: 100,
  width: '120px',
  height: '40px',
  backgroundColor: '#1f7cf4',
  color: '#FFFFFF',
  cursor: 'pointer',
  border: 0,
  borderRadius: '3px',
  fontSize: '12px',
  margin:'0 10px'
};

const panelStyle = {
  position: 'absolute',
  zIndex: 100,
  bottom: 0,
  right: 0,
  margin:'30px',
  display: 'flex'
};

class SingleButton extends Component {
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

class ButtonsPanel extends Component {
  render() {
    const buttons = this.props.mapStyles.map(styleJson =>
      <SingleButton
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

export default ButtonsPanel;
