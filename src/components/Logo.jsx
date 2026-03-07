import React from 'react';

const Logo = ({ size = 32, className = "", style = {} }) => {
    return (
        <img
            src="/favicon.svg"
            alt="African Interior Design Logo"
            width={size}
            height={size}
            className={className}
            style={{
                display: 'inline-block',
                verticalAlign: 'middle',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                ...style
            }}
        />
    );
};

export default Logo;
