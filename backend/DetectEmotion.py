import os
import time
import base64
import cv2
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from deepface import DeepFace
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)  # Permettre les requêtes cross-origin
emotion_cache = {}
CACHE_TTL = 300 


# Configuration des uploads
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

# Créer le dossier d'uploads s'il n'existe pas
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(filename):
    """Vérifier si le fichier a une extension autorisée"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/detect-emotion', methods=['POST'])
def detect_emotion():
    """Endpoint principal pour la détection d'émotion"""
    # Vérifier si l'image est dans la requête
    if 'image' not in request.files and 'image' not in request.form:
        return jsonify({
            'success': False,
            'message': 'Aucune image fournie'
        }), 400
    
    try:
        # Gérer différents types d'entrée (fichier uploadé ou base64)
        if 'image' in request.files:
            # Upload de fichier
            file = request.files['image']
            
            if file.filename == '':
                return jsonify({
                    'success': False,
                    'message': 'Aucun fichier sélectionné'
                }), 400
            
            if file and allowed_file(file.filename):
                # Sauvegarder l'image
                filename = secure_filename(file.filename)
                timestamp = int(time.time())
                filename = f"{timestamp}_{filename}"
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(filepath)
        else:
            # Image en base64 depuis la requête JSON
            image_data = request.json.get('image', '')
            
            # Supprimer le préfixe data URL si présent
            if 'base64,' in image_data:
                image_data = image_data.split('base64,')[1]
            
            # Décoder l'image base64
            image_bytes = base64.b64decode(image_data)
            
            # Sauvegarder l'image temporaire
            timestamp = int(time.time())
            filename = f"{timestamp}_base64_image.jpg"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            
            with open(filepath, 'wb') as f:
                f.write(image_bytes)
        
        try:
            # Analyser l'émotion avec DeepFace
            result = DeepFace.analyze(
                img_path=filepath, 
                actions=['emotion'], 
                enforce_detection=False,
                detector_backend='retinaface'  # Try different backends: 'opencv', 'ssd', 'mtcnn', 'retinaface'
            )
            
            # Extraire l'émotion dominante
            emotion = result[0]['dominant_emotion']
            
            # Traduire l'émotion en français
            emotion_map = {
                'angry': 'Colère',
                'disgust': 'Dégoût',
                'fear': 'Peur',
                'happy': 'Joie',
                'sad': 'Tristesse',
                'surprise': 'Surprise',
                'neutral': 'Neutre'
            }
            emotion_fr = emotion_map.get(emotion, emotion)
            
            # Obtenir les détails complets des émotions
            emotion_scores = result[0]['emotion']
            
            # Lire l'image pour l'annotation
            image = cv2.imread(filepath)
            
            # Ajouter l'émotion à l'image
            cv2.putText(image, f"Emotion: {emotion_fr}", (10, 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            
            # Sauvegarder l'image annotée
            annotated_filename = f"annotated_{filename}"
            annotated_filepath = os.path.join(app.config['UPLOAD_FOLDER'], annotated_filename)
            cv2.imwrite(annotated_filepath, image)
            
            debug_path = f"debug_image_{int(time.time())}.jpg"
            with open(debug_path, "wb") as f:
                f.write(open(filepath, "rb").read())


            # Convertir l'image annotée en base64 pour l'inclure dans la réponse
            with open(annotated_filepath, "rb") as img_file:
                img_base64 = base64.b64encode(img_file.read()).decode('utf-8')
            
            emotion_scores = {}
            for key, value in result[0]['emotion'].items():
            # Convert NumPy float32 to Python float
                emotion_scores[key] = float(value)

            # Préparer la réponse
            response_data = {
                'success': True,
                'emotion': result[0]['dominant_emotion'],
                'emotion_fr': emotion_map.get(result[0]['dominant_emotion'], result[0]['dominant_emotion']),
                'emotion_scores': emotion_scores,  # Use the converted dict
                'annotated_image': img_base64
            }
            
            return jsonify(response_data)
        
        except Exception as analysis_error:
            return jsonify({
                'success': False,
                'message': f"Erreur lors de l'analyse: {str(analysis_error)}"
            }), 500
        finally:
            # Nettoyer les fichiers temporaires
            if os.path.exists(filepath):
                os.remove(filepath)
            if 'annotated_filepath' in locals() and os.path.exists(annotated_filepath):
                os.remove(annotated_filepath)
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f"Erreur de traitement: {str(e)}"
        }), 500

@app.route('/', methods=['GET'])
def home():
    """Page d'accueil avec documentation"""
    return """
    <html>
    <head>
        <title>API de Détection d'Émotions</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #333; }
            code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; }
            pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
        </style>
    </head>
    <body>
        <h1>API de Détection d'Émotions</h1>
        <p>Endpoint pour la détection d'émotions : <code>/detect-emotion</code></p>
        <h2>Méthodes d'envoi d'image :</h2>
        <ul>
            <li>Multipart/form-data (fichier)</li>
            <li>JSON avec image en base64</li>
        </ul>
    </body>
    </html>
    """

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
