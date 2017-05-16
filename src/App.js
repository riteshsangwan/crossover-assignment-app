/**
 * Copyright (c) 2017. Ritesh Sangwan. All rights reserved.
 */

/**
 * Main App component
 *
 * @author      riteshsangwan
 * @version     1.0.0
 */
import React from 'react';
import './App.css';
import { dojoRequire } from 'esri-loader';
import _ from 'lodash';
import EsriLoader from 'esri-loader-react';
import {
  BrowserRouter as Router,
  Route,
  Switch,
  Redirect,
} from 'react-router-dom';
import ApiService from './services/ApiService';
import config from './config';
import Modal from 'react-modal';
import { Form, Text } from 'react-form';

const BLOOD_GROUPS = {
  O_NEGATIVE: 'O-',
  O_POSITIVE: 'O+',
  A_NEGATIVE: 'A-',
  A_POSITIVE: 'A+',
  B_NEGATIVE: 'B-',
  B_POSITIVE: 'B+',
  AB_NEGATIVE: 'AB-',
  AB_POSITIVE: 'AB+',
};

const EMAIL_REGEXP = /^[a-z0-9!#$%&'*+/=?^_`{|}~.-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i;
const CONTACT_NUMBER_REGEXP = /^([0]{2})|(\+)\d{11,13}$/i;
const apiService = new ApiService(config.api.baseUrl);

class MapComponent extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      // map center point view in lng/lat
      center: [-104.601474, 42.784700],
      modalIsOpen: false,
      success: false,
      error: false,
      zoom: 2,
    };
  }

  searchDonors(webMercatorUtils, Point, SimpleMarkerSymbol, SimpleRenderer, FeatureLayer) {
    // map loaded successfully, it is safe to fetch donors list in visible area
    // covert to the geographic coordinates
    const geographic = webMercatorUtils.webMercatorToGeographic(this.mapView.extent);
    const json = geographic.toJSON();
    apiService.search([json.xmax, json.ymax], [json.xmin, json.ymin]).then((response) => {
      this.renderFeatureLayer(Point, SimpleMarkerSymbol,
        SimpleRenderer, FeatureLayer, response.items);
    });
  }

  /**
   * Click handler for map view
   * @private
   *
   * @param   {Object}        event           the click event
   */
  handleMapViewClick(event) {
    this.setState({ modalIsOpen: true, donorPosition: {
      lat: event.mapPoint.latitude,
      lng: event.mapPoint.longitude,
    }});
  }

  createMap = () => {
    dojoRequire(['esri/Map',
      'esri/views/MapView',
      'esri/symbols/SimpleMarkerSymbol',
      'esri/geometry/Point',
      'esri/geometry/support/webMercatorUtils',
      'esri/renderers/SimpleRenderer',
      'esri/layers/FeatureLayer',
      'esri/Graphic'], (Map, MapView, SimpleMarkerSymbol, Point,
        webMercatorUtils, SimpleRenderer, FeatureLayer, Graphic) => {
      this.map = new Map({ basemap: 'streets' });
      this.mapView = new MapView({
        container: this.mapContainer,
        map: this.map,
        zoom: this.state.zoom,
        center: this.state.center,
      });
      this.mapView.on('click', this.handleMapViewClick.bind(this));
      this.mapView.watch('extent', this.searchDonors.bind(this, webMercatorUtils, Point, SimpleMarkerSymbol,
        SimpleRenderer, FeatureLayer));
      this.mapView.then(() => this.searchDonors.bind(this, webMercatorUtils, Point, SimpleMarkerSymbol,
        SimpleRenderer, FeatureLayer));
    });
  }

  /**
   * Render the feature layer and mark all donors on the map as markers
   */
  renderFeatureLayer(Point, SimpleMarkerSymbol, SimpleRenderer, FeatureLayer, donors) {
    /**
     * The extent property of a map can change pretty fast
     * depending on user actions like zoom, drag etc
     * Hence we don't want to re render the features layer everytime the extent property is updated.
     * Only re render the features layer once 2 seconds, this will result in significat performance boost
     */
    if (!this.featuresLastUpdated || (Date.now() - this.featuresLastUpdated) > 2000) {
      this.featuresLoading = true;
      // only redraw if not already redrawing
      const graphics = donors.map((single, index) => ({
        geometry: new Point({
          longitude: single.location.coordinates[0],
          latitude: single.location.coordinates[1]
        }),
        attributes: {
          ObjectID: index,
        },
      }));

      const donorFields = [{
        name: 'ObjectID',
        alias: 'ObjectID',
        type: 'oid'
      }];

      const donorRenderer = new SimpleRenderer({
        symbol: new SimpleMarkerSymbol({
          path: 'M7,1C6.4,1,6,1.4,6,2v4H2C1.4,6,1,6.4,1,7v1c0,0.6,0.4,1,1,1h4v4c0,0.6,0.4,1,1,1h1c0.6,0,1-0.4,1-1V9h4c0.6,0,1-0.4,1-1V7c0-0.6-0.4-1-1-1H9V2c0-0.6-0.4-1-1-1H7z',
          size: 10,
          color: 'black',
        }),
      });

      const featureLayer = new FeatureLayer({
        source: graphics,
        fields: donorFields,
        objectIdField: 'ObjectID',
        renderer: donorRenderer,
        spatialReference: {
          wkid: 4326,
        },
        geometryType: 'point',
      });

      this.map.layers.add(featureLayer);
      featureLayer.then(() => this.featuresLastUpdated = Date.now());
    }
  }

  closeModal() {
    this.setState({ modalIsOpen: false, donorPosition: null, success: false, error: false });
  }

  validateAddDonor(values) {
    const { firstName, lastName, email, contactNumber, bloodGroup, address } = values;
    return {
      firstName: !_.isString(firstName) ? 'First Name is requird' : undefined,
      lastName: !_.isString(lastName) ? 'Last Name is requird' : undefined,
      email: !EMAIL_REGEXP.test(email) ? 'Email should be valid' : undefined,
      contactNumber: !CONTACT_NUMBER_REGEXP.test(contactNumber) ? 'Contact Number should be valid' : undefined,
      bloodGroup: _.values(BLOOD_GROUPS).indexOf(bloodGroup) === -1 ?
        `Invalid blood group, valid values are ${_.values(BLOOD_GROUPS)}` : undefined,
      address: !_.isString(address) ? 'Address is requird' : undefined,
    };
  }

  addDonor(values) {
    const entity = _.extend(values, { coordinates: this.state.donorPosition });
    apiService.create(entity).then((response) => {
      this.setState({ success: true, posting: response });
    }).catch((error) => {
      this.setState({ error: false });
    });
  }

  render() {
    const options = {
      url: 'https://js.arcgis.com/4.3/'
    };

    return (
      <div className="map-view-container">
        <EsriLoader options={options} ready={this.createMap} />
        <div ref={node => this.mapContainer = node} className='map-view' />
        <Modal
          isOpen={this.state.modalIsOpen}
          onRequestClose={this.closeModal.bind(this)}
          contentLabel="Modal"
         overlayClassName="add-donor-modal-overlay"
        >
          {(this.state.success === true) &&
            <p>
              Donor posting added successfully.
              To edit/delete posting follow <a href={`http://localhost:3000/donors/${this.state.posting.id}`}>this</a> link,
              or you can copy paste the link {`http://localhost:3000/donors/${this.state.posting.id}`}
            </p>
          }
          {(this.state.error === true) &&
            <p>Failed to add donor posting</p>
          }
          <Form
            onSubmit={(values) => this.addDonor(values)}
            postSubmit={(values, state, props, instance) => {
              instance.setFormState({ values: { }, touched: { }, errors: { }, nestedErrors: { }});
            }}
            validate={this.validateAddDonor.bind(this)}>
            {({submitForm}) => {
              return (
                <form onSubmit={submitForm}>
                  <Text field='firstName' placeholder='First Name' />
                  <Text field='lastName' placeholder='Last Name' />
                  <Text field='email' placeholder='email' />
                  <Text field='contactNumber' placeholder='Contact Number e.g +12024044567' />
                  <Text field='bloodGroup' placeholder='Blood group' />
                  <Text field='address' placeholder='Address' />
                  <button type='submit'>Submit</button>
                </form>
              )
            }}
          </Form>
        </Modal>
      </div>
    );
  }
}

class App extends React.PureComponent {

  render() {
    return (
      <Router>
        <div className="app">
          <Switch>
            <Route exact path='/' render={() => <Redirect to='/home' />} />
            <Route exact path='/home' component={MapComponent} />
          </Switch>
        </div>
      </Router>
    );
  }
}

export default App;
