const express = require('express')
const app = express();
require('dotenv').config();
const routes = require('./routes/payout')

app.use(express.json())
app.use(express.urlencoded({extended: false})) 
app.use('/', routes);

// function payFeeCheck(amount) {
//     //define the cap fee 2000, the max amout for waiver 2500, the amount to be bought
//     const capfee = 2000
//     const payFee = 2500
//     const theRate = 0.015
//     const kobo = 100
//     const checkCharge = amount * 0.015
//     let theAmount
//     let paymentAmount
  
//     if (amount >= payFee && checkCharge >= capfee) {    //if greater than or equal to capfee 2000
//       theAmount = amount + capfee;
//       paymentAmount = theAmount * kobo
//     } else if(amount >= payFee && checkCharge < capfee) {    //if less than capfee 2000
//       theAmount = ((amount + kobo) / (1 - theRate)) + 0.03
//       paymentAmount = theAmount * kobo
//     } else if(amount < payFee){
//       //then there is a flat fee wavier
//       theAmount = (amount / (1 - theRate)) + 0.03
//       paymentAmount = theAmount * kobo
//     } else{
//       console.log("Calculation error");
//     }
    
//     //then return the payment amount
//     return paymentAmount
//   }

//   console.log(payFeeCheck(100));

//server
const port = process.env.PORT || 3030
app.listen(port, ()=> {
    console.log(`Server listening on port ${port}`);
});