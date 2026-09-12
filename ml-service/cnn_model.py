"""
IdentityShield - CNN Model Definition and Inference Module
Architecture:
  Input (224x224x3) -> Rescaling(1/255) ->
  Conv2D(32) -> MaxPool ->
  Conv2D(64) -> MaxPool ->
  Conv2D(128) -> MaxPool ->
  Flatten -> Dense(128) -> Dropout(0.5) -> Dense(1, sigmoid)

Binary classification:
  0 = Normal (authentic training visual pattern)
  1 = Suspicious (tampered, anomalous, or modified visual pattern)
"""

import os
import numpy as np

# Lazy / safe import for TensorFlow to avoid crashing if tensorflow isn't installed during light inspects
try:
    import tensorflow as tf
    from tensorflow.keras import layers, models
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False


MODEL_SAVE_PATH = os.path.join(os.path.dirname(__file__), "model", "document_cnn.keras")


def build_cnn_model(input_shape=(224, 224, 3)):
    """
    Builds the beginner-friendly sequential CNN model for document visual screening.
    Every layer is documented to help beginners understand the architecture.
    """
    if not TF_AVAILABLE:
        raise RuntimeError("TensorFlow is not installed in the current Python environment.")

    model = models.Sequential([
        # 1. Input Layer: Accept 224x224 RGB image
        layers.Input(shape=input_shape),

        # 2. Normalization: Scale pixel values from [0, 255] down to [0.0, 1.0]
        layers.Rescaling(1.0 / 255.0),

        # 3. First Convolutional Block: Extract basic edges and low-level visual textures
        layers.Conv2D(32, (3, 3), activation='relu', padding='same', name='conv_1'),
        layers.MaxPooling2D((2, 2), name='pool_1'),

        # 4. Second Convolutional Block: Detect localized shapes, font boundaries, stamp artifacts
        layers.Conv2D(64, (3, 3), activation='relu', padding='same', name='conv_2'),
        layers.MaxPooling2D((2, 2), name='pool_2'),

        # 5. Third Convolutional Block: Detect complex tamper patterns, texture gradients, edge halos
        layers.Conv2D(128, (3, 3), activation='relu', padding='same', name='conv_3'),
        layers.MaxPooling2D((2, 2), name='pool_3'),

        # 6. Flatten: Convert 2D feature maps into a 1D vector for dense layers
        layers.Flatten(name='flatten'),

        # 7. Dense Representation: Combine all visual features
        layers.Dense(128, activation='relu', name='dense_features'),

        # 8. Dropout: Mitigate overfitting by randomly zeroing 50% of activations during training
        layers.Dropout(0.5, name='dropout'),

        # 9. Output Layer: Single sigmoid neuron outputting probability P(Suspicious) in [0, 1]
        layers.Dense(1, activation='sigmoid', name='output_prediction')
    ])

    # Compile with binary crossentropy and Adam optimizer
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.0001),
        loss='binary_crossentropy',
        metrics=['accuracy']
    )

    return model


def load_screening_model(model_path=MODEL_SAVE_PATH):
    """
    Loads the trained Keras model if it exists on disk.
    Returns (model, None) if loaded successfully, or (None, error_message) if missing.
    """
    if not TF_AVAILABLE:
        return None, "TensorFlow is not installed."

    if not os.path.exists(model_path):
        return None, f"Model not trained. Run train_cnn.py first to generate '{model_path}'."

    try:
        model = tf.keras.models.load_model(model_path)
        return model, None
    except Exception as e:
        return None, f"Failed to load CNN model: {str(e)}"


def predict_document_image(model, preprocessed_image_array):
    """
    Feeds a preprocessed 224x224 RGB image array to the CNN model.
    Returns:
      prediction_label: "Suspicious" or "Normal"
      confidence: float in [0.5, 1.0] representing how certain the model is of its predicted class
      raw_probability: raw sigmoid output in [0.0, 1.0] where 1.0 means high probability of suspicious pattern
    """
    if model is None:
        raise ValueError("Model is None. Train or load the model before calling predict.")

    # Ensure shape is (1, 224, 224, 3) for batch inference
    if len(preprocessed_image_array.shape) == 3:
        input_tensor = np.expand_dims(preprocessed_image_array, axis=0)
    else:
        input_tensor = preprocessed_image_array

    # Run inference
    raw_output = model.predict(input_tensor, verbose=0)
    raw_probability = float(raw_output[0][0])

    # Threshold at 0.5 for binary classification
    if raw_probability >= 0.5:
        prediction_label = "Suspicious"
        # Confidence is the probability of the chosen class
        confidence = raw_probability
    else:
        prediction_label = "Normal"
        confidence = 1.0 - raw_probability

    return prediction_label, round(confidence, 4), round(raw_probability, 4)
