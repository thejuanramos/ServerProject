import { Schema, model } from 'mongoose';

const clientSchema = new Schema({
  name: { type: String, required: true },
  cif: { type: String, required: true, unique: true },
  address: {
    street: { type: String },
    number: { type: String },
    postal: { type: String },
    city: { type: String },
    province: { type: String }
  },
  // This links the client to the person who created it
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  // This links the client to your company
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true }
}, { timestamps: true });

export default model('Client', clientSchema);