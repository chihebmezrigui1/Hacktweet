import React, { useState, useRef, useEffect } from 'react';
import { Camera, AlertTriangle } from 'lucide-react';
import { API_URL } from '../API';
import { fetchWithAuth } from '../fetchWithAuth';

const WebcamEmotionDetector = ({ postId }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [capturedEmotion, setCapturedEmotion] = useState(null);
  const [error, setError] = useState(null);

  const startWebcam = async () => {
    setError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Votre navigateur ne supporte pas l'accès à la webcam");
      }

      const constraints = {
        video: { 
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          facingMode: "user",
          frameRate: { ideal: 30, max: 60 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setIsWebcamActive(true);
        };
      }
    } catch (error) {
      console.error("Erreur d'accès à la webcam:", error);
      
      let errorMessage = "Impossible d'accéder à la webcam.";
      switch(error.name) {
        case 'NotAllowedError':
          errorMessage = "Accès à la webcam refusé. Veuillez autoriser les permissions.";
          break;
        case 'NotFoundError':
          errorMessage = "Aucune webcam n'a été trouvée sur cet appareil.";
          break;
        case 'NotReadableError':
          errorMessage = "La webcam est déjà utilisée par une autre application.";
          break;
      }

      setError(errorMessage);
    }
  };

  const captureEmotion = async () => {
    if (!videoRef.current || !isWebcamActive || !postId) return;

    try {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setError("Impossible de capturer l'image.");
          return;
        }

        const formData = new FormData();
        formData.append('image', blob, 'captured_emotion.jpg');
        formData.append('postId', postId);  // Ajouter l'ID du post

        try {
          const response = await fetchWithAuth(`/api/posts/detect-emotion`, {
            method: 'POST',
            body: formData,
            credentials: 'include'
          });

          if (!response.ok) {
            throw new Error('Emotion detection failed');
          }

          const data = await response.json();
          
          if (data.success) {
            setCapturedEmotion({
              emotion: data.emotion_fr,
              score: data.emotion_scores[data.emotion]
            });
          } else {
            setError("Détection d'émotion impossible.");
          }

        } catch (error) {
          console.error("Erreur de détection d'émotion:", error);
          setError("Erreur lors de la communication avec le serveur.");
        }
      }, 'image/jpeg');
    } catch (error) {
      console.error("Erreur lors de la capture d'émotion:", error);
      setError("Erreur lors de la capture de l'émotion.");
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      setIsWebcamActive(false);
      setCapturedEmotion(null);
      setError(null);
    }
  };

  return (
    <div className="webcam-emotion-container relative">
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50 flex items-center">
          <AlertTriangle className="mr-2" />
          {error}
        </div>
      )}

      {!isWebcamActive ? (
        <button 
          onClick={startWebcam} 
          className="flex items-center bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition"
        >
          <Camera className="mr-2" /> Détecter Émotions
        </button>
      ) : (
        <div className="fixed bottom-4 right-4 z-50">
          <video 
            ref={videoRef} 
            autoPlay 
            className="w-32 h-24 rounded-lg mb-2"
            style={{ transform: 'scaleX(-1)' }}
          />
          <button 
            onClick={stopWebcam}
            className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition w-full"
          >
            Arrêter Webcam
          </button>
        </div>
      )}

      {capturedEmotion && (
        <div 
          className="fixed bottom-4 left-4 bg-white/80 p-2 rounded-lg z-50"
        >
          Émotion : {capturedEmotion.emotion} 
          <br />
          Score : {(capturedEmotion.score * 100).toFixed(2)}%
        </div>
      )}

      <canvas 
        ref={canvasRef} 
        width={640} 
        height={480} 
        style={{ display: 'none' }} 
      />
    </div>
  );
};

export default WebcamEmotionDetector;