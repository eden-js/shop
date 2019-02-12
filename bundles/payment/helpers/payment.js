/**
 * Created by Awesome on 3/6/2016.
 */

// use strict


// require dependencies
const config = require('config');
const colors = require('colors');
const Helper = require('helper');

// require models
const Invoice = model('invoice');
const Payment = model('payment');
const Product = model('product');

// get helpers
const ProductHelper = helper('product');

/**
 * build payment helper
 */
class PaymentHelper extends Helper {
  /**
   * construct payment helper
   */
  constructor() {
    // run super
    super();

    // bind methods
    this.payment = this.payment.bind(this);
    this.invoice = this.invoice.bind(this);

    // bind private methods
    this._log = this._log.bind(this);
  }

  /**
   * create payment function
   *
   * @param  {order}  Order
   * @param  {Object} method
   *
   * @return  {Promise}
   * @resolve {invoice}
   */
  async invoice(order) {
    // get lines
    const user  = await order.get('user');
    const lines = order.get('lines');

    // create new invoice
    const invoice = new Invoice({
      order,

      user  : await order.get('user'),
      total : (await Promise.all(lines.map(async (line) => {
        // get product
        const product = await Product.findById(line.product);

        // get price
        const price = await ProductHelper.price(product, line.opts || {});

        // return value
        const amount = parseFloat(price.amount) * parseInt(line.qty || 1);

        // hook
        await this.eden.hook('line.price', {
          qty  : line.qty,
          user : await order.get('user'),
          opts : line.opts,

          order,
          price,
          amount,
          product,
        });

        // set price
        line.price = price;
        line.total = amount;

        // return price
        return price.amount * parseInt(line.qty || 1);
      }))).reduce((total, x) => total += x, 0),
      lines : order.get('lines'),
    });

    // get lines
    order.set('lines', lines);

    // save order
    await order.save(user);

    // save invoice
    await invoice.save(user);

    // hook invoice
    await this.eden.hook('invoice.init', invoice);

    // save invoice
    await invoice.save(user);

    // return invoice
    return invoice;
  }

  /**
   * creates payment for order
   *
   * @param  {order}  Order
   *
   * @return {Promise}
   */
  async payment(invoice, method) {
    // get total
    const user  = await invoice.get('user');
    const total = parseFloat(invoice.get('total'));

    // do payment
    const payment = new Payment({
      user,
      invoice,
      rate     : invoice.get('rate') || 1,
      order    : await invoice.get('order'),
      amount   : total,
      currency : invoice.get('currency') || config.get('shop.currency') || 'USD',
      complete : false,
    });

    // save payment
    await payment.save(user);

    // Set method
    payment.set('method', method);

    // do payment
    await this.eden.hook('payment.pay', payment);

    // Unset method data
    payment.unset('method.data.card');

    // save payment
    await payment.save(user);

    // return payment
    return payment;
  }

  /**
   * logs payment transaction
   *
   * @param  {user}     User
   * @param  {String}   way
   * @param  {string}   message
   * @param  {Boolean}  success
   */
  _log(user, way, message, success) {
    // log with log function
    this.logger.log((success ? 'info' : 'error'), ` [${colors.green(user.get('username'))}] ${message}`, {
      class : 'payment',
    });
  }
}

/**
 * export new paymentHelper class
 *
 * @return {PaymentHelper}
 */
module.exports = new PaymentHelper();
