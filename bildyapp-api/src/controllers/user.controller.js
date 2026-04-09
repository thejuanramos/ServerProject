import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { Company } from '../models/Company.js';
import { AppError } from '../utils/AppError.js';
import notificationService from '../services/notification.service.js';

const generateAccessToken = (user) =>
  jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' },
  );

const generateRefreshToken = () =>
  crypto.randomBytes(40).toString('hex');

export const registerUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const existing = await User.findOne({ email, status: 'verified' });
    if (existing) {
      throw AppError.conflict('Email is already registered');
    }

    const verificationCode = crypto.randomInt(100000, 999999).toString();

    const user = await User.create({
      email,
      password,
      verificationCode,
      verificationAttempts: 3,
      role: 'admin',
      status: 'pending',
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save();

    notificationService.emit('userregistered', user);

    res.status(201).json({
      user: {
        email: user.email,
        status: user.status,
        role: user.role,
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

export const validateEmail = async (req, res, next) => {
  try {
    const { code } = req.body;
    const user = req.user;

    if (user.status === 'verified') {
      return res.json({ message: 'Email already verified' });
    }

    if (user.verificationAttempts <= 0) {
      throw AppError.tooMany('Too many verification attempts');
    }

    if (user.verificationCode !== code) {
      user.verificationAttempts -= 1;
      await user.save();
      throw AppError.badRequest('Invalid verification code');
    }

    user.status = 'active';
    user.verificationCode = undefined;
    user.verificationAttempts = 0;
    await user.save();

    notificationService.emit('userverified', user);

    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    next(err);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || user.deleted) {
      throw AppError.unauthorized('Invalid credentials');
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      throw AppError.unauthorized('Invalid credentials');
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      user: {
        email: user.email,
        status: user.status,
        role: user.role,
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

export const updatePersonalData = async (req, res, next) => {
  try {
    const user = req.user;
    const { name, lastName, nif, address } = req.body;

    user.name = name;
    user.lastName = lastName;
    user.nif = nif;
    if (address) {
      user.address = address;
    }

    await user.save();

    res.json({
      message: 'Personal data updated',
      user: {
        email: user.email,
        name: user.name,
        lastName: user.lastName,
        nif: user.nif,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const updateCompanyData = async (req, res, next) => {
  try {
    const user = req.user;
    const { isFreelance, name, cif, address } = req.body;

    let company;

    if (isFreelance) {
      const freelanceCif = user.nif;
      company = await Company.findOne({ cif: freelanceCif });

      if (!company) {
        company = await Company.create({
          owner: user._id,
          name: user.name ? `${user.name} ${user.lastName}` : 'Freelance',
          cif: freelanceCif,
          address: user.address,
          isFreelance: true,
        });
      }

      user.role = 'admin';
      user.company = company._id;
    } else {
      company = await Company.findOne({ cif });

      if (!company) {
        company = await Company.create({
          owner: user._id,
          name,
          cif,
          address,
          isFreelance: false,
        });
        user.role = 'admin';
      } else {
        user.role = 'guest';
      }

      user.company = company._id;
    }

    await user.save();

    res.json({
      message: 'Company data updated',
      user: {
        email: user.email,
        role: user.role,
        company: user.company,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const uploadCompanyLogo = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user.company) {
      throw AppError.badRequest('User does not have a company');
    }

    if (!req.file) {
      throw AppError.badRequest('Logo image is required');
    }

    const company = await Company.findById(user.company);
    if (!company || company.deleted) {
      throw AppError.notFound('Company not found');
    }

    const publicUrl = `${process.env.PUBLIC_URL}/uploads/${req.file.filename}`;
    company.logo = publicUrl;
    await company.save();

    res.json({
      message: 'Company logo updated',
      logo: publicUrl,
    });
  } catch (err) {
    next(err);
  }
};

export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('company');

    if (!user || user.deleted) {
      throw AppError.notFound('User not found');
    }

    res.json({ user });
  } catch (err) {
    next(err);
  }
};

export const refreshAccessToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const user = await User.findOne({ refreshToken });

    if (!user || user.deleted) {
      throw AppError.unauthorized('Invalid refresh token');
    }

    const accessToken = generateAccessToken(user);
    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
};

export const logoutUser = async (req, res, next) => {
  try {
    const user = req.user;
    user.refreshToken = undefined;
    await user.save();
    res.json({ message: 'Session closed' });
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const user = req.user;
    const soft = req.query.soft === 'true';

    if (soft) {
      user.deleted = true;
      await user.save();
    } else {
      await User.findByIdAndDelete(user.id);
    }

    notificationService.emit('userdeleted', user);
    res.json({ message: soft ? 'User soft-deleted' : 'User deleted' });
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const user = req.user;
    const { currentPassword, newPassword } = req.body;

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) {
      throw AppError.unauthorized('Current password is incorrect');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password updated' });
  } catch (err) {
    next(err);
  }
};

export const inviteUser = async (req, res, next) => {
  try {
    const inviter = req.user;

    if (!inviter.company) {
      throw AppError.badRequest('Inviter does not have a company');
    }

    const { email, name, lastName, nif } = req.body;

    const existing = await User.findOne({ email, status: 'verified' });
    if (existing) {
      throw AppError.conflict('Email is already registered');
    }

    const randomPassword = crypto.randomBytes(8).toString('hex');
    const passwordHash = await bcrypt.hash(randomPassword, 10);

    const invitedUser = await User.create({
      email,
      password: passwordHash,
      name,
      lastName,
      nif,
      role: 'guest',
      status: 'pending',
      company: inviter.company,
    });

    notificationService.emit('userinvited', invitedUser);

    res.status(201).json({
      message: 'User invited',
      user: {
        id: invitedUser.id,
        email: invitedUser.email,
        role: invitedUser.role,
      },
    });
  } catch (err) {
    next(err);
  }
};