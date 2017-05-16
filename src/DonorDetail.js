/**
 * Copyright (c) 2017. Ritesh Sangwan. All rights reserved.
 */

/**
 * Donor detail component
 *
 * @author      riteshsangwan
 * @version     1.0.0
 */

import React from 'react';
import _ from 'lodash';
import './App.css';
import ApiService from './services/ApiService';
import config from './config';
import { Form, Text } from 'react-form';

const apiService = new ApiService(config.api.baseUrl);

class DonorViewDetail extends React.Component {

  editMode() {
    event.stopPropogation();
    event.preventDefault();
    this.props.changeMode('edit', this.props.donor);
  }

  render() {
    return (
      <div className="row">
        <div className="col-md-12">
          <div className="panel panel-default detail-panel">
            <div className="panel-body">
              <dl className="dl-horizontal">
                <dt>ID</dt>
                <dd>{this.props.donor.id}</dd>
                <dt>Email</dt>
                <dd>{this.props.donor.email}</dd>
                <dt>First Name</dt>
                <dd>{this.props.donor.firstName}</dd>
                <dt>Last Name</dt>
                <dd>{this.props.donor.lastName}</dd>
                <dt>Contact Number</dt>
                <dd>{this.props.donor.contactNumber}</dd>
                <dt>Blood Group</dt>
                <dd>{this.props.donor.bloodGroup}</dd>
                <dt>Address</dt>
                <dd>{this.props.donor.address}</dd>
                <dt>Last Activity IP</dt>
                <dd>{this.props.donor.ip}</dd>
              </dl>
            </div>
            <div className="panel-footer">
              <button type="button" className="btn btn-primary" onClick={() => this.props.changeMode('edit', this.props.donor)}>Edit</button>
              <button type="button" className="btn btn-success" onClick={() => this.props.changeMode('home', this.props.donor)}>Home</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

class DonorEditDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      donor: _.cloneDeep(props.donor),
      success: false,
      error: false,
    };
  }

  editDonor(values) {
    const entity = _.omit(_.extend(this.state.donor, values), 'location', 'id', 'ip');
    const changeMode = this.props.changeMode;
    apiService.update(this.props.donor.id, entity).then((donor) => {
      this.setState({ success: true });
      setTimeout(function () {
        changeMode('view', donor);
      }, 3000);
    }).catch((error) => {
      this.setState({ error: error.responseText });
    })
  }

  /**
   * Validate the add donor form
   * @private
   */
  validateDonor(values) {
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

  render() {
    return (
      <div className="row">
        <div className="col-md-12">
          {this.state.success &&
            <div className="row">
              <div className="col col-md-12 col-lg-12">
                <div className="alert alert-success">
                  <p>Donor updated successfully, we will redirect you to detail page.</p>
                </div>
              </div>
            </div>
          }
          {_.isString(this.state.error) &&
            <div className="row">
              <div className="col col-md-12 col-lg-12">
                <div className="alert alert-danger">
                  <p>Failed to edit donor details, try again later</p>
                  <p>{this.state.error}</p>
                </div>
              </div>
            </div>
          }
          <Form
            defaultValues={_.omit(this.state.donor, 'location', 'id')}
            onSubmit={(values) => this.editDonor(values)}
            postSubmit={(values, state, props, instance) => {
              instance.setFormState({ values: { }, touched: { }, errors: { }, nestedErrors: { }});
            }}
            validate={this.validateDonor.bind(this)}>
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
        </div>
      </div>
    );
  }
}

class DonorDetail extends React.Component {

  constructor(props) {
    super(props);
    this.state = { error: false };
  }

  componentDidMount() {
    if (_.has(this.props, 'match.params.donorId')) {
      apiService.get(this.props.match.params.donorId).then((respose) => {
        this.setState({ donor: respose, mode: 'view' });
      }).catch((error) => {
        this.setState({ error: error.responseText })
      })
    }
  }

  changeMode(mode, donor) {
    if (mode === 'home') {
      this.props.history.push('/home');
    } else {
      this.setState({ mode: mode, donor: donor });
    }
  }

  render() {
    return (
      <div className="container-fluid donor-detail-container">
        {_.isString(this.state.error) &&
          <div className="row">
            <div className="col col-md-12 col-lg-12">
              <div className="alert alert-danger">
                <p>Failed to load donor details, try again later</p>
                <p>{this.state.error}</p>
              </div>
            </div>
          </div>
        }
        {this.state.mode === 'view' &&
          <DonorViewDetail donor={this.state.donor} changeMode={this.changeMode.bind(this)} />
        }
        {this.state.mode === 'edit' &&
          <DonorEditDetail donor={this.state.donor} changeMode={this.changeMode.bind(this)} />
        }
      </div>
    );
  }
}

export default DonorDetail;
