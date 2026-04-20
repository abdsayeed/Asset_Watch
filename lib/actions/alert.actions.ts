'use server';

import { connectToDatabase } from '@/database/mongoose';
import { AlertModel } from '@/database/models/alert.model';
import { getAuth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function getAlerts() {
    await connectToDatabase();
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return [];

    const alerts = await AlertModel.find({ userId: session.user.id }).sort({ createdAt: -1 }).lean();
    return alerts.map((a) => ({
        id: a._id.toString(),
        symbol: a.symbol,
        company: a.company,
        alertName: a.alertName,
        alertType: a.alertType as 'upper' | 'lower',
        threshold: a.threshold,
        triggered: a.triggered,
    }));
}

export async function createAlert(data: {
    symbol: string;
    company: string;
    alertName: string;
    alertType: 'upper' | 'lower';
    threshold: number;
}): Promise<{ success: boolean; message: string }> {
    await connectToDatabase();
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { success: false, message: 'Not authenticated' };

    await AlertModel.create({ ...data, userId: session.user.id, triggered: false });
    revalidatePath('/watchlist');
    return { success: true, message: `Alert created for ${data.symbol}` };
}

export async function deleteAlert(alertId: string): Promise<{ success: boolean; message: string }> {
    await connectToDatabase();
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { success: false, message: 'Not authenticated' };

    await AlertModel.deleteOne({ _id: alertId, userId: session.user.id });
    revalidatePath('/watchlist');
    return { success: true, message: 'Alert deleted' };
}
