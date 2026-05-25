package br.com.academia.faceaccess.service.faces;

import java.awt.Rectangle;
import java.awt.image.BufferedImage;
import java.util.List;

public interface FaceDetector {

    List<Rectangle> detectFaces(BufferedImage image);
}
