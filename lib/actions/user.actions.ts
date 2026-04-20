'use server';

import { connectToDatabase } from '@/database/mongoose';

export async function getAllUsersForNewsEmail(): Promise<UserForNewsEmail[]> {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db!;

    const users = await db
        .collection('user')
        .find({}, { projection: { _id: 1, name: 1, email: 1 } })
        .toArray();

    return users.map((u) => ({
        id: u._id.toString(),
        name: u.name ?? '',
        email: u.email,
    }));
}
