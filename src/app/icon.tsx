import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 18,
          background: '#111111',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#e5c07b', // Soft elegant gold
          borderRadius: '6px', // Slight rounding
          fontFamily: 'serif',
          fontWeight: 'bolder',
          letterSpacing: '-0.5px',
          boxShadow: 'inset 0 0 0 1px rgba(229, 192, 123, 0.3)',
        }}
      >
        SK
      </div>
    ),
    {
      ...size,
    }
  );
}
