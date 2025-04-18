import React from 'react';
import Slider from 'react-slick';
import StarRating from './StarRating'; // Asegúrate de tener este componente bien configurado

function MovieCarousel({ movies, selectMovie }) {
    const settings = {
        dots: true,
        infinite: true,
        speed: 300,
        slidesToShow: 5,
        slidesToScroll: 5,
        prevArrow: <CustomPrevArrow />,
        nextArrow: <CustomNextArrow />
    };

    function CustomPrevArrow(props) {
        const { className, style, onClick } = props;
        return (
            <div
                className={className}
                style={{ ...style, display: "block", background: "black" }}
                onClick={onClick}
            />
        );
    }

    function CustomNextArrow(props) {
        const { className, style, onClick } = props;
        return (
            <div
                className={className}
                style={{ ...style, display: "block", background: "black", marginRight: "4px" }}
                onClick={onClick}
            />
        );
    }

    return (
        <div style={{ maxWidth: '1800px', margin: '20px auto' }}>
            <Slider {...settings}>
                {movies.map(movie => (
                    <div
                        key={movie.id}
                        onClick={() => selectMovie(movie)}
                        style={{
                            padding: "10px",
                            textAlign: 'center',
                            cursor: 'pointer'
                        }}
                    >
                        <div style={{
                            width: '200px',
                            height: '300px',
                            backgroundColor: '#222',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            margin: '0 auto'
                        }}>
                            <img
                                loading="lazy"
                                src={
                                    movie.poster_path
                                        ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
                                        : "https://via.placeholder.com/200x300?text=No+Image"
                                }
                                alt={movie.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "https://via.placeholder.com/200x300?text=No+Image";
                                }}
                            />
                        </div>
                        <h4 style={{ color: 'white', marginTop: '10px' }}>{movie.title}</h4>
                        <StarRating rating={movie.vote_average} />
                        <p style={{ color: '#ccc', fontSize: '14px' }}>
                            {movie.vote_average?.toFixed(1)} / 10
                        </p>
                    </div>
                ))}
            </Slider>
        </div>
    );
}

export default MovieCarousel;
