import { useState, useEffect } from 'react';
import { api } from '../../api';
import { Section } from '../ui/Section';
import { Kanban } from './Kanban';
import { Services } from './Services';
import { Profile } from './Profile';

export function Provider({ page, token, notify }) { const [dash, setDash] = useState(null), [categories, setCategories] = useState([]), [bookings, setBookings] = useState([]), [profile, setProfile] = useState(null); const load = async () => { try { const [a, b, c, d] = await Promise.all([api('/providers/me/dashboard', { token }), api('/categories'), api('/bookings', { token }), api('/profile/me', { token })]); setDash(a.provider); setCategories(b.categories); setBookings(c.bookings); setProfile(d); } catch (e) { notify({ type: 'error', message: e.message }); } }; useEffect(() => { load(); }, []); if (page === 'dashboard' || page === 'bookings') return <><Section label="Work board" title={page === 'dashboard' ? 'Today’s service pipeline.' : 'Manage every request.'} /><Kanban data={bookings} token={token} reload={load} notify={notify} /></>; if (page === 'services') return <Services data={dash?.services || []} categories={categories} token={token} reload={load} notify={notify} />; return <Profile profile={profile} token={token} notify={notify} reload={load} />; }