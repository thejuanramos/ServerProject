import { Schema, model } from 'mongoose';

const projectSchema = new Schema({
  name: { type: String, required: true },
  projectNumber: { type: String, required: true, unique: true }, 
  clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  notes: { type: String },
  status: { 
    type: String, 
    enum: ['active', 'completed', 'on-hold'], 
    default: 'active' 
  }
}, { timestamps: true });

export default model('Project', projectSchema);