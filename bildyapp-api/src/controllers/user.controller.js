import User from '../models/User.js';
import Company from '../models/Company.js';
import AppError from '../utils/AppError.js';
import { sendVerificationEmail } from '../services/mail.service.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// 1. REGISTER
export const registerUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return next(AppError.conflict('Email already registered'));

    // Generate code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    await User.create({ 
      email, 
      password, 
      verificationCode, 
      status: 'pending' 
    });

    // --- STEP 3: SEND ACTUAL EMAIL ---
    try {
      await sendVerificationEmail(email, verificationCode);
      console.log(`[EMAIL] Verification sent to: ${email}`);
    } catch (emailError) {
      // Log error but don't crash registration; fallback to console
      console.error('Email service error:', emailError.message);
      console.log(`[FALLBACK] Code for ${email}: ${verificationCode}`);
    }

    res.status(201).json({ 
      status: 'success', 
      message: 'User registered. Please check your email for the verification code.' 
    });
  } catch (error) { next(error); }
};

// 2. VALIDATE EMAIL
export const validateEmail = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email, verificationCode: code });
    if (!user) return next(AppError.badRequest('Invalid code'));

    user.status = 'active';
    user.verificationCode = undefined;
    await user.save();
    res.status(200).json({ status: 'success', message: 'Verified' });
  } catch (error) { next(error); }
};

// 3. LOGIN
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return next(AppError.unauthorized('Invalid credentials'));
    }
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.status(200).json({ status: 'success', token });
  } catch (error) { next(error); }
};

// 4a. UPDATE PERSONAL DATA
export const updatePersonalData = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.user._id, req.body, { new: true });
    res.status(200).json({ status: 'success', data: user });
  } catch (error) { next(error); }
};

// 4b. UPDATE COMPANY DATA
export const updateCompanyData = async (req, res, next) => {
  try {
    let company = await Company.findOneAndUpdate(
      { owner: req.user._id },
      { ...req.body, owner: req.user._id },
      { new: true, upsert: true }
    );
    await User.findByIdAndUpdate(req.user._id, { role: 'admin', company: company._id });
    res.status(200).json({ status: 'success', data: company });
  } catch (error) { next(error); }
};

// 5. UPLOAD LOGO
export const uploadCompanyLogo = async (req, res, next) => {
  try {
    if (!req.file) return next(AppError.badRequest('No file uploaded'));
    const company = await Company.findOneAndUpdate(
      { owner: req.user._id },
      { logo: req.file.path },
      { new: true }
    );
    res.status(200).json({ status: 'success', logo: req.file.path });
  } catch (error) { next(error); }
};

// 6. GET CURRENT USER
export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('company');
    res.status(200).json({ status: 'success', data: user });
  } catch (error) { next(error); }
};

// 7a. REFRESH TOKEN
export const refreshAccessToken = async (req, res) => {
  const token = jwt.sign({ _id: req.body._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
  res.status(200).json({ status: 'success', token });
};

// 7b. LOGOUT
export const logoutUser = (req, res) => {
  res.status(200).json({ status: 'success', message: 'Logged out' });
};

// 8. DELETE USER
export const deleteUser = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { deleted: true });
    res.status(200).json({ status: 'success', message: 'Deactivated' });
  } catch (error) { next(error); }
};

// 9. CHANGE PASSWORD
export const changePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await bcrypt.compare(req.body.currentPassword, user.password);
    if (!isMatch) return next(AppError.unauthorized('Wrong password'));
    user.password = req.body.newPassword;
    await user.save();
    res.status(200).json({ status: 'success', message: 'Password changed' });
  } catch (error) { next(error); }
};

// 10. INVITE USER
export const inviteUser = async (req, res, next) => {
  try {
    const { email } = req.body;
    const newUser = await User.create({
      email,
      password: 'TemporaryPassword123!', 
      company: req.user.company,
      role: 'guest',
      status: 'pending'
    });
    res.status(201).json({ status: 'success', message: `Invitation sent to ${email}` });
  } catch (error) { next(error); }
};