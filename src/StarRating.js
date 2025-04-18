import React from 'react';

const StarRating = ({ rating }) => {
    const maxStars = 5;
    const scaledRating = rating / 2;
    const fullStars = Math.floor(scaledRating);
    const halfStar = scaledRating % 1 >= 0.25 && scaledRating % 1 < 0.75;
    const emptyStars = maxStars - fullStars - (halfStar ? 1 : 0);

    const stars = [];

    for (let i = 0; i < fullStars; i++) {
        stars.push(<span key={`full-${i}`} style={{ color: 'gold', fontSize: '24px' }}>★</span>);
    }

    if (halfStar) {
        stars.push(
            <span key="half" style={{ color: 'gold', fontSize: '24px', position: 'relative' }}>
                <span style={{ color: '#ccc' }}>★</span>
                <span style={{
                    position: 'absolute',
                    left: 0,
                    width: '50%',
                    overflow: 'hidden',
                    color: 'gold',
                    top: 0
                }}>★</span>
            </span>
        );
    }

    for (let i = 0; i < emptyStars; i++) {
        stars.push(<span key={`empty-${i}`} style={{ color: '#ccc', fontSize: '24px' }}>★</span>);
    }

    return <div style={{ display: 'flex', justifyContent: 'center', gap: '2px' }}>{stars}</div>;
};

export default StarRating;
