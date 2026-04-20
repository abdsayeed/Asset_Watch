import crypto from 'crypto';

export function getGravatarUrl(email: string, size = 80): string {
    const hash = crypto
        .createHash('sha256')
        .update(email.trim().toLowerCase())
        .digest('hex');
    return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
}
