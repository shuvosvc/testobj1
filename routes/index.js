const express = require('express');
const passportService = require('../config/passport');
const authRouter = require('./auth');
const teamRouter = require('./team');
const projectRouter = require('./project');
const cardRouter = require('./card');
const billingRouter = require('./billing');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ success: true, title: 'REST API Interface' });
});

router.use('/auth', authRouter);
router.use('/billing', billingRouter);
router.use('/team', teamRouter);
router.use('/project', projectRouter);
router.use('/card', cardRouter);

module.exports = router;
