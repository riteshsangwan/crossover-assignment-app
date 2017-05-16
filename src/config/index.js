/**
 * Copyright (c) 2017. Ritesh Sangwan. All rights reserved.
 */

/**
 * The default react app configuration
 *
 * @author      riteshsangwan
 * @version     1.0.0
 */

const Config = {
  api: {
    baseUrl: 'http://localhost:4000/api/v1',
  },
  socket: {
    url: 'http://localhost:4000',
  },
  APP_BASE_PATH: 'http://localhost:3000',
  BLOOD_GROUPS: {
    O_NEGATIVE: 'O-',
    O_POSITIVE: 'O+',
    A_NEGATIVE: 'A-',
    A_POSITIVE: 'A+',
    B_NEGATIVE: 'B-',
    B_POSITIVE: 'B+',
    AB_NEGATIVE: 'AB-',
    AB_POSITIVE: 'AB+',
  },
  EMAIL_REGEXP: /^[a-z0-9!#$%&'*+/=?^_`{|}~.-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i,
  CONTACT_NUMBER_REGEXP: /^([0]{2})|(\+)\d{11,13}$/i,
};

export default Config;
