// Boba & Aloe: the add-on's own cats.js and cats.css in a pretend reviewer.
import { frame } from './frame.js';
export const mount = (host) => frame(host, 'media/anki/reviewer.html?addon=cats', { title: 'Boba and Aloe in a pretend Anki reviewer' });
