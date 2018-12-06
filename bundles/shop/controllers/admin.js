
// bind dependencies
const Controller = require('controller');

// get block model
const Acl       = model('acl');
const User      = model('user');
const Order     = model('order');
const Block     = model('block');
const Credit    = model('credit');
const Payment   = model('payment');
const Dashboard = model('dashboard');

// require helpers
const BlockHelper = helper('cms/block');

/**
 * build Block controller
 *
 * @acl      admin.shop
 * @fail     next
 * @mount    /admin/shop
 * @priority 50
 */
class ShopAdminController extends Controller {
  /**
   * construct Block controller
   */
  constructor () {
    // run super
    super();

    // bind methods
    this.blocks = this.blocks.bind(this);

    // register blocks
    this.blocks();
  }

  /**
   * admin Shop index
   *
   * @param  {Request}   req
   * @param  {Response}  res
   * @param  {Function}  next
   *
   * @menu   {ADMIN} Shop
   * @icon   fa fa-shopping-cart
   * @route  {GET} /
   * @layout admin
   */
  async indexAction (req, res) {
    // get dashboards
    let dashboards = await Dashboard.where({
      'type' : 'admin.shop'
    }).or({
      'user.id' : req.user.get('_id').toString()
    }, {
      'public' : true
    }).find();

    // Render admin page
    res.render('admin', {
      'name'       : 'Admin Shop',
      'type'       : 'admin.shop',
      'blocks'     : BlockHelper.renderBlocks('admin'),
      'jumbotron'  : 'Manage Shop',
      'dashboards' : await Promise.all(dashboards.map(async (dashboard, i) => dashboard.sanitise(i === 0 ? req : null)))
    });
  }

  /**
   * creates blocks
   */
  blocks () {

    /**
     * STAT WIDGETS
     */

    // register simple block
    BlockHelper.block('dashboard.shop.income', {
      'acl'         : ['admin.shop'],
      'for'         : ['admin'],
      'title'       : 'Shop Income Stats',
      'description' : 'Shop income stat block'
    }, async (req, block) => {
      // get notes block from db
      let blockModel = await Block.findOne({
        'uuid' : block.uuid
      }) || new Block({
        'uuid' : block.uuid,
        'type' : block.type
      });

      // get data
      let data = await this._getIncomeStat();

      // set other info
      data.tag   = 'stat';
      data.href  = '/admin/payment';
      data.titles = {
        'today' : 'Income Today',
        'total' : 'Total Income'
      };
      data.color = blockModel.get('color') || 'primary';
      data.class = blockModel.get('class') || 'col';
      data.title = blockModel.get('title') || '';

      // return
      return data;
    }, async (req, block) => {
      // get notes block from db
      let blockModel = await Block.findOne({
        'uuid' : block.uuid
      }) || new Block({
        'uuid' : block.uuid,
        'type' : block.type
      });

      // set data
      blockModel.set('color', req.body.data.color);
      blockModel.set('class', req.body.data.class);
      blockModel.set('title', req.body.data.title);

      // save block
      await blockModel.save();
    });

    // register simple block
    BlockHelper.block('dashboard.shop.expense', {
      'acl'         : ['admin.shop'],
      'for'         : ['admin'],
      'title'       : 'Shop Expense Stats',
      'description' : 'Shop expenses stat block'
    }, async (req, block) => {
      // get notes block from db
      let blockModel = await Block.findOne({
        'uuid' : block.uuid
      }) || new Block({
        'uuid' : block.uuid,
        'type' : block.type
      });

      // get data
      let data = await this._getExpenseStat();

      // set other info
      data.tag   = 'stat';
      data.href  = '/admin/shop';
      data.titles = {
        'today' : 'Expenses Today',
        'total' : 'Total Expenses'
      };
      data.color = blockModel.get('color') || 'primary';
      data.class = blockModel.get('class') || 'col';
      data.title = blockModel.get('title') || '';

      // return
      return data;
    }, async (req, block) => {
      // get notes block from db
      let blockModel = await Block.findOne({
        'uuid' : block.uuid
      }) || new Block({
        'uuid' : block.uuid,
        'type' : block.type
      });

      // set data
      blockModel.set('color', req.body.data.color);
      blockModel.set('class', req.body.data.class);
      blockModel.set('title', req.body.data.title);

      // save block
      await blockModel.save();
    });

    // register simple block
    BlockHelper.block('dashboard.shop.orders', {
      'acl'         : ['admin.shop'],
      'for'         : ['admin'],
      'title'       : 'Shop Order Stats',
      'description' : 'Shop orders stat block'
    }, async (req, block) => {
      // get notes block from db
      let blockModel = await Block.findOne({
        'uuid' : block.uuid
      }) || new Block({
        'uuid' : block.uuid,
        'type' : block.type
      });

      // get data
      let data = await this._getOrdersStat();

      // set other info
      data.tag    = 'stat';
      data.href   = '/admin/order';
      data.titles = {
        'today' : 'Orders Today',
        'total' : 'Total Orders'
      };
      data.color = blockModel.get('color') || 'primary';
      data.class = blockModel.get('class') || 'col';
      data.title = blockModel.get('title') || '';

      // return
      return data;
    }, async (req, block) => {
      // get notes block from db
      let blockModel = await Block.findOne({
        'uuid' : block.uuid
      }) || new Block({
        'uuid' : block.uuid,
        'type' : block.type
      });

      // set data
      blockModel.set('color', req.body.data.color);
      blockModel.set('class', req.body.data.class);
      blockModel.set('title', req.body.data.title);

      // save block
      await blockModel.save();
    });
  }

  /**
   * income statistics
   *
   * @return {Object}
   */
  async _getIncomeStat () {
    // let date
    let start = new Date();
        start.setHours(24, 0, 0, 0);
        start.setDate(start.getDate() - 14);

    // set last
    let last = new Date();
        last.setHours(24, 0, 0, 0);

    // create Date
    let current = new Date(start);

    // set totals
    let totals = [];
    let values = [];

    // loop for deposits
    while (current <= last) {
      // set next
      let next = new Date(current);
          next.setDate(next.getDate() + 1);

      // return amount sum
      let total = await Payment.where('complete', true).gte('created_at', current).lte('created_at', next).gte('amount', 0).sum('amount');

      // add to totals
      totals.push(total);
      values.push(total);

      // add to date
      current = next;
    }

    // set midnight
    let midnight = new Date();
        midnight.setHours(0, 0, 0, 0);

    // return totals and values
    return {
      'total'   : '$' + (await Payment.gte('amount', 0).sum('amount')).toFixed(2),
      'today'   : '$' + (await Payment.gte('amount', 0).gte('created_at', new Date(new Date().setHours (0, 0, 0, 0))).sum('amount')).toFixed(2),
      'weekly'  : '$' + (await Payment.gte('amount', 0).gte('created_at', new Date(midnight.getTime() - (7 * 24 * 60 * 60 * 1000))).sum('amount')).toFixed(2),
      'monthly' : '$' + (await Payment.gte('amount', 0).gte('created_at', new Date(midnight.getTime() - (30 * 24 * 60 * 60 * 1000))).sum('amount')).toFixed(2),

      totals,
      values
    };
  }

  /**
   * deposit logic
   *
   * @return {Object}
   */
  async _getExpenseStat () {
    // let date
    let start = new Date();
        start.setHours(24, 0, 0, 0);
        start.setDate(start.getDate() - 14);

    // set last
    let last = new Date();
        last.setHours(24, 0, 0, 0);

    // create Date
    let current = new Date(start);

    // set totals
    let totals = [];
    let values = [];

    // loop for deposits
    while (current <= last) {
      // set next
      let next = new Date(current);
          next.setDate(next.getDate() + 1);

      // return amount sum
      let total = await Credit.where('credited', true).gte('created_at', current).lte('created_at', next).gte('amount', 0).sum('amount');

      // add to totals
      totals.push(total);
      values.push(total);

      // add to date
      current = next;
    }

    // set midnight
    let midnight = new Date();
        midnight.setHours(0, 0, 0, 0);

    // return totals and values
    return {
      'total'   : '$' + (await Credit.gte('amount', 0).sum('amount')).toFixed(2),
      'today'   : '$' + (await Credit.gte('amount', 0).gte('created_at', new Date(new Date().setHours (0, 0, 0, 0))).sum('amount')).toFixed(2),
      'weekly'  : '$' + (await Credit.gte('amount', 0).gte('created_at', new Date(midnight.getTime() - (7 * 24 * 60 * 60 * 1000))).sum('amount')).toFixed(2),
      'monthly' : '$' + (await Credit.gte('amount', 0).gte('created_at', new Date(midnight.getTime() - (30 * 24 * 60 * 60 * 1000))).sum('amount')).toFixed(2),

      totals,
      values
    };
  }

  /**
   * deposit logic
   *
   * @return {Object}
   */
  async _getOrdersStat () {
    // let date
    let start = new Date();
        start.setHours(24, 0, 0, 0);
        start.setDate(start.getDate() - 14);

    // set last
    let last = new Date();
        last.setHours(24, 0, 0, 0);

    // create Date
    let current = new Date(start);

    // set totals
    let totals = [];
    let values = [];

    // loop for deposits
    while (current <= last) {
      // set next
      let next = new Date(current);
          next.setDate(next.getDate() + 1);

      // return amount sum
      let total = await Order.gte('created_at', current).lte('created_at', next).nin('status', [null, 'pending']).count();

      // add to totals
      totals.push(total);
      values.push(total);

      // add to date
      current = next;
    }

    // set midnight
    let midnight = new Date();
        midnight.setHours(0, 0, 0, 0);

    // return totals and values
    return {
      'total'   : (await Order.nin('status', [null, 'pending']).count()).toLocaleString(),
      'today'   : (await Order.nin('status', [null, 'pending']).gte('created_at', new Date(new Date().setHours (0, 0, 0, 0))).count()).toLocaleString(),
      'weekly'  : (await Order.nin('status', [null, 'pending']).gte('created_at', new Date(midnight.getTime() - (7 * 24 * 60 * 60 * 1000))).count()).toLocaleString(),
      'monthly' : (await Order.nin('status', [null, 'pending']).gte('created_at', new Date(midnight.getTime() - (30 * 24 * 60 * 60 * 1000))).count()).toLocaleString(),

      totals,
      values
    };
  }
}

/**
 * export ShopAdminController controller
 *
 * @type {ShopAdminController}
 */
exports = module.exports = ShopAdminController;
