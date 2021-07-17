let express = require('express');
let session = require('express-session');
let route = express.Router();
let db = require('../database/config');
var { withKeyCredentials, CollectionsClient } = require('@sajari/sdk-node');
const { QueryCollectionRequestTrackingType } = require('@sajari/sdk-node/build/src/generated/model/queryCollectionRequestTrackingType');

route.get('/', function(req, res) {
  let products;
  db.query("SELECT * FROM products left join categories on categories.id=products.category", function (err, result, fields) {
    if (err) {
      throw err;
    } else {
      //console.log(result);
      res.render('products', {title: 'Shop', products: result});
    }
  });
});

route.get('/product/:product', function(req, res) {
  let products;
  db.query("SELECT * FROM products left join categories on categories.id=products.category where pid='"+req.params.product+"'", function (err, result, fields) {
    if (err) {
      throw err;
    } else {
      //console.log(result);
      res.render('product', {title: 'Product', products: result});
    }
  });
});

route.get('/add-to-cart/:product', function(req, res) {
  //Cart through session

  let product = req.params.product.split("-")[1];
  //Cart through cookie
  let products = [];
  if(req.cookies.node_express_ecommerce) {
    products = req.cookies.node_express_ecommerce;
  }
  /*products.push({
    id: req.params.product,
    qnt: 1
  });*/
  db.query("SELECT * FROM products left join categories on categories.id=products.category where pid='"+product+"'", function (err, result, fields) {
    if (err) {
      console.log(err)
      res.render('page', {title: 'About'});
    } else {
      let flag = 0;
      products.forEach(item => {
        if(item.pid == product) {
          flag = 1;
        }
      });
      //console.log(result);
      if(flag == 0) {
        products.push({
          pid: result[0].pid,
          title: result[0].title,
          name: result[0].name,
          price: result[0].price,
          picture: result[0].picture,
          qnt: 1
        });
      }

      //res.send(products);
      res.cookie('node_express_ecommerce', products, {path:'/'});
      res.redirect('/cart');
    }
  });
});

route.get('/remove-from-cart/:index', function(req, res) {
  let products = req.cookies.node_express_ecommerce;
  let index = req.params.index.split("-")[1];
  products.splice(index, 1);
  res.cookie('node_express_ecommerce', products, {path:'/'});
  
  res.redirect('/cart');
});

route.get('/empty-cart', function(req, res) {
  let products = [];
  res.cookie('node_express_ecommerce', products, {path:'/'});
  
  res.redirect('/cart');
});

route.get('/cart', function(req, res) {
  let products = [];
  
  if(req.cookies.node_express_ecommerce) {
    res.render('cart', {title: 'Cart', products: req.cookies.node_express_ecommerce});
  } else {
    res.render('cart', {title: 'Cart', products: products});
  }
});

route.post('/update-cart', function(req, res) {
  //console.log(req.cookies.node_express_ecommerce);
  let products = req.cookies.node_express_ecommerce;
  products.forEach(function(product, index) {
    product.qnt = req.body.qnt[index];
  });
  //console.log(req.body)
  res.clearCookie('node_express_ecommerce', {path:'/'});
  res.cookie('node_express_ecommerce', products);
  res.redirect('/cart');
});

route.get('/checkout', function(req, res) {
  //res.send('<h1>About page</h1>');
  res.render('order', {title: 'Checkout'});
});

route.get('/about', function(req, res) {
  //res.send('<h1>About page</h1>');
  res.render('page', {title: 'About'});
});

route.get('/contact', function(req, res) {
  res.render('page', {title: 'Contact'});
});

route.get('/search', async function (req, res) {
  const q = req.query.q;
  if (!q || !q.length) {
    return res.redirect('/');
  }

  const keyCredentials = withKeyCredentials(process.env.SAJARI_KEY_ID, process.env.SAJARI_KEY_SECRET);

  const client = new CollectionsClient(keyCredentials);

  let response;

  try {
    response = await client.queryCollection(process.env.SAJARI_COLLECTION_ID, {
      variables: {
        q
      },
      tracking: {
        type: QueryCollectionRequestTrackingType.Click,
        field: 'title',
        data: {},
        queryId: '123'
      }
    });
  } catch (err) {
    console.error(err);
    return res.redirect('/');
  }

  console.log(response);
  
  let products = [];

  if (response.results && response.results.length) {
    const results = response.results;
    console.log(results[0].token);

    const pids = results.map((result) => result.record.pid);

    db.query("SELECT * FROM products left join categories on categories.id=products.category where pid IN (?) ORDER BY field(pid, ?)", [pids, pids], function (err, rows, fields) {
      if (err) {
        throw err;
      } else {
        products = rows;
        res.render('search', {title: 'Search Results', products, q});
      }
    });
  } else {
    res.render('search', {title: 'Search Results', products, q});
  }
});

module.exports = route;