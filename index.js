const express = require('express');
const bodyparser = require('body-parser');
const path = require('path');
const app = express();
const mongoose = require('mongoose');
var nodemailer = require('nodemailer');
mongoose.connect("mongodb://localhost:27017/userDB",{ useNewUrlParser: true , useUnifiedTopology: true });



const itemSchema =new mongoose.Schema({
  name:String,
  price:Number,
  seller:String,
  img1:String,
  img2:String,
  desc:String
});

const item=mongoose.model("Item",itemSchema);

const userSchema =new mongoose.Schema({
  name:String,
  password:String,
  mailid:String,
  buyingList:[itemSchema],
  sellingList:[itemSchema],
});

const User=mongoose.model("User",userSchema);



var Publishable_Key = 'pk_test_51HapIhC1UYeaMqlCoHt8BQMXzMaIHE60RaRU1uQrk5VqmfYjrh1HoMRUIvXNBZCDSbfUvMvE5eji0u60nm6yFPDT00hNB3W9n9'
var Secret_Key = 'sk_test_51HapIhC1UYeaMqlCeoiGjh83x6HI2VF63x0mHAK3CPJXVulwrYWscjXgXHBe5ZXbzhDaGE0PBR9BE782vCzWBEXa00pV5epoUf'

const stripe = require('stripe')(Secret_Key)

const port = process.env.PORT || 3000

app.use(bodyparser.urlencoded({extended:false}))

// View Engine Setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.get('/', function(req, res){
    res.sendFile(__dirname + "/login.html");
})


app.get('/login', function(req, res){
    res.sendFile(__dirname + "/login.html");
})


app.post('/login',function(req,res){
  const name=req.body.username;
  const pass=req.body.password;
  User.findOne({name:name},function(err , foundUser){
    if(err){
      console.log(err);
    }
    else{
      if(foundUser){
        if(foundUser.password === pass){
          user=foundUser;
          var name=user.name;
          console.log(name);
          res.redirect('/home/'+name);
        }
        else{
          res.redirect('/login');
        }
      }
      else{
        res.send("<h1> OOPS....! USER NOT FOUND </h1>");
      }
    }
  })
});
app.post('/register',function(req,res){
   user = new User({
    name:req.body.name,
    password:req.body.password,
    email:req.body.mailId
  });
  user.save(function(err){
    if(err){
      console.log(err);
    }
    else{
      var name=user.name;
      res.redirect('/home/'+name);
    }
  });
});

app.get('/sell/:id',function(req,res){
  res.sendFile(__dirname + "/sell.html");
});

app.post('/product/:seller',function(req,res){
  var seller=req.params.seller;
 items = new item({
  name:req.body.name,
  price:req.body.price,
  seller:seller,
  img1:req.body.img1,
  img2:req.body.img2,
  desc:req.body.desc
});
items.save(function(err){
  if(err){
    console.log(err);
  }
  else{
    User.findOne({name:seller},function(err,user){
      if(user){
        var name=user.name;
        user.sellingList.push(items);
        user.save();
        res.redirect('/home/{name}');
      }
    });
  }
});
});
app.get('/home/:id',function(req,res){

  item.find({},function(err,foundItems){
     if(err){
       console.log(err);
     }
     else{
       res.render("index",{items:foundItems,user:req.params.id});
     }
  })
});


app.post('/pay/:id', function(req, res){
  var name=req.body.name;
    var pname=req.body.pname;
var pprice=req.body.pprice;
var pseller=req.body.pseller;
var find=req.body.find;
    res.render('Home', {
    key: Publishable_Key,
    pprice: pprice,
    pname:pname,
    pseller:pseller,
    name:name,
    find:find
    })
})


app.post('/locale/:name',function(req,res){
  var email = req.body.stripeEmail;
  var token= req.body.stripeToken;
  var price=req.body.price;
  var desc=req.body.desc;
  var count=req.body.find;
    var name=req.body.name;
  res.render("ind",{email:email,source:token,price:price,desc:desc,find:count,name:name})
});

app.post('/payment/:id', function(req, res){
console.log(req.body);
stripe.customers.create({
    email: req.body.email,
    source: req.body.source,
    address: {
        line1: req.body.city,
        postal_code: req.body.postal,
        city: req.body.city,
        state: req.body.state,
        country: req.body.country,
    }
})
.then((customer) => {

    return stripe.charges.create({
        amount: req.body.price,    // Charing Rs 25
        description: req.body.desc,
        currency: 'INR',
        customer: customer.id
    });
})
.then((charge) => {
item.find({},function(err,foundItems){
   if(err){
     console.log(err);
   }
   else{
     pro=foundItems[req.body.find];
     User.findOne({name:req.body.name},function(err,user){
       if(user){
         user.buyingList.push(pro);
         user.save( function(err,data){
           if(err){
             console.log(err);
           }
           else{
             console.log("success");
           }
         })
       }
     });
   }
})
  var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'testsujan2001@gmail.com',
    pass: 'testsujan'
  }
});

var mailOptions = {
  from: 'testsujan2001@gmail.com',
  to: req.body.email,
  subject: 'Confirmation for buying the product',
  text: `Your order is successfully placed. It will reach you in 2-3 business days \n The order is delivered to \n`+req.body.city+",\n"+req.body.state+",\n"+req.body.country+",\n"+req.body.continent+"-"+req.body.postal
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log("mail sent");
    alert("You will get the confirmation mail soon..! Thanks for your shopping");
  }
});
res.redirect('/home/'+req.params.id);
})
.catch((err) => {
  //console.log("2");
    res.send(err)    // If some error occurs
});

})

app.get('/history/:id', function(req, res){
  var name=req.params.id;
  res.render("history",{name:name});
})

app.get('/slist/:id',function(req,res){
  var name=req.params.id;
  User.findOne({name:name},function(err,user){
    if(user){
      res.render("list",{user:user});
    }
  });
});
app.get('/blist/:id',function(req,res){
  var name=req.params.id;
  User.findOne({name:name},function(err,user){
    if(user){
      res.render("blist",{user:user});
    }
  });
});

app.get('/admin',function(req,res){
  res.sendFile(__dirname + "/admin.html")
});


app.get('/ul',function(req,res){
  User.find({},function(err,foundItems){
     if(err){
     }
     else{
       console.log("ok");
       res.render("ul",{user:foundItems});
     }
  })
});


app.get('/pl',function(req,res){
  item.find({},function(err,foundItems){
     if(err){
       console.log(err);
     }
     else{
       console.log(foundItems);
       res.render("pl",{user:foundItems});
     }
  })
});



app.listen(port, function(error){
    if(error) throw error
    console.log("Server created Successfully")
})
