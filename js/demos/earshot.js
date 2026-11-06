// Earshot itself, with sample lecture notes in place of the bundled ones.
import { frame } from './frame.js';
export const mount = (host) => frame(host, 'media/earshot/index.html', { allow: 'microphone; screen-wake-lock', title: 'Earshot' });
