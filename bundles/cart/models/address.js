
// import local dependencies
const Model = require('model');

/**
 * create address class
 */
class Address extends Model {
  /**
   * construct item model
   *
   * @param attrs
   * @param options
   */
  constructor() {
    // run super
    super(...arguments);

    // bind methods
    this.sanitise = this.sanitise.bind(this);
  }

  /**
   * sanitises bot
   *
   * @return {Object}
   */
  async sanitise() {
    // return sanitised bot
    return {
      id        : this.get('_id') ? this.get('_id').toString() : null,
      name      : this.get('name'),
      formatted : this.get('formatted'),
    };
  }
}

/**
 * export Address class
 *
 * @type {Address}
 */
exports = module.exports = Address;
