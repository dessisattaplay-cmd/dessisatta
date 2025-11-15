import { MULTI_LANGUAGE_CONTENT } from '../constants';
import type { Language } from '../context/LanguageContext';

const { TIPS } = MULTI_LANGUAGE_CONTENT;

let lastTipIndex = -1;

export const getRandomTip = (language: Language): string => {
    const langTips = TIPS[language];
    let randomIndex;
    
    // Avoid showing the same tip twice in a row
    do {
        randomIndex = Math.floor(Math.random() * langTips.length);
    } while (randomIndex === lastTipIndex);

    lastTipIndex = randomIndex;
    return langTips[randomIndex];
};
