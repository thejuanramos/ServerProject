import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';

const addressSchema = new Schema({
  street: { type: String },
  number: { type: String }, 
  postal: { type: String }, 
  city: { type: String },
  province: { type: String }
}, { _id: false });

const userSchema = new Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true,
    index: true 
  },
  password: { 
    type: String, 
    required: true, 
    select: false 
  },
  name: { type: String },
  lastName: { type: String },
  address: { type: addressSchema },
  role: { 
    type: String, 
    enum: ['admin', 'guest', 'pending'], 
    default: 'pending',
    index: true 
  },
  status: { 
    type: String, 
    enum: ['active', 'pending', 'deleted'], 
    default: 'pending',
    index: true 
  },
  verificationCode: { type: String },
  company: { 
    type: Schema.Types.ObjectId, 
    ref: 'Company' 
  },
  deleted: { 
    type: Boolean, 
    default: false,
    index: true 
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

userSchema.virtual('fullName').get(function() {
  return `${this.name || ''} ${this.lastName || ''}`.trim();
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

const User = model('User', userSchema);
export default User;