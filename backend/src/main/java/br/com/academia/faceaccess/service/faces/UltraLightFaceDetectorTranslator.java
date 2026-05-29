package br.com.academia.faceaccess.service.faces;

import ai.djl.modality.cv.Image;
import ai.djl.modality.cv.output.DetectedObjects;
import ai.djl.modality.cv.output.Rectangle;
import ai.djl.ndarray.NDArray;
import ai.djl.ndarray.NDList;
import ai.djl.ndarray.types.DataType;
import ai.djl.ndarray.types.Shape;
import ai.djl.translate.Batchifier;
import ai.djl.translate.Translator;
import ai.djl.translate.TranslatorContext;
import java.awt.image.BufferedImage;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Translator for Linzaer Ultra-Light RFB-320 ONNX face detector.
 * Input: RGB image resized to 320x240, normalized with mean 127 and scale 1/128.
 * Outputs: scores [1, 4420, 2] and boxes [1, 4420, 4].
 *
 * Pre/post processing is done with plain Java arrays because the OnnxRuntime
 * NDArrayAdapter does not implement transpose / index getters.
 */
final class UltraLightFaceDetectorTranslator implements Translator<Image, DetectedObjects> {

    static final int INPUT_WIDTH = 320;
    static final int INPUT_HEIGHT = 240;
    private static final float PROB_THRESHOLD = 0.7f;
    private static final float IOU_THRESHOLD = 0.3f;

    private static final String ATTACHMENT_WIDTH = "origWidth";
    private static final String ATTACHMENT_HEIGHT = "origHeight";

    @Override
    public NDList processInput(TranslatorContext ctx, Image input) {
        ctx.setAttachment(ATTACHMENT_WIDTH, input.getWidth());
        ctx.setAttachment(ATTACHMENT_HEIGHT, input.getHeight());

        BufferedImage source = (BufferedImage) input.getWrappedImage();
        float[] chw = imageToChw(source, INPUT_WIDTH, INPUT_HEIGHT, 127f, 128f);
        Shape shape = new Shape(1, 3, INPUT_HEIGHT, INPUT_WIDTH);
        NDArray tensor = ctx.getNDManager().create(chw, shape);
        return new NDList(tensor);
    }

    @Override
    public DetectedObjects processOutput(TranslatorContext ctx, NDList list) {
        int origWidth = (int) ctx.getAttachment(ATTACHMENT_WIDTH);
        int origHeight = (int) ctx.getAttachment(ATTACHMENT_HEIGHT);
        float scaleX = (float) origWidth;
        float scaleY = (float) origHeight;

        float[] scoresData = list.get(0).toFloatArray();
        float[] boxesData = list.get(1).toFloatArray();
        int numBoxes = scoresData.length / 2;

        List<ScoredBox> candidates = new ArrayList<>();
        for (int i = 0; i < numBoxes; i++) {
            float faceScore = scoresData[(i * 2) + 1];
            if (faceScore < PROB_THRESHOLD) {
                continue;
            }

            int boxOffset = i * 4;
            float x1 = boxesData[boxOffset] * scaleX;
            float y1 = boxesData[boxOffset + 1] * scaleY;
            float x2 = boxesData[boxOffset + 2] * scaleX;
            float y2 = boxesData[boxOffset + 3] * scaleY;

            int x = Math.max(0, Math.round(Math.min(x1, x2)));
            int y = Math.max(0, Math.round(Math.min(y1, y2)));
            int width = Math.max(1, Math.round(Math.abs(x2 - x1)));
            int height = Math.max(1, Math.round(Math.abs(y2 - y1)));
            width = Math.min(width, origWidth - x);
            height = Math.min(height, origHeight - y);

            candidates.add(new ScoredBox(x, y, width, height, faceScore));
        }

        List<String> classNames = new ArrayList<>();
        List<Double> probabilities = new ArrayList<>();
        List<ai.djl.modality.cv.output.BoundingBox> boundingBoxes = new ArrayList<>();
        for (ScoredBox box : hardNms(candidates)) {
            classNames.add("face");
            probabilities.add((double) box.score());
            boundingBoxes.add(new Rectangle(box.x(), box.y(), box.width(), box.height()));
        }
        return new DetectedObjects(classNames, probabilities, boundingBoxes);
    }

    private static List<ScoredBox> hardNms(List<ScoredBox> boxes) {
        boxes.sort(Comparator.comparingDouble(ScoredBox::score).reversed());
        List<ScoredBox> picked = new ArrayList<>();
        boolean[] suppressed = new boolean[boxes.size()];

        for (int i = 0; i < boxes.size(); i++) {
            if (suppressed[i]) {
                continue;
            }
            ScoredBox current = boxes.get(i);
            picked.add(current);
            for (int j = i + 1; j < boxes.size(); j++) {
                if (suppressed[j]) {
                    continue;
                }
                if (iou(current, boxes.get(j)) > IOU_THRESHOLD) {
                    suppressed[j] = true;
                }
            }
        }
        return picked;
    }

    private static float iou(ScoredBox a, ScoredBox b) {
        int x1 = Math.max(a.x(), b.x());
        int y1 = Math.max(a.y(), b.y());
        int x2 = Math.min(a.x() + a.width(), b.x() + b.width());
        int y2 = Math.min(a.y() + a.height(), b.y() + b.height());

        int intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
        if (intersection == 0) {
            return 0f;
        }
        int union = a.width() * a.height() + b.width() * b.height() - intersection;
        return union == 0 ? 0f : intersection / (float) union;
    }

    static float[] imageToChw(BufferedImage source, int targetWidth, int targetHeight, float mean, float scale) {
        BufferedImage rgb = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB);
        var graphics = rgb.createGraphics();
        try {
            graphics.drawImage(source, 0, 0, targetWidth, targetHeight, null);
        } finally {
            graphics.dispose();
        }

        int pixels = targetWidth * targetHeight;
        float[] chw = new float[3 * pixels];
        int[] rgbData = rgb.getRGB(0, 0, targetWidth, targetHeight, null, 0, targetWidth);
        for (int i = 0; i < pixels; i++) {
            int argb = rgbData[i];
            float r = (argb >> 16) & 0xff;
            float g = (argb >> 8) & 0xff;
            float b = argb & 0xff;
            chw[i] = (r - mean) / scale;
            chw[pixels + i] = (g - mean) / scale;
            chw[(2 * pixels) + i] = (b - mean) / scale;
        }
        return chw;
    }

    @Override
    public Batchifier getBatchifier() {
        return null;
    }

    private record ScoredBox(int x, int y, int width, int height, float score) {}
}
