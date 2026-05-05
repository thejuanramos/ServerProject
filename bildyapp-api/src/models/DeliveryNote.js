import { Schema, model } from 'mongoose';

const deliveryNoteSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    client: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    format: { 
      type: String, 
      enum: ['material', 'hours'], 
      required: true 
    },
    description: { type: String, required: true, trim: true },
    workDate: { type: Date, required: true },
    // Format: material specific fields
    material: { type: String },
    quantity: { type: Number },
    unit: { type: String },
    // Format: hours specific fields
    hours: { type: Number },
    workers: [{
      name: { type: String },
      hours: { type: Number }
    }],
    signed: { type: Boolean, default: false },
    signedAt: { type: Date },
    signatureData: { type: String }, // Base64 signature image
    pdfPath: { type: String },
    deleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const DeliveryNote = model('DeliveryNote', deliveryNoteSchema);
export default DeliveryNote;