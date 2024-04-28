import React, { useState, useEffect } from 'react';
import { Row, Col, Container, Image } from 'react-bootstrap';
// import { Row, Col, Container } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCloudDownloadAlt } from '@fortawesome/fontawesome-free-solid'
import './SavedImages.css';

// function SavedImages(props) {
//     const [images, setImages] = useState([]);

//     useEffect(() => {
//         const fetchedImages = [
//             { id: 1, src: 'image0.jpeg', filename: 'image1.jpeg' },
//             { id: 2, src: 'logo192.png', filename: 'image2.png' },
//             { id: 3, src: 'logo512.png', filename: 'image3.jpeg' },
//             { id: 4, src: 'logo512.png', filename: 'image3.jpeg' },
//             { id: 5, src: 'image0.jpeg', filename: 'image1.jpeg' },
//             { id: 6, src: 'logo192.png', filename: 'image2.png' },
//         ];
//         setImages(fetchedImages);
//     }, []);


function ImageWithFetch({ imageId }) {
    const [imageUrl, setImageUrl] = useState(null);

    useEffect(() => {
        console.log('Fetching image with ID:', imageId); // Add this line
        fetch(`http://localhost:3000/getImage/${imageId}`)
            .then(response => response.json())
            .then(data => {
                setImageUrl(data.url);
            });
    }, [imageId]);

    if (!imageUrl) {
        return null;
    }

    return <Image src={imageUrl} thumbnail />;
}



function SavedImages(props) {
    const [images, setImages] = useState([]);

    useEffect(() => {
        fetch('retrieveImages', {
            credentials: 'include' 
        })
            .then(response => response.json())
            .then(data => {
                console.log(data);

                setImages(data);
            })
            .catch(error => console.error('Error:', error));
    }, []);
    
    const handleDownload = (imageSrc, filename) => {
        const imageId = imageSrc.split('/').pop();
    
        fetch(`http://localhost:3000/getImage/${imageId}`)
            .then(response => response.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            })
            .catch(() => alert('Something went wrong! We couldn\'t download the file.'));
    };

//     return (
//         <Container style={{ marginTop: '4rem' }}>
//             <Row>
//                 {images.map((image, index) => (
//                     <Col key={index} xs={6} md={4}>
//                         {/* <Image src={image.url} thumbnail /> */}
//                         <Image src={`http://localhost:3000/getImage/${image._id}`} thumbnail />\
//                         <div className="image-overlay">
//                             <button onClick={() => handleDownload(image.url, image.filename)}>
//                                 <FontAwesomeIcon icon={faCloudDownloadAlt} />
//                             </button>
//                         </div>
//                     </Col>
//                 ))}
//             </Row>
//         </Container>
//     );
// }
return (
    <Container style={{ marginTop: '4rem' }}>
        <Row>
            {images.map((image, index) => (
                <Col key={index} xs={6} md={4}>
                    <ImageWithFetch imageId={image._id} />
                    <div className="image-overlay">
                        <button onClick={() => handleDownload(image.url, image.filename)}>
                            <FontAwesomeIcon icon={faCloudDownloadAlt} />
                        </button>
                    </div>
                </Col>
            ))}
        </Row>
    </Container>
);
}

export default SavedImages;