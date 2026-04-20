import { inngest } from "@/lib/inngest/client";
import { NEWS_SUMMARY_EMAIL_PROMPT, PERSONALIZED_WELCOME_EMAIL_PROMPT } from "@/lib/inngest/prompts";
import { sendNewsSummaryEmail, sendWelcomeEmail } from "@/lib/nodemailer";
import { getUsersForEmail, getSymbolsForUser, fetchNews } from "@/lib/inngest/helpers";
import { getFormattedTodayDate } from "@/lib/utils";

// Sanitize email for use as Inngest step ID (only alphanumeric + hyphens)
function toStepId(email: string): string {
    return email.replace(/[^a-zA-Z0-9]/g, '-');
}

export const sendSignUpEmail = inngest.createFunction(
    {
        id: 'sign-up-email',
        triggers: [{ event: 'app/user.created' }],
    },
    async ({ event, step }) => {
        const userProfile = `
            - Country: ${event.data.country}
            - Investment goals: ${event.data.investmentGoals}
            - Risk tolerance: ${event.data.riskTolerance}
            - Preferred industry: ${event.data.preferredIndustry}
        `;

        const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace('{{userProfile}}', userProfile);

        const response = await step.ai.infer('generate-welcome-intro', {
            model: step.ai.models.gemini({ model: 'gemini-2.5-flash-lite' }),
            body: {
                contents: [{ role: 'user', parts: [{ text: prompt }] }]
            }
        });

        await step.run('send-welcome-email', async () => {
            const part = response.candidates?.[0]?.content?.parts?.[0];
            const introText = (part && 'text' in part ? part.text : null)
                || 'Thanks for joining AssetWatch. You now have the tools to track markets and make smarter moves.';
            const { data: { email, name } } = event;
            return await sendWelcomeEmail({ email, name, intro: introText });
        });

        return { success: true, message: 'Welcome email sent successfully' };
    }
);

export const sendDailyNewsSummary = inngest.createFunction(
    {
        id: 'daily-news-summary',
        triggers: [
            { event: 'app/send.daily.news' },
            { cron: '0 12 * * *' },
        ],
    },
    async ({ step }) => {
        // Step 1: Get all users
        const users = await step.run('get-all-users', () => getUsersForEmail());

        if (!users || users.length === 0) {
            return { success: false, message: 'No users found' };
        }

        // Step 2: Fetch news for each user
        const results = await step.run('fetch-user-news', async () => {
            const perUser: Array<{ user: UserForNewsEmail; articles: MarketNewsArticle[] }> = [];

            for (const user of users as UserForNewsEmail[]) {
                try {
                    const symbols = await getSymbolsForUser(user.email);
                    let articles = await fetchNews(symbols);
                    if (!articles || articles.length === 0) {
                        articles = await fetchNews();
                    }
                    perUser.push({ user, articles: articles.slice(0, 6) });
                } catch (e) {
                    console.error('fetch-user-news error for', user.email, e);
                    perUser.push({ user, articles: [] });
                }
            }

            return perUser;
        });

        // Step 3: For each user — summarize + send in one step
        for (const { user, articles } of results as Array<{ user: UserForNewsEmail; articles: MarketNewsArticle[] }>) {
            if (!articles || articles.length === 0) continue;

            const stepId = `news-email-${toStepId(user.email)}`;

            await step.run(stepId, async () => {
                try {
                    const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace(
                        '{{newsData}}',
                        JSON.stringify(articles, null, 2)
                    );

                    // Call Gemini directly (not via step.ai.infer inside step.run)
                    const geminiRes = await fetch(
                        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                contents: [{ role: 'user', parts: [{ text: prompt }] }]
                            })
                        }
                    );

                    let newsContent = 'No market news today.';
                    if (geminiRes.ok) {
                        const geminiData = await geminiRes.json();
                        const part = geminiData?.candidates?.[0]?.content?.parts?.[0];
                        if (part && 'text' in part && part.text) {
                            newsContent = part.text;
                        }
                    }

                    await sendNewsSummaryEmail({
                        email: user.email,
                        date: getFormattedTodayDate(),
                        newsContent,
                    });

                    return { sent: true, email: user.email };
                } catch (e) {
                    console.error('news-email step failed for', user.email, e);
                    return { sent: false, email: user.email };
                }
            });
        }

        return { success: true, message: 'Daily news summary complete' };
    }
);
