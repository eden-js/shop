/* eslint-disable no-nested-ternary */

// require dependencies
const Events = require('events');

// require local dependencies
const store        = require('default/public/js/store');
const cartStore    = require('cart/public/js/cart');
const productStore = require('product/public/js/product');

/**
 * build bootstrap class
 */
class CheckoutStore extends Events {
  /**
   * construct bootstrap class
   */
  constructor() {
    // set observable
    super();

    // set default variables
    this._extra = {};
    this.loading = false;

    // bind methods
    this.build = this.build.bind(this);
    this.submit = this.submit.bind(this);
    this.update = this.update.bind(this);

    // on cartStore update
    cartStore.on('update', () => {
      // build
      this.build({
        lines    : cartStore.lines,
        products : cartStore.products,
      });
    });
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // BUILD METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * build cartStore
   */
  async build(order) {
    // check res
    Object.keys(order || {}).forEach((key) => {
      // set value
      this[key] = order[key];
    });

    // set loading
    this.loading = false;

    // trigger update
    this.update();
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // NORMAL METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * gets actions
   *
   * @return {*}
   */
  getActions() {
    // get actions
    let actions = Object.values(this.actions);

    // run actions
    actions = actions.sort((a, b) => {
      // set x/y
      const x = a.priority || 0;
      const y = b.priority || 0;

      // return action
      return x < y ? -1 : x > y ? 1 : 0;
    });

    // return actions
    return actions;
  }

  /**
   * set extra
   *
   * @param  {String}  name
   * @param  {*}       value
   *
   * @return {Promise}
   */
  async extra(name, value) {
    // set extra
    this._extra[name] = value;

    // check value
    if (!value) delete this._extra[name];

    // trigger update
    this.update();
  }

  /**
   * submits checkout
   *
   * @return {Promise}
   */
  async submit() {
    // set loading
    this.loading = true;

    // trigger update
    this.update();

    // log data
    const res = await fetch(`/checkout/${this.id}/complete`, {
      body : JSON.stringify({
        id      : this.id,
        lines   : this.lines,
        actions : this.actions,
      }),
      method  : 'post',
      headers : {
        'Content-Type' : 'application/json',
      },
      credentials : 'same-origin',
    });

    // load json
    const order = await res.json();

    // check error
    if (order.error) {
      // set loading
      this.loading = false;

      // trigger update
      this.update();

      // alert error
      return eden.alert.error(order.error.text);
    }

    // check redirect
    if (order.redirect) return eden.router.go(order.redirect);

    // update order
    if (order.id) return eden.router.go(`/order/${order.id}`);

    // set loading
    this.loading = false;

    // trigger update
    this.update();

    // return order
    return order;
  }

  /**
   * get product total
   *
   * @return {Float}
   */
  async total(withDiscount) {
    // let total
    let total = 0;

    // sort into groups
    (this.lines || []).forEach((line) => {
      // find product
      const product = (this.products || []).find((check) => {
        // return check
        return check.id === line.product;
      });

      // add to total
      total += productStore.price(product, line.opts) * line.qty;
    });

    // set opts
    const opts = {
      total,
      lines    : this.lines,
      actions  : this.actions,
      discount : 0,
      products : this.products,
    };

    // with discount
    if (withDiscount) await eden.hook('checkout.total', opts);

    // return total
    return opts.total;
  }

  /**
   * updates view
   */
  update() {
    // trigger update
    this.emit('update');
  }
}

/**
 * export new bootstrap function
 *
 * @return {CheckoutStore}
 */
const builtStore = new CheckoutStore();

/**
 * set built store
 */
store.set('checkout', builtStore);

/**
* export built store
*/
module.exports = builtStore;
