import React from 'react';

const Skeleton = ({
    type = 'rect', // 'rect', 'circle', 'text', 'title'
    width,
    height,
    borderRadius,
    className = '',
    style = {}
}) => {
    const baseClass = 'skeleton';
    const typeClass = type !== 'rect' ? `skeleton-${type}` : '';

    const combinedStyle = {
        width: width || (type === 'circle' ? '50px' : undefined),
        height: height || (type === 'circle' ? '50px' : undefined),
        borderRadius: borderRadius || undefined,
        ...style
    };

    return (
        <div
            className={`${baseClass} ${typeClass} ${className}`}
            style={combinedStyle}
        />
    );
};

export default Skeleton;
