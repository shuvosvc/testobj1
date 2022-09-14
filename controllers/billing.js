const jwt = require('jsonwebtoken');

const User = require('../models/user');

const config = require('../config/keys');

const createToken = require('../helpers/generateToken');

const unix = require('../util/unix');

const Secret_Key = process.env.STRIPE_SEC_KEY;
const stripe = require('stripe')(Secret_Key);

exports.me = async function (req, res) {
  try {
    const token = createToken.generateToken(req.user);

    res.status(200).json({
      token,
    });
  } catch (err) {
    res.status(500).json({
      message: 'token err',
    });
  }
};

exports.plans = async function (req, res) {
  try {
    const plans = await stripe.plans.list();
    res.status(200).json({
      plans,
    });
  } catch (err) {
    res.status(500).json({
      message: 'internal server error!',
    });
  }
};

exports.billing = async function (req, res) {
  try {
    const {
      sourceToken,
      cardName,
      country,
      state,
      city,
      address,
      extraAddress,
    } = req.body;
    const isExist = await User.find({ email: req.user.email });
    if (isExist.length === 0) {
      return res.status(404).json({
        message: 'User does not exist!',
      });
    }

    const customer = await stripe.customers.create({
      email: req.user.email,
    });

    const source = await stripe.customers.createSource(customer.id, {
      source: sourceToken,
    });

    await stripe.customers.updateSource(customer.id, source.id, {
      name: cardName,
      address_country: country,
    });

    const plan = await stripe.plans.retrieve(process.env.PROFESSIONAL_PLAN_ID);

    const trial_end = unix(plan.trial_period_days);
    const billing_cycle_anchor = unix(plan.trial_period_days + 1);

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: process.env.PROFESSIONAL_PLAN_ID }],
      trial_end: trial_end,
      billing_cycle_anchor: billing_cycle_anchor,
    });

    const billing = { cardName, country, state, city, address, extraAddress };

    const user = await User.findOneAndUpdate(
      { email: req.user.email },
      {
        $set: {
          role: 'member',
          membership: true,
          customerId: customer.id,
          sourceId: source.id,
          billing,
          subscriptionId: subscription.id,

          trialSeason: 0,
        },
      },
      { new: true, useFindAndModify: false }
    );

    const token = createToken.generateToken(user);

    res.status(200).json({
      message: 'Membership status  was updated successfully',
      token,
    });
  } catch (err) {
    res.status(500).send({ message: 'Internal server error!' });
  }
};

exports.updateBilling = async function (req, res) {
  try {
    // const { cardName, country, state, city, address, extraAddress } = req.body;
    const user = await User.find({ email: req.user.email });
    if (user.length === 0) {
      res.status(401).json({
        message: 'User does not not exist!',
      });
    } else {
      const cardName = req.body.cardName
        ? req.body.cardName
        : user[0].billing.cardName;

      const country = req.body.country
        ? req.body.country
        : user[0].billing.country;

      const state = req.body.state ? req.body.state : user[0].billing.state;

      const city = req.body.city ? req.body.city : user[0].billing.city;

      const address = req.body.address
        ? req.body.address
        : user[0].billing.address;

      const extraAddress = req.body.extraAddress
        ? req.body.extraAddress
        : user[0].billing.extraAddress;

      const updated = await User.findOneAndUpdate(
        { email: req.user.email },
        {
          $set: {
            billing: { cardName, country, state, city, address, extraAddress },
          },
        },
        { new: true, useFindAndModify: false }
      );
      const token = createToken.generateToken(updated);
      res.status(200).json({
        message: ' Billing info was updated successfully',
        token,
      });
    }
  } catch (err) {
    res.status(500).send({ message: 'Internal server error!!' });
  }
};

exports.addCard = async function (req, res) {
  try {
    const user = await User.find({ email: req.user.email });
    if (user.length === 0) {
      return res.status(404).json({
        message: 'User does not exits',
      });
    }

    const source = await stripe.customers.createSource(user[0].customerId, {
      source: req.body.defaultSource,
    });

    await stripe.customers.updateSource(user[0].customerId, source.id, {
      name: req.body.cardName,
      address_country: req.body.country,
    });

    const customer = await stripe.customers.update(user[0].customerId, {
      default_source: source.id,
    });

    await User.findOneAndUpdate(
      { email: req.user.email },
      {
        $set: {
          sourceId: customer.default_source,
        },
      },
      { new: true, useFindAndModify: false }
    );

    return res.status(200).json({
      message: 'Default card Updated',
    });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error!',
    });
  }
};
exports.deleteCard = async function (req, res) {
  try {
    const user = await User.find({ email: req.user.email });
    if (user.length === 0) {
      return res.status(404).json({
        message: 'User does not exits!',
      });
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: user[0].customerId,
      type: 'card',
    });

    if (!paymentMethods.data?.some((card) => card.id === req.params.cardId)) {
      return res.status(404).json({
        message: 'This card does not belong to this user!',
      });
    }

    if (req.params.cardId === user[0].sourceId.toString()) {
      return res.status(403).json({
        message: 'Default source can not be delete!',
      });
    }

    await stripe.customers.deleteSource(user[0].customerId, req.params.cardId);

    return res.status(200).json({
      message: 'Card deleted successfully',
    });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error!',
    });
  }
};

exports.updateDefaultSource = async function (req, res) {
  try {
    const user = await User.find({ email: req.user.email });
    if (user.length === 0) {
      return res.status(404).json({
        message: 'User does not exits',
      });
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: user[0].customerId,
      type: 'card',
    });

    if (!paymentMethods.data?.some((card) => card.id === req.body.cardId)) {
      return res.status(404).json({
        message: 'This card does not belong to this user!',
      });
    }

    const customer = await stripe.customers.update(user[0].customerId, {
      default_source: req.body.cardId,
    });

    await User.findOneAndUpdate(
      { email: req.user.email },
      {
        $set: {
          sourceId: customer.default_source,
        },
      },
      { new: true, useFindAndModify: false }
    );

    return res.status(200).json({
      message: 'Default card Updated',
    });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error!',
    });
  }
};
exports.userInvoices = async function (req, res) {
  try {
    const user = await User.find({ email: req.user.email });
    if (user.length === 0) {
      return res.status(404).json({
        message: 'User does not exits',
      });
    }
    const invoices = await stripe.invoices.list({
      customer: user[0].customerId,
    });
    if (invoices.data.length === 0) {
      return res.status(404).json({
        message: 'User does not have any invoice!',
      });
    }

    return res.status(200).json({
      message: 'Invoices retrived successfully ',

      invoices,
    });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error!',
    });
  }
};

exports.cards = async function (req, res) {
  try {
    const user = await User.find({ email: req.user.email });
    if (user.length === 0) {
      res.status(404).json({
        message: 'User does not not exist!',
      });
    } else {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: user[0].customerId,
        type: 'card',
      });

      let cardList = [];

      paymentMethods.data.map((card) => {
        let temp = [];
        if (card.id === user[0].sourceId) {
          temp[0] = true;
        } else {
          temp[0] = false;
        }
        cardList.push({
          id: card.id,
          brand: card.card.brand,
          expMonth: card.card.exp_month,
          expYear: card.card.exp_year,
          lastDigits: card.card.last4,
          default: temp[0],
        });
      });

      res.status(200).json({
        data: cardList,
      });
    }
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error!',
    });
  }
};
exports.card = async function (req, res) {
  try {
    const user = await User.find({ email: req.user.email });
    if (user.length === 0) {
      return res.status(404).json({
        message: 'User does not not exist!',
      });
    }

    const card = await stripe.customers.retrieveSource(
      user[0].customerId,
      req.params.id
    );

    if (card.id === user[0].sourceId) {
      card.default = true;
    } else {
      card.default = false;
    }

    res.status(200).json({
      card: card,
    });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error!',
    });
  }
};
