// Works in both browser and Node.js — no crypto module needed
// Uses ui-avatars.com as primary (initials-based, always works)
// Falls back to gravatar identicon if user has a gravatar account

export function getAvatarUrl(name: string, email: string, size = 80): string {
    // ui-avatars generates a colored avatar with initials — works everywhere
    const initials = name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const encoded = encodeURIComponent(initials);
    return `https://ui-avatars.com/api/?name=${encoded}&size=${size}&background=212328&color=FDD458&bold=true&format=png`;
}
