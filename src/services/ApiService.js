/**
 * Copyright (c) 2017. Ritesh Sangwan. All rights reserved.
 */

/**
 * A simple implementation of /donors API contract
 *
 * @author      riteshsangwan
 * @version     1.0.0
 */
import reqwest from 'reqwest';

/**
 * ApiService consumer, full implement the rest contract
 */
class ApiService {
  /**
   * Default Constructor
   * @param  {String}   baseUrl      the base API path
   */
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  search(ne, sw) {
    const url = `${this.baseUrl}/donors/search`;

    return reqwest({ url: url, data: { ne, sw } });
  }

  create(entity) {
    const url = `${this.baseUrl}/donors`;
    return reqwest({ url: url, data: entity, method: 'post' });
  }

  update(id, entity) {
    const url = `${this.baseUrl}/donors/${id}`;
    return reqwest({ url: url, data: entity, method: 'put' });
  }

  delete(id) {
    const url = `${this.baseUrl}/donors/${id}`;
    return reqwest({ url: url, method: 'delete' });
  }

  get(id) {
    const url = `${this.baseUrl}/donors/${id}`;
    return reqwest({ url: url });
  }
}

export default ApiService;
