import { useNavigate } from 'react-router-dom';
import type { Room, Tenant } from '../types/database';

interface RoomMapProps {
  rooms: Room[];
  tenants: Tenant[];
}

export function RoomMap({ rooms, tenants }: RoomMapProps) {
  const navigate = useNavigate();

  const activeTenants = tenants.filter((t) => t.active);

  function getOccupancy(roomId: string) {
    return activeTenants.filter((t) => t.room_id === roomId).length;
  }

  function tileColor(occupied: number, capacity: number) {
    if (occupied === 0) return 'bg-cream border-border text-ink-soft';
    if (occupied >= capacity) return 'bg-rose-soft border-rose/30 text-rose';
    return 'bg-clay-soft border-clay/30 text-clay';
  }

  if (rooms.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-ink-soft text-sm">
          No rooms yet. Go to Rooms & Tenants to add your first room.
        </p>
      </div>
    );
  }

  const sorted = [...rooms].sort((a, b) =>
    a.room_number.localeCompare(b.room_number, undefined, { numeric: true })
  );

  return (
    <div className="card p-5">
      <h2 className="font-serif text-lg font-semibold mb-4">Room Map</h2>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
        {sorted.map((room) => {
          const occupied = getOccupancy(room.id);
          return (
            <button
              key={room.id}
              onClick={() => navigate('/rooms')}
              title={`Room ${room.room_number}: ${occupied}/${room.capacity}`}
              className={`aspect-square rounded-lg border flex flex-col items-center justify-center p-1 transition-transform hover:scale-105 cursor-pointer ${tileColor(occupied, room.capacity)}`}
            >
              <span className="font-mono text-xs font-semibold leading-tight">
                {room.room_number}
              </span>
              <span className="font-mono text-[10px] opacity-80">
                {occupied}/{room.capacity}
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-4 mt-4 text-xs text-ink-soft">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-cream border border-border" /> Empty
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-clay-soft border border-clay/30" /> Partial
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-rose-soft border border-rose/30" /> Full
        </span>
      </div>
    </div>
  );
}
