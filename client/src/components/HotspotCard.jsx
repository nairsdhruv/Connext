import React from 'react';
import { MapPin, Users, Calendar, ArrowRight, MessageSquare, Clock } from 'lucide-react';
import { CATEGORY_CONFIG, formatDistance } from '../services/mapService';

export const HotspotCard = ({ hotspot, isSelected, onSelect, userLocation }) => {
  const cat = CATEGORY_CONFIG[hotspot.category] || CATEGORY_CONFIG.other;
  const isMeetup = hotspot.type === 'meetup';

  // Distance computation if nearby query attached distanceKm or calculate client-side
  const distanceText = hotspot.distanceMeters
    ? formatDistance(hotspot.distanceMeters)
    : hotspot.distanceKm
    ? `${hotspot.distanceKm} km`
    : null;

  const attendeeCount = hotspot.attendees?.length || 1;
  const capacityText = hotspot.capacity ? `${attendeeCount}/${hotspot.capacity}` : `${attendeeCount}`;

  // Format date if meetup
  const formattedDate = hotspot.startDateTime
    ? new Date(hotspot.startDateTime).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : null;

  return (
    <div
      onClick={() => onSelect(hotspot)}
      className={`group relative rounded-2xl border p-4 cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'bg-dark-800/90 border-brand-primary shadow-xl shadow-cyan-950/40 ring-1 ring-brand-primary/50'
          : 'bg-dark-900/70 border-dark-700/60 hover:bg-dark-800/60 hover:border-dark-600'
      }`}
    >
      {/* Top Category & Status Header */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${cat.bg}`}>
            {cat.label}
          </span>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
              isMeetup
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            }`}
          >
            {isMeetup ? 'Scheduled Meetup' : 'Public Hangout'}
          </span>
        </div>

        {distanceText && (
          <span className="text-xs font-semibold text-brand-primary bg-brand-primary/10 border border-brand-primary/20 px-2 py-0.5 rounded-md flex-shrink-0">
            {distanceText}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-base font-bold text-white group-hover:text-brand-primary transition-colors leading-snug mb-1">
        {hotspot.name}
      </h3>

      {/* Description Snippet */}
      <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
        {hotspot.description}
      </p>

      {/* Meta Information */}
      <div className="flex flex-col gap-1.5 pt-2 border-t border-dark-700/50 text-xs text-slate-300">
        <div className="flex items-center gap-1.5 truncate">
          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span className="truncate text-slate-300">{hotspot.address}</span>
        </div>

        {isMeetup && formattedDate && (
          <div className="flex items-center gap-1.5 text-amber-300 font-medium">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{formattedDate}</span>
          </div>
        )}

        <div className="flex items-center justify-between mt-1 pt-1 text-[11px] text-slate-400">
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-brand-primary" />
            <span>{capacityText} joined</span>
          </div>

          <div className="flex items-center gap-1 text-brand-primary font-medium group-hover:translate-x-0.5 transition-transform">
            <span>View & Chat</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>
    </div>
  );
};
