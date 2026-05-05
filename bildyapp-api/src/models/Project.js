import { Schema, model } from 'mongoose';

const projectSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    projectCode: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    address: {
      street: String,
      number: String,
      postal: String,
      city: String,
      province: String,
    },
    notes: {
      type: String,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure unique project code per company
projectSchema.index({ company: 1, projectCode: 1 }, { unique: true });

const Project = model('Project', projectSchema);

export default Project;