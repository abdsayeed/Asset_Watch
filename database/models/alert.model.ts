import { Schema, model, models, type Document, type Model } from 'mongoose';

export interface AlertDocument extends Document {
    userId: string;
    symbol: string;
    company: string;
    alertName: string;
    alertType: 'upper' | 'lower';
    threshold: number;
    triggered: boolean;
    createdAt: Date;
}

const AlertSchema = new Schema<AlertDocument>(
    {
        userId:    { type: String, required: true, index: true },
        symbol:    { type: String, required: true, uppercase: true, trim: true },
        company:   { type: String, required: true, trim: true },
        alertName: { type: String, required: true, trim: true },
        alertType: { type: String, enum: ['upper', 'lower'], required: true },
        threshold: { type: Number, required: true },
        triggered: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export const AlertModel: Model<AlertDocument> =
    (models?.Alert as Model<AlertDocument>) || model<AlertDocument>('Alert', AlertSchema);
