import { useEffect, useState, useRef } from "react";
import * as React from 'react';
import { useNavigate } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import Modal from 'react-bootstrap/Modal';
import './Dashboard.css';

function Dashboard(props) {
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [imageSrc, setImageSrc] = useState('');
    const canvasRef = useRef(null);

    function onHandleFileChange(e) {
        const file = e.target.files[0];

        let formData = new FormData();
        formData.append('image', file);

        const response = fetch('/upload', {
            method: 'POST',
            body: formData

    }).then(response => {response.blob()})
        .then(blob => {console.log(blob)})
        .catch(error => {console.error(error)});

        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            setImageSrc(event.target.result);
            setShowModal(true);
        };
        reader.readAsDataURL(file);
    }

    function onHandleCloseModal() {
        setShowModal(false);
    }

    function onHandleMakeDownloadLink() {
        const canvas = canvasRef.current;
        canvas.toBlob(function (blob) {
            const url = URL.createObjectURL(blob);
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = 'enhanced-image.png';
            downloadLink.click();
        });
    }

    function sharpify() {
        if (!imageSrc) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
            let imageAspectRatio = img.width / img.height;
            canvas.width = 800;
            canvas.height = 800 / imageAspectRatio;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            onHandleMakeDownloadLink();
        };
        img.src = imageSrc;
    }

    return (
        <div className="display-container">
            <div className="sharpify-title">
                Welcome to Sharpify!
            </div>
            <label className="file-input-label">
                Upload an Image!
                <input type="file"
                    id="fileUpload"
                    accept="image/*"
                    onChange={onHandleFileChange}
                    style={{ opacity: 0, width: '100%', height: '100%', position: 'absolute', left: 0, top: 0 }}
                />
            </label>
            <a id="downloadLink" style={{ display: "none" }}>Download Link</a>
            <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
            <Modal show={showModal} onHide={onHandleCloseModal} size="xl" aria-labelledby="contained-modal-title-vcenter" centered>
                <Modal.Header closeButton>
                    <Modal.Title id="contained-modal-title-vcenter">
                        Sharpify your Image!
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ display: 'flex', height: 'calc(80vh - 56px)' }}>
                    <div style={{ flex: 1, overflow: 'auto' }}>
                        <img src={imageSrc} style={{ width: '100%', height: 'auto', objectFit: 'contain' }} alt="Uploaded" />
                    </div>
                    <div className="modal-divider"></div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="file-input-label" onClick={sharpify}>Sharpify</div>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default Dashboard;