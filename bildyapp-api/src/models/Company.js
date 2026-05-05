import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  cif: {
    type: String,
    required: [true, 'CIF is required'],
    unique: true,
    trim: true
  },
  address: {
    street: String,
    number: Number,
    postalCode: String,
    city: String,
    province: String
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const Company = mongoose.model('Company', companySchema);

export default Company;