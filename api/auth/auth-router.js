const bcrypt = require('bcryptjs');
const router = require('express').Router();
const Users = require('../users/users-model');
const {
  checkUsernameFree,
  checkCredentials,
} = require('../auth/auth-middleware');
const tokenBuilder = require('../auth/token-builder');

router.get('/', (req, res, next) => {
  res.json({ message: 'server up', status: 200 });
});

router.get('/waterUsers', (req, res, next) => {
  Users.getUsers().then((users) => {
    const activeUsers = users.map((user) => {
      return user.username;
    });
    res.json({
      message: `Here are all of the registered users: ${activeUsers}`,
      status: 200,
    });
  });
});

router.post(
  '/register',
  checkCredentials,
  checkUsernameFree,
  (req, res, next) => {
    const { username, password, phoneNumber } = req.body;
    const passwordHash = bcrypt.hashSync(password, 7);
    Users.add({ username, password: passwordHash, phoneNumber })
      .then((user) =>
        res.json({ status: 201, message: `Success! User:${username} created!` })
      )
      .catch(next);
  }
);

router.post('/login', (req, res, next) => {
  let { username, password } = req.body;
  Users.findBy({ username })
    .then(([user]) => {
      if (user && bcrypt.compareSync(password, user.password)) {
        const token = tokenBuilder(user);
        res.status(200).json({
          message: `Welcome ${user.username}! Let's start watering plants!`,
          token,
        });
      } else {
        next({ status: 401, message: 'invalid credentials' });
      }
    })
    .catch(next);
});

// To delete a user
router.delete('/delete/:id', (req, res, next) => {
  const id = req.params.id;
  Users.deleteUser(id)
    .then((deletedUser) => {
      if (!deletedUser.length) {
        return res.json({
          status: 400,
          message: 'User could not be deleted. Check user ID',
        });
      }
      res.json({
        message: `User: ${deletedUser} successfully deleted`,
        status: 200,
      });
    })
    .catch(next);
});

module.exports = router;
