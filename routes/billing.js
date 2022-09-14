const express = require('express');
const router = express.Router();

// const passport = require('passport');

const authControllers = require('../controllers/billing');

const validateMiddleware = require('../middlewares/validate');

const validateBilling = require('../validations/billing/billing');

const authMiddlewares = require('../middlewares/auth');
const requireAuth = authMiddlewares.requireAuth;

router.post(
  '/',

  requireAuth,
  validateMiddleware(validateBilling),
  authControllers.billing
);

router.get(
  '/plans',

  requireAuth,
  authControllers.plans
);

router.put(
  '/updateBilling',

  requireAuth,
  authControllers.updateBilling
);

router.put(
  '/updateDefaultSource',

  requireAuth,
  authControllers.updateDefaultSource
);
router.post(
  '/addCard',

  requireAuth,
  authControllers.addCard
);
router.delete(
  '/card/:cardId',

  requireAuth,
  authControllers.deleteCard
);

router.get(
  '/userInvoices',

  requireAuth,
  authControllers.userInvoices
);

router.get(
  '/cards',

  requireAuth,
  authControllers.cards
);
router.get(
  '/card/:id',

  requireAuth,
  authControllers.card
);

module.exports = router;
