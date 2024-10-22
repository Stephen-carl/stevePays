//This module is for the payout of the smart meter
const https= require('https');
const asyncWrapper = require('./async');

const estateSubAccount = {
    100: process.env.ValleyStreamSubAccount,
    101: process.env.FaithLegacySubAccount,
    102: process.env.ViewPointSubAccount,
    103: process.env.SubAccount104,
    104: process.env.SubAccount105,
    105: process.env.SubAccount106,
    106: process.env.FitFacilitySubAccount
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
        var amount = req.body.amount;
        var reference = req.body.reference;
        var email = req.body.email;
        //var meterID = req.body.meterID;
        //the real amount and subaccount to be passed
        let realAmount
        let realSubAccount
        const SecretKey = process.env.TheSecretKey

        //just an extra layer of security
        if (amount <= 100000){
          realAmount = payFeeCheck(amount)
          realSubAccount = estateSubAccount[estateID]
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
              Authorization: 'Bearer '+ SecretKey,
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
            res.status(400).json({ message: error.message });
            console.error(error)
          })
          reqR.write(params)
          reqR.end()
    },
)
        //verify to reify the transaction after payment
const verifyTrans = asyncWrapper(
    async (req, res) => {
        var refID = req.body.reference;
        const SecretKey = process.env.TheSecretKey;
        
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
        reqR.end()
    },
)

module.exports = {
    thePayment, 
    verifyTrans
}