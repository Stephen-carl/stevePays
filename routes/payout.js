const express = require('express');
const router = express.Router();
const {
    thePayment, 
    verifyTrans,
    theServicePayment,
    verifyServicePayment
} = require('../modules/smart-meter')

//paystack routes
router.post('/generateCheckoutSession', thePayment)
router.post('/verifyTransCallback', verifyTrans)

// for services
router.post('/generateServiceCheckout', theServicePayment)
router.post('/verifyServicePayment', verifyServicePayment)


module.exports = router;