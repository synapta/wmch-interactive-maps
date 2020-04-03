import React, { Component } from 'react';
import { Container, Divider, Grid, Image, Dropdown } from 'semantic-ui-react';

const languageOptions = [
  { key: 'English', text: 'English', value: 'English' },
  { key: 'French', text: 'French', value: 'French' },
  { key: 'German', text: 'German', value: 'German' },
  { key: 'Italian', text: 'Italian', value: 'Italian' },
];

class NavBar extends Component {
  render() {
    return (
      <Container textAlign='center'>
        <Grid>
          <Grid.Column width={3}>
            <Image
            className="logo"
            src={this.props.logo.src}
            alt={this.props.logo.alt}
            size='tiny' />
          </Grid.Column>
          <Grid.Column width={10}>
            <h1>{this.props.title}</h1>
          </Grid.Column>
          <Grid.Column width={3}>
            <Dropdown
              button
              id="languages"
              className='icon wikiblue'
              floating
              labeled
              disabled
              icon='world'
              options={languageOptions}
              text='Select Language'
            />
          </Grid.Column>
        </Grid>
      </Container>
    );
  }
}

export default NavBar;
