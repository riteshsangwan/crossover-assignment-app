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
import socketClient from 'socket.io-client';
import DonorDetail from './DonorDetail';

const apiService = new ApiService(config.api.baseUrl);
const socket = socketClient(config.socket.url);

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

  /**
   * Search donor postings within the map bounds
   * @private
   */
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

  gotoUserPosition(mapView) {
    if (_.hasIn(navigator, 'geolocation') && _.isFunction(navigator.geolocation.getCurrentPosition)) {
      navigator.geolocation.getCurrentPosition(function (position) {
        mapView.goTo([position.coords.longitude, position.coords.latitude]);
      });
    }
  }

  /**
   * Create Map and MapView instances
   * @private
   */
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

      // on load go to user position
      this.gotoUserPosition(this.mapView);

      this.mapView.on('click', this.handleMapViewClick.bind(this));
      this.mapView.watch('extent', this.searchDonors.bind(this, webMercatorUtils, Point, SimpleMarkerSymbol,
        SimpleRenderer, FeatureLayer));
      this.mapView.then(() => this.searchDonors.bind(this, webMercatorUtils, Point, SimpleMarkerSymbol,
        SimpleRenderer, FeatureLayer));
      // setup the socket event listener
      socket.on('donor-posting-change', this.searchDonors.bind(this, webMercatorUtils, Point, SimpleMarkerSymbol,
        SimpleRenderer, FeatureLayer));
    });
  }

  /**
   * Render the feature layer and mark all donors on the map as markers
   * @private
   */
  renderFeatureLayer(Point, SimpleMarkerSymbol, SimpleRenderer, FeatureLayer, donors) {
    /**
     * The extent property of a map can change pretty fast
     * depending on user actions like zoom, drag etc
     * Hence we don't want to re render the features layer everytime the extent property is updated.
     * Only re render the features layer once a second, this will result in significat performance boost
     */
    if (!this.featuresLastUpdated || (Date.now() - this.featuresLastUpdated) > 1000) {
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

  /**
   * Close the add donor modal
   * @private
   *
   */
  closeModal() {
    this.setState({ modalIsOpen: false, donorPosition: null, success: false, error: false });
  }

  /**
   * Validate the add donor form
   * @private
   */
  validateAddDonor(values) {
    const { firstName, lastName, email, contactNumber, bloodGroup, address } = values;
    return {
      firstName: !_.isString(firstName) ? 'First Name is requird' : undefined,
      lastName: !_.isString(lastName) ? 'Last Name is requird' : undefined,
      email: !config.EMAIL_REGEXP.test(email) ? 'Email should be valid' : undefined,
      contactNumber: !config.CONTACT_NUMBER_REGEXP.test(contactNumber) ? 'Contact Number should be valid' : undefined,
      bloodGroup: _.values(config.BLOOD_GROUPS).indexOf(bloodGroup) === -1 ?
        `Invalid blood group, valid values are ${_.values(config.BLOOD_GROUPS)}` : undefined,
      address: !_.isString(address) ? 'Address is requird' : undefined,
    };
  }

  /**
   * Add the donor posting
   * @private
   */
  addDonor(values) {
    const entity = _.extend(values, { coordinates: this.state.donorPosition });
    apiService.create(entity).then((response) => {
      this.setState({ success: true, posting: response });
    }).catch((error) => {
      this.setState({ error: false });
    });
  }

  /**
   * Render component Heirarchy
   */
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
            <div className="alert alert-success">
              Donor posting added successfully.
              To edit/delete posting follow <a href={`${config.APP_BASE_PATH}/donors/${this.state.posting.id}`}>this</a> link,
              or you can copy paste the link {`${config.APP_BASE_PATH}/donors/${this.state.posting.id}`}
            </div>
          }
          {(this.state.error === true) &&
            <div className="alert alert-warning">
              Failed to add donor posting
            </div>
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
                  <div className="form-group">
                    <Text field='firstName' placeholder='First Name' className='form-control' />
                  </div>
                  <div className="form-group">
                    <Text field='lastName' placeholder='Last Name' className='form-control' />
                  </div>
                  <div className="form-group">
                    <Text field='email' placeholder='email' className='form-control' />
                  </div>
                  <div className="form-group">
                    <Text field='contactNumber' placeholder='Contact Number e.g +12024044567' className='form-control' />
                  </div>

                  <div className="form-group">
                    <Text field='bloodGroup' placeholder='Blood group' className='form-control' />
                  </div>

                  <div className="form-group">
                    <Text field='address' placeholder='Address' className='form-control' />
                  </div>
                  <div className="form-group">
                    <button type="submit" className="btn btn-primary">Submit</button>
                  </div>
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
            <Route exact path='/donors/:donorId' component={DonorDetail} />
          </Switch>
        </div>
      </Router>
    );
  }
}

export default App;
