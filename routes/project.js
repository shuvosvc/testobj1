const express = require('express');
const projectControllers = require('../controllers/project');

const passport = require('passport');

const router = express.Router();

const validateMiddleware = require('../middlewares/validate');

const validateCreateProject = require('../validations/project/create');
const validateUpdateProject = require('../validations/project/update');

const authMiddlewares = require('../middlewares/auth');
const requireAuth = authMiddlewares.requireAuth;

router.get(
  '/allprojects/:teamUrl/:search?',
  requireAuth,
  projectControllers.getProjects
);
router.get(
  '/:siteName/:url/:projectSlug',

  projectControllers.getProject
);
router.post(
  '/create',
  requireAuth,
  validateMiddleware(validateCreateProject),
  projectControllers.createProject
);
router.put(
  '/:projectSlug',
  requireAuth,
  validateMiddleware(validateUpdateProject),
  projectControllers.updateProject
);
router.delete(
  '/:projectSlug',
  requireAuth,

  projectControllers.deleteProject
);

module.exports = router;
