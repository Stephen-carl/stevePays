//This module is for the payout of the smart meter
const https= require('https');
const asyncWrapper = require('./async');

const estateSecretKeys = {
    101: process.env.SecretKey101,
    102: process.env.SecretKey102,
    103: process.env.SecretKey103,
    104: process.env.SecretKey104,
    105: process.env.SecretKey105,
    106: process.env.SecretKey106
    // Add more estates as needed
    };
const estateSubAccount = {
    101: process.env.SubAccount101,
    102: process.env.SubAccount102,
    103: process.env.SubAccount103,
    104: process.env.SubAccount104,
    105: process.env.SubAccount105,
    106: process.env.SubAccount106,
    1011: process.env.SubAccount1011,
    1022: process.env.SubAccount1022,
    1033: process.env.SubAccount1033,
    1044: process.env.SubAccount1044,
    1055: process.env.SubAccount1055,
    1066: process.env.SubAccount1066
}

const thePayment = asyncWrapper(
    async (req, res) => {
        //get the required data from the query
        var estateID = req.body.estateID
        var amount = req.body.amount;
        var reference = req.body.reference;
        var email = req.body.email;
        //var meterID = req.body.meterID;
        //the real amount and subaccount to be passed
        let realAmount
        let realSubAccount
        let feeCap = 2000
        
    
        //get the secret key of the entered estateiD
        const SecretKey = estateSecretKeys[estateID];
        if (!SecretKey) {
          console.error('Invalid estate name:', estateID);
          res.status(400).json({ error: 'Invalid estate name' });
          //else continue the process
          return;
      }

        //at this point i have to check for the estateID and proper mount
        if (estateID == 101) {      //valleyStream does not have a constraint as at the time of development. it is 1%
          //var cwgChargees = amount / (1 - 0.01) + 0.01
          var paystackAmountss = amount / (1 - 0.015) + 0.01;
          realAmount = paystackAmountss * 100
          realSubAccount = estateSubAccount[estateID]
        } else if (estateID == 102) {       //faith legacy (look in db to sure of the estateID)
          //then check for the amount and what to charge
          if (amount <= 20000){
            //then add the charges and the appropriate subaccount
            var cwgCharge = amount / (1 - 0.03) + 0.01
            //cap fee may not apply here
            var paystackAmount = cwgCharge / (1 - 0.015) + 0.01;
            //pass the money to kobo and submit
            realAmount = paystackAmount * 100
            //pass in the subacccout
            realSubAccount = estateSubAccount[estateID]   //subaccount 102
          }else {
            //greater than 20000 pays 1.5%
            //here cap fee may apply. i have to check for it
            var cwggCharge = amount * 0.015    //out charge
            if (cwggCharge > feeCap) {
              //set our price and paystacks
              cwggCharge = amount / (1 - 0.015) + 0.01
              var paystackAmount = cwggCharge + 2000;
              realAmount = paystackAmount * 100   //to kobo
              realSubAccount = estateSubAccount[1022]
            }else{
              //it means it didn't pass the feeCap
              cwggCharge = amount / (1 - 0.015) + 0.01
              var paystackAmount = cwgCharge / (1 - 0.015) + 0.01
              realAmount = paystackAmount * 100
              realSubAccount = estateSubAccount[1022]
            }
          }
        } else if (estateID == 103) {     //Viewpoint
          if (amount <= 20000){
            //then add the charges and the appropriate subaccount
            var cwgCharge = amount / (1 - 0.04) + 0.01
            //cap fee may not apply here
            var paystackAmount = cwgCharge / (1 - 0.015) + 0.01;
            //pass the money to kobo and submit
            realAmount = paystackAmount * 100
            //pass in the subacccout
            realSubAccount = estateSubAccount[estateID]   //subaccount 102
          }else {
            //greater than 20000 pays 2%
            //here cap fee may apply. i have to check for it
            var cwggCharge = amount * 0.02    //out charge
            if (cwggCharge > feeCap) {
              //set our price and paystacks
              cwggCharge = amount / (1 - 0.02) + 0.01
              var paystackAmount = cwggCharge + 2000;
              realAmount = paystackAmount * 100   //to kobo
              realSubAccount = estateSubAccount[1033]
            }else{
              //it means it didn't pass the feeCap
              cwggCharge = amount / (1 - 0.02) + 0.01
              var paystackAmount = cwgCharge / (1 - 0.015) + 0.01
              realAmount = paystackAmount * 100
              realSubAccount = estateSubAccount[1033]
            }
          }
        } else {
          //meaning in a case where it isnt among the ones with tariff
          //the subaccount will be set to zero on the paystack
          var paystackAmountt = amount / (1 - 0.015) + 0.01
          realAmount = paystackAmountt * 100
          realSubAccount = estateSubAccount[estateID]     //which will be set to zero on the paystack account
        }
        //else subaccount is equal this
        //const subaccount = estateSubAccount[estateID];

        
        if (!realSubAccount) {    
            console.error('Invalid subaccount of:', estateID);
            res.status(400).json({ error: 'Invalid subaccount' });
            return;
        }

        const params = JSON.stringify({
            "amount": [parseInt(realAmount)],
            "email": email,
            "reference": reference,
            "subaccount" : realSubAccount
          })

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
              Authorization: 'Bearer '+SecretKey,
              'Content-Type': 'application/json'
            },
            body: {
                'subaccount' : realSubAccount  
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
            console.error(error)
          })
          
          reqR.write(params)
          reqR.end()
    },
)
        //verify call back
const verifyTrans = asyncWrapper(
    async (req, res) => {
        var refID = req.body.reference;
        //pass in the estateId from the app so i can get the exact secretKey
        var estateID = req.body.estateID;
        //add the amount
        //var amount = req.body.amount;

        let theCharge 
        //get the secret key of the entered estateiD
        const SecretKey = estateSecretKeys[estateID];
        //and get the secret for the exact bearer
        if (!SecretKey) {
            console.error('Invalid estate name:', estateID);
            res.status(400).json({ error: 'Invalid estate name' });
            return;
        }


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
        console.error(error)
        })
        //reqR.write(refID)
        reqR.end()
    },
)

module.exports = {
    thePayment, 
    verifyTrans
}