import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// @desc    Auth user & get token
// @route   POST /api//auth/login
// @access  Public
const authUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
       res.json({
         success: true,
         data: {
           _id: user._id,
           id: user.id,
           name: user.name,
           email: user.email,
           avatar: user.avatar,
           role: user.role,
           permissions: user.permissions,
           organizationId: user.organizationId,
           token: generateToken(user._id),
         }
       });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong!'
    });
  }
};

// @desc    Get all users for an organization
// @route   GET /api/users
// @access  Protected
const getUsers = async (req, res) => {
  try {
    const users = await User.find({ organizationId: req.user.organizationId }).select('-password');
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

export { authUser, getUsers };



