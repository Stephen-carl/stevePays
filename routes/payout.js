const express = require('express');
const router = express.Router();
const {
    thePayment, 
    verifyTrans
} = require('../modules/smart-meter')

//paystack routes
router.post('/generateCheckoutSession', thePayment)
router.post('/verifyTransCallback', verifyTrans)


module.exports = router;