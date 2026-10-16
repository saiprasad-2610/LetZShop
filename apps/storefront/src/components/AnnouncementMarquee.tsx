import React from 'react';

export function AnnouncementMarquee({ text }: { text: string }) {
  // Equal groups make the -50% wrap exact. Each group covers at least a viewport,
  // including short offers; only the single accessible copy is read aloud.
  const repetitions = Math.min(12, Math.max(2, Math.ceil(120 / Math.max(1, text.length))));
  const duration = Math.max(25, text.length * repetitions * 0.13);
  return (
    <div className="announcement-marquee">
      <span className="sr-only">{text}</span>
      <div className="announcement-marquee-track" aria-hidden="true" style={{ animationDuration: `${duration}s` }}>
        {[0, 1].map((group) => (
          <div className="announcement-marquee-group" key={group}>
            {Array.from({ length: repetitions }, (_, index) => (
              <span className="announcement-marquee-copy" key={index}>
                <span>{text}</span><span className="opacity-60">•</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
