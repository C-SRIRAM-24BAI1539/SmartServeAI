export const date = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
export const prompts = ['My AC is running but not cooling...', 'Water is leaking under my kitchen sink...', 'The kitchen lights keep flickering...', 'My door hinge is loose and squeaking...'];
export const stages = ['Understanding your problem', 'Retrieving relevant info', 'Structuring the request', 'Ranking providers'];
export const colors = { plumbing: '#5B7C99', electrical: '#B8923D', ac: '#4FA3A8', carpentry: '#8B6F4E' };
export const getSession = () => { try { return JSON.parse(localStorage.getItem('smartserve-session')) || null; } catch { return null; } };
export const fade = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };
export const status = s => `status ${s.toLowerCase().replace('_', '-')}`;
