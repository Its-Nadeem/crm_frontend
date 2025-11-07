import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      permissions: user.permissions,
      organizationId: user.organizationId,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
};

// @desc    Get all users for an organization
// @route   GET /api/users
// @access  Protected
const getUsers = async (req, res) => {
  try {
    const users = await User.find({ organizationId: req.user.organizationId }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export { authUser, getUsers };



