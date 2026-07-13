const express = require('express');
const router = express.Router();
const { subscribe, getSubscribers } = require('../controllers/subscriberController');

router.post('/', subscribe);
router.get('/', getSubscribers); // ⚠️ see note below — lock this down before going live with it

module.exports = router;