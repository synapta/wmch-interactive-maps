import React, { Component } from 'react';
import { Container, Divider, Grid } from 'semantic-ui-react'

class NavBar extends Component {
  render() {
    return (
      <div id={this.props.id}>
        <Container textAlign='center'>
          <Grid>
            <Grid.Column width={3}>
              LOGO
            </Grid.Column>
            <Grid.Column width={10}>
              TITLE
            </Grid.Column>
            <Grid.Column width={3}>
              MENU
            </Grid.Column>
          </Grid>
        </Container>
      </div>
    );
  }
}

export default NavBar;
