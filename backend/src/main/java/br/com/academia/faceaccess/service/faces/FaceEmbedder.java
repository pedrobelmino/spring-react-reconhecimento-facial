package br.com.academia.faceaccess.service.faces;

import java.awt.image.BufferedImage;

public interface FaceEmbedder {

    float[] extractEmbedding(BufferedImage faceImage);
}
