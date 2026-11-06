// Boba in 3D: the add-on's own boba.js playing the Blender sprite sheet.
import { frame } from './frame.js';
export const mount = (host) => frame(host, 'media/anki/reviewer.html?addon=boba&night=1', { title: 'Boba the Study Cat in a pretend Anki reviewer' });
