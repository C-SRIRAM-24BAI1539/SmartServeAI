import { colors } from '../../utils/constants';
export function Chip({ name }) { return <span className="chip" style={{ '--chip': colors[name?.toLowerCase()] || '#3B5BA5' }}>{name}</span>; }