import DeliveryNote from '../models/DeliveryNote.js';
import AppError from '../utils/AppError.js';
import { generateDeliveryNotePDF } from '../services/pdf.service.js';
import fs from 'fs';

export const createDeliveryNote = async (req, res, next) => {
  try {
    const note = await DeliveryNote.create({
      ...req.body,
      user: req.user._id,
      company: req.user.company,
    });

    req.app.get('io').to(req.user.company.toString()).emit('deliverynote:new', note);

    res.status(201).json(note);
  } catch (error) {
    next(error);
  }
};

export const getDeliveryNotes = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, project, client, format, signed, from, to, sort = '-workDate' } = req.query;
    const query = { company: req.user.company, deleted: false };

    if (project) query.project = project;
    if (client) query.client = client;
    if (format) query.format = format;
    if (signed !== undefined) query.signed = signed === 'true';
    if (from || to) {
      query.workDate = {};
      if (from) query.workDate.$gte = new Date(from);
      if (to) query.workDate.$lte = new Date(to);
    }

    const notes = await DeliveryNote.find(query)
      .populate('client', 'name')
      .populate('project', 'name projectCode')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalItems = await DeliveryNote.countDocuments(query);

    res.json({
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: Number(page),
      data: notes,
    });
  } catch (error) {
    next(error);
  }
};

export const getDeliveryNoteById = async (req, res, next) => {
  try {
    const note = await DeliveryNote.findOne({ _id: req.params.id, company: req.user.company })
      .populate('user', 'firstName lastName')
      .populate('client')
      .populate('project');

    if (!note) throw AppError.notFound('Delivery note not found');
    res.json(note);
  } catch (error) {
    next(error);
  }
};

export const deleteDeliveryNote = async (req, res, next) => {
  try {
    const note = await DeliveryNote.findOne({ _id: req.params.id, company: req.user.company });
    if (!note) throw AppError.notFound('Delivery note not found');
    if (note.signed) throw AppError.badRequest('Cannot delete a signed delivery note');

    await note.deleteOne();
    res.json({ message: 'Delivery note deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const signDeliveryNote = async (req, res, next) => {
  try {
    const { signatureData } = req.body;
    if (!signatureData) throw AppError.badRequest('Signature data is required');

    const note = await DeliveryNote.findOne({ _id: req.params.id, company: req.user.company })
      .populate('client project');

    if (!note) throw AppError.notFound('Delivery note not found');
    if (note.signed) throw AppError.badRequest('Delivery note is already signed');

    note.signed = true;
    note.signedAt = new Date();
    note.signatureData = signatureData;

    const pdfPath = await generateDeliveryNotePDF(note);
    note.pdfPath = pdfPath;

    await note.save();

    req.app.get('io').to(req.user.company.toString()).emit('deliverynote:signed', note);

    res.json(note);
  } catch (error) {
    next(error);
  }
};

export const getPDF = async (req, res, next) => {
  try {
    const note = await DeliveryNote.findOne({ _id: req.params.id, company: req.user.company });
    if (!note || !note.pdfPath) throw AppError.notFound('PDF not found or note not signed');

    if (!fs.existsSync(note.pdfPath)) {
      throw AppError.notFound('PDF file missing on server');
    }

    res.setHeader('Content-Type', 'application/pdf');
    const fileStream = fs.createReadStream(note.pdfPath);
    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
};