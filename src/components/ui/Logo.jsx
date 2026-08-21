import React from 'react';

const Logo = ({ size = 40 }) => (
  <img
    src="/AIsanctuarylogo.png"
    alt="AI Sanctuary"
    width={size}
    height={size}
    decoding="async"
    style={{ height: size, width: 'auto', maxWidth: '100%' }}
    className="rounded-md object-contain"
  />
);

export default Logo;
