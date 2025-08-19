//This module is for the payout of the smart meter
const https= require('https');
const asyncWrapper = require('./async');

const estateSubAccount = {
    //100: process.env.SteveCWGSubAccount,    // test
    100: process.env.SteveCWGSubAccount, // test case, 
    101: process.env.SteveCWGSubAccount,
    //102: process.env.ViewPointSubAccount,
    
}

const estateServiceAccount = {
  //100: process.env.SteveCWGSubAccount,    // test
  100: process.env.SteveCWGSubAccount, // test case, 
  101: process.env.YellowGateSubAccount,
  //102: process.env.ViewPointSubAccount,
  
}

// this serves as the PayStack account of the estate
const estatePayStackAccount = {
  // examples
  100: process.env.SteveAccountKey,
  //101: process.env.GeraldAccountKey,
  // 102: process.env.CarlAccountKey,
}

// this serves as the company's subaccount when the estate provides their subaccount
const estateCWGSubAccount = {
  // examples
  100: process.env.SteveCWGSubAccount,
  //101: process.env.GeraldCWGSubAccount,
  // 102: process.env.CarlCWGSubAccount
}

//funtion to know if amount is greater than 2500
function payFeeCheck(amount) {
  //define the cap fee 2000, the max amout for waiver 2500, the amount to be bought
  const capfee = 2000
  const payFee = 2500
  const theRate = 0.015
  const kobo = 100
  const checkCharge = amount * 0.015
  let theAmount
  let paymentAmount

  if (amount >= payFee && checkCharge >= capfee) {    //if greater than or equal to capfee 2000
    theAmount = amount + capfee;
    paymentAmount = theAmount * kobo
  } else if(amount >= payFee && checkCharge < capfee) {    //if less than capfee 2000
    theAmount = ((amount + kobo) / (1 - theRate)) + 0.03
    paymentAmount = theAmount * kobo
  } else if(amount < payFee){
    //then there is a flat fee wavier
    theAmount = (amount / (1 - theRate)) + 0.03
    paymentAmount = theAmount * kobo
  } else{
    console.log("Calculation error");
  }
  
  //then return the payment amount
  return paymentAmount
}

const thePayment = asyncWrapper(
    async (req, res) => {
        //get the required data from the query
        var estateID = req.body.estateID
        //var meterID = req.body.meterID;
        var amount = req.body.amount;
        var reference = req.body.reference;
        var email = req.body.email;
        // expect a field called hasPayAcct
        var hasPayAcct = req.body.hasPayAcct;
        var platform = req.body.platform;
        var role = req.body.role;

        if (!hasPayAcct) {
          return res.status(401).json({ message: "Provide the necessary field"})
        }

        // the real amount, subaccount, paystack account to be passed
        let realAmount
        let realSubAccount
        let SecretKey

        console.log(hasPayAcct);
        
        // if the estate has a paystack account
        if (hasPayAcct === "true") {
          // estate account and company subaccount
          SecretKey = estatePayStackAccount[estateID]
          realSubAccount = estateCWGSubAccount[estateID]

          console.log("Estate has paystack account, CWG is subaccount ");
          
        } else{
          // company account and estate subaccount
          //SecretKey = process.env.TheSecretKey
          SecretKey = process.env.SteveAccountKey
          realSubAccount = estateSubAccount[estateID]
          console.log('CWG has paystact account, estate is subaccount ');
          
        }
        
        //just an extra layer of security
        if (amount <= 300000){
          realAmount = payFeeCheck(amount)
        } else{
          console.log("Amount Not Applicable");
          res.status(400).json({ message: 'Amount Not Applicable' });
        }
        
        //this only returns an error if the one above returns an error
        if (!realSubAccount) {    
            console.error('Invalid subaccount of:', estateID);
            res.status(400).json({ error: 'Invalid subaccount' });
            return;
        }

        console.log( amount, realAmount);

        // const params = JSON.stringify({
        //     "amount": [parseInt(realAmount)],
        //     "email": email,
        //     "reference": reference,
        //     "subaccount" : realSubAccount,
        //     'bearer' : 'subaccount'
        //   })

        // Build the base payload
        const payload = {
          amount: parseInt(realAmount),
          email: email,
          reference: reference,
          subaccount: realSubAccount,
          bearer: 'subaccount'
        };

          let callback_url = '';
          if (platform === 'web') {
            // For web
            if (role === 'admin') {
              callback_url = process.env.WEB_USER_CALLBACK_URL;
            } else {
              callback_url = process.env.WEB_USER_CALLBACK_URL; 
            }
          } else {
            // For app, i might not want a redirect
            callback_url = ''; 
          }
        
          // If a callback_url is defined, add it to the payload
          if (callback_url) {
            payload.callback_url = callback_url;
          }

          const params = JSON.stringify(payload);
          

          //stringify the meterID parameter into the body
        //   const metadata = JSON.stringify({
        //     "meterID": meterID
        //   })
          
          const options = {
            hostname: 'api.paystack.co',
            port: 443,
            path: '/transaction/initialize',
            method: 'POST',
            headers: {
              Authorization: 'Bearer '+ SecretKey,
              'Content-Type': 'application/json'
            },
            body: {
                'subaccount' : realSubAccount,
                'bearer' : 'subaccount' 
                //metadata is under customer array
                //'metadata' : metadata,
            }
          }
          
          const reqR = https.request(options, resS => {
            let data = ''
          
            resS.on('data', (chunk) => {
              data += chunk
            });
          
            resS.on('end', () => {
              res.send(data)
              console.log(JSON.parse(data))
              
            })
          }).on('error', error => {
            res.status(400).json({ message: error.message });
            console.log(error)
          })
          reqR.write(params)
          reqR.end()
    },
)
        //verify to reify the transaction after payment
const verifyTrans = asyncWrapper(
    async (req, res) => {
        var refID = req.body.reference;
        var estateID  = req.body.estateID
        var hasPayAcct = req.body.hasPayAcct;
        let SecretKey

        // validate hasPayAcct 
        if (!hasPayAcct) {
          return res.status(401).json({ message: "Provide the necessary field"})
        }
        // if the estate has a paystack account
        if (hasPayAcct === "true") {
          // then initiate the payment in a that the secret key called is the estate's own
          SecretKey = estatePayStackAccount[estateID]
        } else{
          // SecretKey = process.env.TheSecretKey
          SecretKey = process.env.SteveAccountKey
        }

        console.log( refID);
        
        
        const params = JSON.stringify({
            "reference": refID
          })

        const options = {
        hostname: 'api.paystack.co',
        port: 443,
        path: '/transaction/verify/'+refID,
        method: 'GET',
        headers: {
            Authorization: 'Bearer ' + SecretKey
        }
        }
        const reqR = https.request(options, resS => {
        let data = ''

        resS.on('data', (chunk) => {
            data += chunk
        });

        resS.on('end', () => {
            res.send(data)
            console.log(JSON.parse(data))
        })
        }).on('error', error => {
        console.log(error)
        })
        reqR.end()
    },
)


// service fee payment
const theServicePayment = asyncWrapper(
  async (req, res) => {
      //get the required data from the query
      var estateID = req.body.estateID
      //var meterID = req.body.meterID;
      var amount = req.body.amount;
      var reference = req.body.reference;
      var email = req.body.email;
      // expect a field called hasPayAcct
      var hasPayAcct = req.body.hasPayAcct;
      var platform = req.body.platform;
      var role = req.body.role;
      
      if (!hasPayAcct) {
        return res.status(401).json({ message: "Provide the necessary field"})
      }

      // the real amount, subaccount, paystack account to be passed
      let realAmount
      let realSubAccount
      let SecretKey

      console.log(hasPayAcct);
      
      // company account and estate subaccount
      // SecretKey = process.env.TheSecretKey
      SecretKey = process.env.SteveAccountKey
      realSubAccount = estateServiceAccount[estateID]
      console.log('CWG has paystact account, estate is subaccount ');

      
      //just an extra layer of security
      realAmount = payFeeCheck(amount)
      // if (amount <= 100000){
      //   realAmount = payFeeCheck(amount)
      // } else{
      //   console.log("Amount Not Applicable");
      //   res.status(400).json({ message: 'Amount Not Applicable' });
      // }
      
      //this only returns an error if the one above returns an error
      if (!realSubAccount) {    
          console.error('Invalid subaccount of:', estateID);
          res.status(400).json({ error: 'Invalid subaccount' });
          return;
      }

      console.log( amount, realAmount);

      // Build the base payload
        const payload = {
          amount: parseInt(realAmount),
          email: email,
          reference: reference,
          subaccount: realSubAccount,
          bearer: 'subaccount'
        };

          let callback_url = '';
          if (platform === 'web') {
            // For web, provide callback URL
            if (role === 'admin') {
              callback_url = process.env.WEB_ADMIN_CALLBACK_URL;
            } else {
              callback_url = process.env.WEB_USER_CALLBACK_URL; 
            }
          } else {
            // For app, you might not want a redirect
            callback_url = ''; 
          }
        
          // If a callback_url is defined, add it to the payload
          if (callback_url) {
            payload.callback_url = callback_url;
          }

          const params = JSON.stringify(payload);
        
        const options = {
          hostname: 'api.paystack.co',
          port: 443,
          path: '/transaction/initialize',
          method: 'POST',
          headers: {
            Authorization: 'Bearer '+ SecretKey,
            'Content-Type': 'application/json'
          },
          body: {
              'subaccount' : realSubAccount,
              'bearer' : 'subaccount' 
              //metadata is under customer array
              //'metadata' : metadata,
          }
        }
        
        const reqR = https.request(options, resS => {
          let data = ''
        
          resS.on('data', (chunk) => {
            data += chunk
          });
        
          resS.on('end', () => {
            res.send(data)
            console.log(JSON.parse(data))
            
          })
        }).on('error', error => {
          res.status(400).json({ message: error.message });
          console.log(error)
        })
        reqR.write(params)
        reqR.end()
  },
)

const verifyServicePayment = asyncWrapper(
  async (req, res) => {
      var refID = req.body.reference;
      var estateID  = req.body.estateID
      var hasPayAcct = req.body.hasPayAcct;
      let SecretKey

      // validate hasPayAcct 
      if (!hasPayAcct) {
        return res.status(401).json({ message: "Provide the necessary field"})
      }
      
      //SecretKey = process.env.TheSecretKey
      SecretKey = process.env.SteveAccountKey

      console.log( refID);
      
      
      const params = JSON.stringify({
          "reference": refID
        })

      const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: '/transaction/verify/'+refID,
      method: 'GET',
      headers: {
          Authorization: 'Bearer ' + SecretKey
      }
      }
      const reqR = https.request(options, resS => {
      let data = ''

      resS.on('data', (chunk) => {
          data += chunk
      });
      resS.on('end', () => {
          res.send(data)
          console.log(JSON.parse(data))
      })
      }).on('error', error => {
      console.log(error)
      })
      reqR.end()
  },
)

module.exports = {
    thePayment, 
    verifyTrans,
    theServicePayment,
    verifyServicePayment
}