
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes');
var RedisStore = require('connect-redis')(express);
var arg = require('optimist').argv;
var app = module.exports = express.createServer();
var _ = require('underscore')
delete express.bodyParser.parse['multipart/form-data'];

_.str = require('underscore.string');

var cms = require('./lib/cms');

cms.add('main_category',{
	searchable:true,
	fields:{
		name:{type:'string'},
		tag:{type:'string'},
		description:{type:'string', multi:true},
		image:{type:'image',sizes:[{prefix:"medium", width:270, height:270,}, {prefix:"mediumbig", width:370, height:370}]}
	}
});
cms.add('main_subcategory',{
	searchable:true,
	fields:{
		name:{type:'string'},
		category:{type:'string', source:'main_category.name', autocomplete:true},
		tag:{type:'string'},
		description:{type:'string', multi:true},
		image:{type:'image',sizes:[{prefix:"medium", width:170, height:170}]}
	}
});
cms.add('main_product',{
	searchable:true,
	fields:{
		name:{type:'string'},
		details:{type:'string', multi:true},
		price:{type:'string'},
		subcategory:{type:'string', source:'main_subcategory.name', autocomplete:true},
		description:{type:'string', multi:true, rtl:true},
		featured:{type:'boolean'},
		popular:{type:'boolean'},
		gallery:{type:'images', maintain_ratio:false, sizes:[
			{
				prefix:"small_",
				height:50,
				width:50
			},
			{
				prefix:"medium_",
				height:300,
				width:300
			},
			{
				prefix:"mediumbig_",
				height:370,
				width:370
			},
			{
				prefix:"large_",
				height:500,
				width:500
			},		
			{
				prefix:"vlarge_",
				width:750,
				height:750
			}		
		]}
	}
});
cms.add('pages_common',{
	title:{type:'string'},
	description:{type:'string', multi:true},
	photos:{type:'images'}
});
cms.add('pages_homepage',{
	banners:{type:'images'},
	featured_products:{type:'string'},
	featured_categories:{type:'string'}
});

cms.add('homepage_slides',{
	single:true,
	fields:{
		image1:{type:'image', crop_height:500, crop_width:1170, sizes:[{crop:true, prefix:"fixed_", height:500, width:1170}]},
		image1_heading:{type:'string'},
		image1_details:{type:'string'},
		image1_url:{type:'string'},
		image1_url_label:{type:'string'},
		image2:{type:'image', crop_height:500, crop_width:1170, sizes:[{crop:true, prefix:"fixed_", height:500, width:1170}]},
		image2_heading:{type:'string'},
		image2_details:{type:'string'},
		image2_url:{type:'string'},
		image2_url_label:{type:'string'},
		image3:{type:'image', crop_height:500, crop_width:1170, sizes:[{crop:true, prefix:"fixed_", height:500, width:1170}]},
		image3_heading:{type:'string'},
		image3_details:{type:'string'},
		image3_url:{type:'string'},
		image3_url_label:{type:'string'},
		image4:{type:'image', crop_height:500, crop_width:1170, sizes:[{crop:true, prefix:"fixed_", height:500, width:1170}]},
		image4_heading:{type:'string'},
		image4_details:{type:'string'},
		image4_url:{type:'string'},
		image4_url_label:{type:'string'}
	}
});

cms.add('homepage_featured_products',{
	//GENERATE GUI = false
	single:true,
	render:false,
	fields:{
		prod1:{type:'reference', collection:'main_product'},
		prod2:{type:'reference', collection:'main_product'},
		prod3:{type:'reference', collection:'main_product'},
		prod4:{type:'reference', collection:'main_product'}
	}
});

cms.add('homepage_popular_products',{
	//GENERATE GUI = false
	single:true,
	render:false,
	fields:{
		prod1:{type:'reference', collection:'main_product'},
		prod2:{type:'reference', collection:'main_product'},
		prod3:{type:'reference', collection:'main_product'},
		prod4:{type:'reference', collection:'main_product'}
	}
});

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.compress());
  app.use(express.cookieParser("herro"));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(require('stylus').middleware({ src: __dirname + '/public' }));
  app.use(express.static(__dirname + '/public'));
  app.use(express.session({secret:"herro",store: new RedisStore, cookie: { maxAge: 600000000 ,httpOnly: false, secure: false}}));
  app.use(app.router);

});
cms.listen(app);

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', function(req, res){
	//slides
	var index = {};
	cms.homepage_slides.findOne(function(err, slides){
		index.slides = slides;
		//popular products
		cms.homepage_popular_products
		.findOne()
		.populate('prod1 prod2 prod3 prod4')
		.exec(function(err, popular){
			index.popular = popular;
			cms.homepage_featured_products
			.findOne()
			.populate('prod1 prod2 prod3 prod4')
			.exec(function(err, featured){
				index.featured = featured;
				res.render('index', index);
			});
		});
	});
});
app.get('/products', function(req,res){
	cms.main_category.find({}, function(err, categories){
		if(err) throw err;
		if(!categories){
			return res.redirect('/');
		}
		//find a featured prod
		cms.homepage_featured_products
		.findOne()
		.populate('prod1 prod2 prod3 prod4')
		.exec(function(err, featured){
			console.log(featured);
			if(featured){
				var feature_val = featured['prod'+((Math.random() * 4) << .5)];
			}
			res.render('products',{categories:categories, featured:feature_val});
		});
	});
});
app.get('/products/:category', function(req,res){
	var category = req.params.category.replace(/-/g, ' ');
	var query_category = new RegExp(category, 'gi');
	cms.main_category.findOne({name:query_category}, function(err, cat){
		if(err) throw err;
		console.log(cat);
		if(cat){
			cms.main_subcategory.find({category:query_category}, function(err, subcats){
				if(err) throw err;
				res.render('category',{category:cat, subcategories:subcats});
			});
		}else{
			return res.redirect('/');
		}
	});
});
app.get('/products/:category/:subcategory', function(req,res){
	var category = req.params.category.replace(/-/g, ' ');
	var subcategory = req.params.subcategory.replace(/-/g, ' ');
	
	var query_subcat = new RegExp(subcategory, 'gi');
	
	var products = {};
	//latest
	cms.main_product.find({subcategory:query_subcat})
	.sort({_id:-1})
	.limit(2)
	.exec(function(err, latest){
		if(err) throw err;
		products.latest = latest
		//featured
		cms.main_product
		.find({subcategory: query_subcat, featured:true})
		.sort({_id:-1})
		.limit(4)
		.exec(function(err, featured){
			//popular
			cms.main_product
			.find({subcategory: query_subcat, popular:true})
			.sort({_id:-1})
			.limit(4)
			.exec(function(err, popular){
				var nav = {category:category, subcategory:subcategory, link:'/products/' + req.params.category + '/' + req.params.subcategory + '/'};
				res.render('subcategory', {nav:nav, latest:latest, featured:featured, popular:popular, subcategory:req.params});
			});
		});
	});

});
app.get('/products/:category/:subcategory/:product', function(req,res){
	var category = req.params.category.replace(/-/g, ' ');
	var subcategory = req.params.subcategory.replace(/-/g, ' ');
	var product = req.params.product.replace(/-/g, ' ');
	
	var query_subcat = new RegExp(subcategory, 'gi');
	var query_product = new RegExp(product, 'gi');

	cms.main_product.findOne({subcategory: query_subcat, name:query_product}, function(err, product){
		if(!product){
			return res.redirect('/');
		}
		//popular
		cms.main_product
		.find({subcategory: query_subcat, popular:true})
		.sort({_id:-1})
		.limit(3)
		.exec(function(err, popular){
			//related
			cms.main_product
			.find({subcategory: query_subcat})
			.limit(8)
			.exec(function(err, related){
				var nav = {category:category, subcategory:subcategory, link:'/products/' + req.params.category + '/' + req.params.subcategory + '/'};
				res.render('product', {product:product, popular:popular, related:related, nav:nav});
			});
		});
	});
});

//custom cms
app.get('/cms/products/:name', function(req, res){
	cms.main_product.find({name:new RegExp(req.params.name, "gi")}, function(err, prod){
		res.json(prod);
	});
});

app.get('/products/:category/:subcategory/all', function(req, res){
	var category = req.params.category.replace(/-/g, ' ');
	var subcategory = req.params.subcategory.replace(/-/g, ' ');
	var product = req.params.product.replace(/-/g, ' ');
	
	var query_subcat = new RegExp(subcategory, 'gi');
	var query_product = new RegExp(product, 'gi');
	cms.main_product
	.find({subcategory: query_subcat})
	.sort({_id:-1})
	.exec(function(err, products){
		
	});
	
});


app.listen(arg.p || 3010, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
