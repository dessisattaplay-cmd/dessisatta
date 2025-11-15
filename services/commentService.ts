import type { WinnerComment } from '../types';
import { MULTI_LANGUAGE_CONTENT } from '../constants';

const { NAMES, COMMENTS } = MULTI_LANGUAGE_CONTENT;

const getRandomElement = <T,>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)];
};

const generateComment = (lang: 'en' | 'hi' | 'bn'): Omit<WinnerComment, 'id'> => {
    const name = getRandomElement(NAMES[lang]);
    const comment = getRandomElement(COMMENTS[lang]);
    const userId = `IN${Math.floor(10000000 + Math.random() * 90000000)}`;
    return { name, userId, comment, language: lang };
};

export const generateWinnerComments = (): WinnerComment[] => {
    let comments: Omit<WinnerComment, 'id'>[] = [];
    const languages: ('en' | 'hi' | 'bn')[] = ['en', 'hi', 'bn'];
    
    // Generate more than 25 to have enough unique options
    for(let i = 0; i < 40; i++) {
        const randomLang = getRandomElement(languages);
        comments.push(generateComment(randomLang));
    }

    const generatedUserIds = new Set<string>();
    const uniqueComments = comments
        .filter(c => {
            if (generatedUserIds.has(c.userId)) {
                return false;
            }
            generatedUserIds.add(c.userId);
            return true;
        })
        .map(c => ({...c, id: c.userId}));


    // Shuffle the final array for a natural mix
    for (let i = uniqueComments.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [uniqueComments[i], uniqueComments[j]] = [uniqueComments[j], uniqueComments[i]];
    }

    // Return exactly 25
    return uniqueComments.slice(0, 25);
};