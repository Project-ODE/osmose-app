import React from 'react';
import { Link } from 'react-router-dom';
import './style.css';


export interface CarouselProps {
    articles: Array<any>
}

export const Carousel: React.FC<CarouselProps> = ({
    articles
}) => {
    if (articles.length === 0){
        return (<div></div>);
    }
    
    const content = articles.map((art, i) => {
        art.id = art?.id ?? "";
        art.title = art?.title ?? "";
        art.date = art?.date ?? "";
        art.intro = art?.intro ?? "";
        art.vignette = art?.vignette ?? "";

        return (
            <div className={"carousel-item "+(i===0 ? "active" : "")} key={art.id}>
                <div className="card px-5 border-0">
                    <div className="row no-gutters">
                        <div className="col-md-4 d-flex align-items-center justify-content-center px-4 px-md-0"> 
                            <img className="card-img" src={art.vignette ? art.vignette : ''} alt="" title="" />
                        </div>
                        <div className="col-md-8">
                            <div className="card-body">
                                {art.title ? <h4 className="card-title">{art.title}</h4> : null}
                                {art.date ? <p className="card-text"> <small className="text-muted">{art.date}</small> </p> : null}
                                <div className="card-text">
                                    <p className="quote">
                                        {art.intro}
                                    </p>
                                    <p>
                                        <Link to={"/article/"+String(art.id)}>Read full story</Link>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    });

    return (
        <div id="carousel-home" className="carousel carousel-dark slide border rounded" data-bs-ride="carousel">
            <div className="carousel-inner">
                {content}
            </div>
            <button className="carousel-control-prev" type="button" data-bs-target="#carousel-home" data-bs-slide="prev">
                <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                <span className="visually-hidden">Previous</span>
            </button>
            <button className="carousel-control-next" type="button" data-bs-target="#carousel-home" data-bs-slide="next">
                <span className="carousel-control-next-icon" aria-hidden="true"></span>
                <span className="visually-hidden">Next</span>
            </button>
        </div>
    );
}
